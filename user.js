'use strict';
const EventEmitter = require('events');
const user_timeout = 5000;//ms
class User extends EventEmitter{
  name;
  conn;
  hand=[];

  constructor(name, socket){
    super();
    this.name = name;
    this.conn = socket;
    if(this.conn){
      this.conn.on('disconnect', () => {
        if(this.conn&&this.conn.connected)return false;
        this.emit('disconnect', this.name);
      }, user_timeout);
    }
    else{
      if(this.conn&&this.conn.connected)return false;
      this.emit('disconnect', this.name);
    }
  }
  updateSocket(socket){
    if(this.conn&&this.conn.connected){
      return false;
    }
    this.conn = socket;
    this.conn.on('disconnect', () => {
      if(this.conn&&this.conn.connected)return false;
      this.emit('disconnect', this.name);
    });
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
  subscribeZone(zone){
    var zone_id = zone.id;
    this.conn.emit("zone_new", {id: zone_id, name: zone.name});
    zone.on("deal", (card)=>{
      this.conn.emit("zone_deal", Object.assign({zone: zone_id}, card));
    })
    zone.on("retrieve",(card)=>{
      this.conn.emit("zone_retrieve", Object.assign({zone: zone_id}, card));
    })
  }
}
User.prototype.kick = function(reason){
  if(!this.conn)return false;
  this.conn.emit('kick', reason);
  this.conn.disconnect();
  return true;
}
module.exports = User;
