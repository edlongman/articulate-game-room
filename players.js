'use strict';
const User = require('./user');

class Players extends Array{
  activeName = null;
  idxByName(name){
    //Check user exists
    var idx = this.map((item) => item.name).indexOf(name);
    if(idx==-1)return false;
    return idx;
  }
  byName(name){
    //Check user exists
    const idx=this.idxByName(name);
    if(idx === false)return idx;
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
    const new_len = this.push(new User(name, socket));
    return this[new_len - 1];
  }
  deal(cards){
    for(var i=0; this.length>0 && i<cards.length; i++){
      this[i%this.length].hand.draw(cards[i]);
    }
  }
  emptyHands(card_dest){
    this.forEach((user)=>{
      const discarded = user.hand.flush();
      for(var j=0;j<discarded.length;j++){
        card_dest.emit('discard', discarded[j]);
      }
    });
  }
  feedDiscard(card){
    this.forEach((user)=>{
      //TODO: Check for user connected?
      user.conn.emit("feed", {text: "Discarded text:" + card.text + ", src: " + card.src});
    })
  }
  subscribeZone(zone){
    this.forEach((user) => {
      user.subscribeZone(zone);
    });

  }
  removeByName(name){
    const user_idx = this.idxByName(name);
    if(user_idx!==false){
      const removee = (this.splice(user_idx, 1))[0];
      return removee.kick({text: 'User timeout'});
    }
  }
  get names(){
    return this.map((item) => item.name);
  }
}
module.exports = Players;
