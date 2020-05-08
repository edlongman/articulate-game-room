'use strict';
const EventEmitter = require('events');
const Generator = require('./generator');
const {getRandomInt, shuffle} = require('./gameUtil');
// TODO: extend the generator class
class Union extends EventEmitter{
  groups = [];
  cards = [];
  shuffle = true;
  dealt = false;
  constructor(groups){
    super();
    for(var i=0;i<groups.length;i++){
      groups[i].on("regenerate", this.generate.bind(this));
    }
    // TODO: Listen for regenerate events
    this.groups=groups;
  }
  generate(){
    this.cards = [];
    for(var i=0; i<this.groups.length; i++){
      const new_card = this.groups[i].deal();
      if(new_card instanceof Array){
        for(var j=0;j<new_card.length;j++){
          new_card[j].dealt = false;
          this.cards = this.cards.concat(new_card[j]);
        }
      }
      else if(new_card instanceof Object){ //TODO: Make this instanceof Card
        new_card.dealt=false;
        this.cards = this.cards.concat(new_card);
      }
    }
    this.dealt = false;
    this.emit("regenerate", "Union regenerated");
  }
  get undealt(){
    return this.cards.filter((item)=>item.dealt!==true);
  }
  extend(new_group){
    // TODO: Listen for regenerate events?
    new_group.on("regenerate", this.generate.bind(this));
    this.groups.push(new_group);
    return this;
  }
  draw(){//Take card
    const undealt = this.undealt;
    const idx = getRandomInt(0, undealt.length - 1);
    undealt[idx].dealt=true;
    return undealt[idx];
  }
  deal(){
    const undealt = this.undealt;
    this.dealt = true;
    for(var i=0; i<undealt.length; i++){
      undealt[i].dealt = true;
    }
    if(!this.shuffle)
      return undealt;
    return shuffle(undealt);
  }
}
exports.Union = Union;

class Duplicator extends Union{
  multiplier =0;
  constructor(groups, multiple){
    super(groups);
    for(var i=0;i<this.groups.length;i++){
      if(this.groups[i] instanceof Generator){
        this.groups[i].on('regenerate', this.generate.bind(this));
      }
    }
  }
  generate(){
    this.cards = [];
    for(var i=0; i<this.groups.length; i++){
      const new_card = this.groups[i].deal();
      if(new_card instanceof Object){ //TODO: Make this instanceof Card
        new_card.dealt=false;
        this.cards = this.cards.concat(
          Array(this.multiplier).fill(new_card));
      }
    }
    this.emit("regenerate", "Duplicator");
  }
}
exports.Duplicator = Duplicator;
