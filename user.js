'use strict';
const EventEmitter = require('events');
const Zone = require('./zone');
const USER_TIMEOUT = 10000;//ms

class User extends EventEmitter{
  name;
  conn;
  hand = new Zone;

  constructor(name, socket){
    super();
    this.name = name;
    this.conn = socket;
    this.hand.name = "Hand";
    this.subscribeDefaults();
    if(this.conn){
      this.conn.on('disconnect', this.beginDisconnectTimeout.bind(this));
    }
    else{
      this.conn = new EventEmitter(); // TODO: Remove hack with Player observer class
      this.emit('disconnect', this.name);
    }
  }
  subscribeDefaults(){
    this.subscribeZone(this.hand);
  }
  beginDisconnectTimeout(){
    setTimeout(() => {
      if(this.conn&&this.conn.connected)return false;
      this.emit('disconnect', this.name);
    }, USER_TIMEOUT)
  }
  updateSocket(socket){
    if(this.conn&&this.conn.connected){
      return false;
    }
    this.conn = socket;
    this.conn.on('disconnect', this.beginDisconnectTimeout.bind(this));
    //TODO: this is a horrible quick fix.
    // Proper recording of connected zones required
    // in order to automatically transmit the state
    // when a user connects but without rebinding
    this.sendZone(this.hand);
    return this;
  }
  sendZone(zone){
    var zone_id = zone.id;
    if(this.conn){
      this.conn.emit("zone_new", {id: zone_id, name: zone.name, masked: zone.masked});
      zone.cards.forEach(
        (card)=>this.conn.emit("zone_deal", Object.assign({zone: zone_id}, card))
      );
    }
  }
  subscribeZone(zone){
    var zone_id = zone.id;
    this.sendZone(zone);
    zone.on("deal", (card)=>{
      if(this.conn)
      this.conn.emit("zone_deal", Object.assign({zone: zone_id}, card));
    })
    zone.on("retrieve",(card)=>{
      if(this.conn)
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
