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
    //If user exists and is connected, kick the impersonator
    const userWithName = this.byName(name);
    if(userWithName!=false&&userWithName.socket&&userWithName.socket.connected){
      return false;
    }
    //Disconnected user with name exists, hijack the user
    if(userWithName!=false){
      //Give the new connection to the old user
      userWithName.socket = socket;
      return userWithName;
    }

    return this.push(new User(name, socket));
  }
  get names(){
    return this.map((item) => item.name);
  }
}
module.exports = Players;
