/*jshint eqnull: true */
var socket = require('socket.io-client')();
var through = require('through2');
var angular = require('angular');
var AnimationFrame = require('animation-frame');
var Keyboard = require('./keyboard');
var Hooklock = require('hooklock');

angular.module('levelDaw', [])
  .controller('mainController', function($scope, $document, $http) {
    var frameId,
        startTime,
        animationFrame = new AnimationFrame(30),
        keyboard = new Keyboard(),
        atx;

    $scope.animationFrame = animationFrame;
    $scope.audioCtx = atx = new AudioContext();

    $scope.engine = (function(){
      var osc = atx.createOscillator();
      var gain = atx.createGain();
      var length = 0.2;
      osc.connect(gain);
      gain.connect(atx.destination);
      gain.gain.value = 0;
      osc.start();
      return through.obj(function(data, enc, next){
        osc.frequency.setValueAtTime(data.note, data.timestamp);
        gain.gain.setValueAtTime(1, data.timestamp);
        gain.gain.setValueAtTime(0, data.timestamp + length);
        next();
      });
    })();

    $scope.speed = 120;
    $scope.length = 4;
    $scope.total = 240/$scope.speed*$scope.length;
    $scope.current = 0;
    $scope.planned = 0;
    $scope.stepLength = 0.1;
    $scope.isPlaying = false;
    $scope.sheet = through.obj(function(data, enc, next){
      var that = this;
      if(data instanceof Array){
        data.forEach(function(note){
          that.push(note);
        });
      } else {
        that.push(data);
      }
      next();
    });
    $scope.cleanAll = function(){
      $scope.sheet.write(false);
      $http.get('/api/clean');
    };

    $http.get('/api/all').success(function(notes){
      $scope.sheet.write(notes);
    });
    
    var hookOptions = {
      clock: function(){
        return atx.currentTime;
      },
      latency: 0.00001,
      threshold: 0.1
    },
      playhook = new Hooklock(hookOptions);

    // attach playhook with sound engine
    playhook.pipe($scope.engine);

    $scope.$watch('isPlaying', function(isPlaying){
      var current = $scope.current;
      if(isPlaying){
        startTime = atx.currentTime - current;
        $scope.planned = current;
        resync(current);
        askMore();
        animationFrame.request(updateCurrent);
      }
      function updateCurrent(){
        var cu = atx.currentTime;
        var now = cu - startTime;
        var total = $scope.total;
        if(now >= total){
          startTime += total;
          now -= total;
          $scope.planned = now;
          resync(now);
        }
        $scope.current = now;
        if($scope.isPlaying){
          askMore();
          animationFrame.request(updateCurrent);
        }
      }
    });

    $scope.$watch('speed', function(){
      $scope.total = 60 / $scope.speed * 4 * $scope.length;
    });

    $document.on('keypress', function(e){
      e.preventDefault();
      if(e.keyCode === 32){
        e.stopPropagation();
        //space bar
        $scope.$apply(function(){
          $scope.isPlaying = !$scope.isPlaying;
        });
      } else {
        var key = keyboard.pressKey(e.charCode);
        if(key != null) {
          var current = $scope.current;
          //play it
          playhook.write({
            timestamp: current,
            note: key
          });
          //rec it
          if($scope.isPlaying){
            socket.emit('writeNote', {
              timestamp: current,
              note: key
            });
            $scope.sheet.write({
              timestamp: current,
              note: key
            });
          }
        }
      }
    });

    //socket.io events
    socket.on('note', function(data){
      playhook.write(data);
    });

    function resync(now){
      playhook.write({
        type: 'sync',
        timestamp: now
      });
    }
    function askMore(){
      var planned = $scope.planned;
      var current = $scope.current;
      var stepLength = $scope.stepLength;
      if(planned - current < stepLength) {
        var range = {
          gt: planned,
          lt: planned + stepLength * 2
        };
        //ask more
        socket.emit('readRange', range);
        $scope.planned = $scope.planned + stepLength * 2;
      }
    }
  })
  .directive('timeline', require('./timeline'));
