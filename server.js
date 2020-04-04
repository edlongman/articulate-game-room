'use strict';
var express = require('express')();
var app = require('./app');
const config = require('./config');
var server = require('http').Server(express);
var io = require('socket.io')(server);

server.listen(config.port, () => console.log("server listening on "+config.port));
// WARNING: app.listen(80) will NOT work here!


express.use('/', app.router);


function currentUsersString(){
  return "Current players are: " + app.getUsers().join(", ");
}
io.on('connection', function (socket) {
  //io.emit('feed', { text: 'hello world' });
  socket.on('join', function(data){
    socket.emit('feed', {text: currentUsersString()})
    if(app.addUser(data)){
      socket.broadcast.emit('feed', { text: data + " joined the game" });
    }
  })

});
