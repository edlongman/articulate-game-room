'use strict';
var express = require('express')();
var app = require('./app');
const config = require('./config');
const stoppable = require('stoppable');
const graceful_limit = 20000; // 20s to do gracefully shutdown
var server = stoppable(require('http').Server(express), graceful_limit);
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
      socket.emit('feed', {text: currentUsersString()});
    }
    else{
      socket.emit('kick', {text: "Could not join. User occupied"});
    }
  });
  socket.on('admin', function(name){
    socket.emit('feed', {text: "Admin feed connected"});
  });
  socket.on('next', function(data){
    if(app.currentUser()&&app.currentUser().conn == socket){
      // Allowed to ask for next
      app.next();
    }
  });

});

app.broadcast.on('cards', function(cardList){
  for(var i=0;i<cardList.length;i++){
    io.emit('feed', {text: 'New card ' + cardList[i].src});
  }
})

// Handle ^C
process.on('SIGINT', function shutdown(){
  server.stop();
  app.cleanUp()
  .then(process.exit(0))
  .catch((err)=>{
    console.log("Could not cleanUp app. There may be orphaned files");
    process.exit(1);
  })
});
