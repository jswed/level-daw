var $ = require('jquery');

// calculate note frequencies
var _factor = Math.pow(2, (1/12));
var factors = [];
var i;
factors[0] = 1;
for(i=1;i<12;i++){
  factors[i] = factors[i-1] * _factor;
}
factors[12] = 2;

// keys
var keys = "awsedftgyhujk".split('').reduce(function(previous, key, i){
  previous[key.charCodeAt(0)] = i;
  return previous;
}, {});

function Keyboard(){
  if(!(this instanceof Keyboard)) return new Keyboard();
  this.octave = 1;
}

Keyboard.prototype.setOctave = function(octave){
  this.octave = octave;
};

Keyboard.prototype.pressKey = function(key){
  return keys[key] !== undefined ? this.note(keys[key]) : null;
};

Keyboard.prototype.note = function(idx){
  return this.octave * 440 * factors[idx];
};

module.exports = Keyboard;
