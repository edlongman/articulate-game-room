'use strict';
class User{
  name;
  conn;
  constructor(name, socket){
    this.name = name;
    this.conn = socket;
  }
  updateSocket(socket){
    if(this.conn&&this.conn.connected){
      return false;
    }
    this.conn = socket;
    return this;
  }
}
User.prototype.kick = function(reason){
  socket.emit('kick', reason);
}
module.exports = User;
