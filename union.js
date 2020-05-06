'use strict';
const EventEmitter = require('events');
const {getRandomInt, shuffle} = require('./gameUtil');
// TODO: extend the generator class
class Union extends EventEmitter{
  groups = [];
  cards = [];
  shuffle = true;
  constructor(groups){
    // TODO: Listen for regenerate events
    this.groups=groups;
  }
  generate(){
    this.cards = [];
    for(var i=0; i<groups.length; i++){
      this.cards = this.cards.concat(groups[i].redeal());
    }
    this.emit("regenerate");
  }
  get undealt(){
    return this.cards.filter((item)=>!item.dealt);
  }
  extend(new_group){
    // TODO: Listen for regenerate events?
    this.groups.push(new_group);
    return this;
  }
  draw(){//Take card
    const undealt = this.undealt();
    const idx = getRandomInt(0, undealt.length - 1);
    return undealt[idx].deal();
  }
  deal(){
    const undealt = this.undealt();
    for(var i=0; i<undealt.length; i++){
      undealt[i].deal();
    }
    if(!this.shuffle)
      return undealt;
    return shuffle(undealt);
  }
}
