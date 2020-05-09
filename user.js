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
    this.hand.push(Object.assign({},card));//TODO: Card class should shallow copy this
    this.conn.emit("hand_deal", card);
  }
  flush(){
    this.hand.forEach((card) => {
      this.conn.emit("hand_retrieve", card);
    })
    this.conn.emit("hand_flush");
    const hand_cache = this.hand;
    this.hand = [];
    return hand_cache;
  }
}
User.prototype.kick = function(reason){
  socket.emit('kick', reason);
}
module.exports = User;
