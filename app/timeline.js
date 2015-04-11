var when = require('when');
var angular = require('angular');
var AnimationFrame = require('animation-frame');

module.exports = function(){
  return {
    link: function(scope, element, attrs){

      var animationFrame = scope.animationFrame;
      var cursor = angular.element("<span></span>").addClass("play-cursor");
      var previous;
      var noteDoms = {};
      element.append(cursor);

      animationFrame.request(updateCursor);
      function updateCursor(){
        if(previous !== undefined && scope.current !== undefined && previous !== scope.current){
          //update cursor location
          cursor.css({
            'transform': 'translateX(' + (element.width() * scope.current / scope.total) + 'px)'
          });
        }
        previous = scope.current;
        animationFrame.request(updateCursor);
      }

      scope.$watch('length', function(length){
        if(length){
          var i, bar;
          for(i=0;i<length;i++){
            bar = angular.element("<span></span>").addClass("bar").css({
              width: (1/length*100) + '%'
            });
            element.append(bar);
          }
        }
      });

      element.on('click', function(e){
        scope.$apply(function(){
          scope.current = (e.pageX - element.offset().left) / element.width() * scope.total;
        });
      });

      scope.sheet.on('data', function(note){
        if(!note){
          //clean all
          element.find('.note').remove();
          noteDoms = {};
        } else {
          var noteDom = noteDoms[note.timestamp] || createNewNode(note);
          if(noteDom.note !== note.note){
            var grey = Math.floor(note.note / 880 * 255);
            noteDom.note = note.note;
            noteDom.css({
              'transform': 'translateY(' + ((1-Math.log2(note.note/440))*element.height()) + 'px)'
            });
          }
        }
      });

      function createNewNode(note){
        var dom = $('<div></div>').addClass('note').css({
          left: (element.width() * note.timestamp / scope.total) + 'px'
        });
        element.append(dom);
        noteDoms[note.timestamp] = dom;
        return dom;
      }
    }
  };
};
