'use strict';
const EventEmitter = require('events');
const Zone = require('./zone');
const user_timeout = 5000;//ms
class User extends EventEmitter{
  name;
  conn;
  hand = new Zone;

  constructor(name, socket){
    super();
    this.name = name;
    this.conn = socket;
    this.hand.name = "Hand";
    if(this.conn){
      this.conn.on('disconnect', () => {
        if(this.conn&&this.conn.connected)return false;
        this.emit('disconnect', this.name);
      }, user_timeout);
      this.subscribeZone(this.hand);
    }
    else{
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
    this.subscribeZone(this.hand);
    return this;
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
    zone.cards.forEach(
      (card)=>this.conn.emit("zone_deal", Object.assign({zone: zone_id}, card))
    );
  }
}
User.prototype.kick = function(reason){
  if(!this.conn)return false;
  this.conn.emit('kick', reason);
  this.conn.disconnect();
  return true;
}
module.exports = User;
