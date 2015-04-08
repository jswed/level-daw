var async = require('async');
var through = require('through2');
var levelup = require('levelup')('./db', {});

var i = 0;

function prefix(num, len){
  return (Array(len).join('0') + num).slice(-len);
}

async.whilst(function(){
  // from 0 to 999
  return i < 1000;
}, function(done){
  // prepare kv
  var key = 'something:'+ prefix(i++, 5);
  var value = Math.random();

  // put it in
  levelup.put(key, value, done);
}, function(err){

  // get results as read stream
  levelup.createReadStream({
    gt: "something:00900",
    lt: "something:00999"
  }).pipe(through.obj(function(data, enc, done){
    console.log(data);
    done();
  }));
});

