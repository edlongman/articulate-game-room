'use strict';

function User(name, socket){
  return {name: name, conn: socket};
}
User.prototype.updateSocket = function(socket){
  //Check it is closed before
  if((users[idx].socket)&&users[idx].socket.connected){
    return false;
  }
  else{
    users[idx].socket = socket;
    return true;
  }
}
User.prototype.kick = function(reason){
  socket.emit('kick', reason);
}
module.exports = User;
