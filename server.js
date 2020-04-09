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
  return "Current players are: " + app.getUsernames().join(", ");
}
io.on('connection', function (socket) {
  //io.emit('feed', { text: 'hello world' });
  socket.on('join', function(name){
    if(app.addUser(name, socket)){
      socket.broadcast.emit('feed', { text: name + " joined the game" });
    }
    else if(app.updateUser(name, socket)){
      socket.emit('feed', {text: currentUsersString()});
    }
    else{
      socket.emit('feed', {text: "Could not join. User occupied"});
    }
  });
  socket.on('admin', function(name){
    socket.emit('feed', {text: "Admin feed connected"});
  });
  socket.on('next', function(data){
    if(app.currentUser().conn == socket){
      // Allowed to ask for next
      app.next();
    }
  });

});
