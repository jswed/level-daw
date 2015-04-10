/* jshint esnext: true, noyield: true */

var http = require('http');
var path = require('path');
var util = require('util');
var through = require('through2');

//leveldb
var db = require('levelup')('./db', {
  valueEncoding: 'json'
});

//koa
var koa = require('koa');
var koaStatic = require('koa-static');
var koaWatchify = require('koa-watchify');
var koaLess = require('koa-less');
var route = require('koa-route');
var app = koa();

//bundle.js
var browserify = require('browserify');
var watchify = require('watchify');
var bundle = browserify({
  entries: [path.join(__dirname, 'app/main')],
  cache: {},
  packageCache: {}
});
app.use(route.get('/js/bundle.js', koaWatchify(watchify(bundle))));

//less
app.use(koaLess(path.join(__dirname, 'public')));

//static
app.use(koaStatic(path.join(__dirname, 'public')));

//http server
var server = http.createServer(app.callback());

//socket.io
var io = require('socket.io')(server);

io.on('connection', function(socket){
  socket.on('writeNote', function(data){
    db.put(data.timestamp, data);
  });
  socket.on('readRange', function(data){
    data = data || {};
    db.createReadStream({
      gt: data.gt,
      lt: data.lt,
      keys: false
    }).on('data', function(data){
      socket.emit('note', data);
    });
  });
});

//UP!
server.listen(3000);
console.log("BOOT!");

