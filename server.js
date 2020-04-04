'use strict';
var express = require('express')();
var app = require('./app');
const config = require('./config');
var server = require('http').Server(express);
var io = require('socket.io')(server);

server.listen(config.port, () => console.log("server listening on "+config.port));
// WARNING: app.listen(80) will NOT work here!

express.use('/', app);
io.on('connection', function (socket) {
  //io.emit('feed', { text: 'hello world' });
  socket.on('join', function(data){
    io.emit('feed', { text: data + " joined the game" });
  })

});
