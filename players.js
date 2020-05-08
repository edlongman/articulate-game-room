'use strict';
const User = require('./user');

class Players extends Array{
  activeName = null;
  byName(name){
    //Check user exists
    var idx = this.map((item) => item.name).indexOf(name);
    if(idx==-1)return false;
    return this[idx];
  }
  get active(){
    //Check user exists
    const idx = this.map((item) => item.name).indexOf(this.activeName);
    if(idx==-1)return false;
    return users[idx];
  }
  add(name, socket){
    //If user exists see if can update the socket (only if socket closed)
    const userWithName = this.byName(name);
    if(userWithName!=false){
      return userWithName.updateSocket(socket);
    }
    return this.push(new User(name, socket));
  }
  deal(cards){
    for(var i=0; this.length>0, i<cards.length; i++){
      this[i%this.length].receiveDeal(cards[i]);
    }
  }
  get names(){
    return this.map((item) => item.name);
  }
}
module.exports = Players;
