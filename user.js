'use strict';
class User{
  name;
  conn;
  hand=[];

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
  receiveDeal(card){
    this.hand.push(card);
    this.conn.emit("hand_deal", card);
  }
  flush(){
    for(var i=0;i<this.hand.length;i++){
      this.conn.emit("hand_retrieve", card);
    }
    this.conn.emit("hand_flush", card);
  }
}
User.prototype.kick = function(reason){
  socket.emit('kick', reason);
}
module.exports = User;
