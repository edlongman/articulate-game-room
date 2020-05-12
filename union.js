'use strict';
const EventEmitter = require('events');
const Generator = require('./generator');
const {getRandomInt, shuffle, makeId} = require('./gameUtil');
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
  generateByIdx(idx){
    const new_card = this.groups[idx].undealt;
    if(new_card == false){
      return false;
    }
    if(new_card instanceof Array){
      for(var j=0;j<new_card.length;j++){
        new_card[j].id = makeId(7); //TODO: Card class should auto gen this id
        this.cards = this.cards.concat(new_card[j]);
      }
    }
    else if(new_card instanceof Object){ //TODO: Make this instanceof Card
      new_card.id = makeId(7); //TODO: Card class should auto gen this id
      this.cards = this.cards.concat(new_card);
    }
  }
  generate(){
    this.cards = [];
    for(var i=0; i<this.groups.length; i++){
      this.generateByIdx(i);
    }
    this.dealt = false;
    this.emit("regenerate", "Union regenerated");
  }
  get undealt(){
    return this.cards.filter((item)=>item.dealt!==true);
  }
  extend(new_group){
    if(new_group instanceof Generator || new_group instanceof Union){
      const new_idx = this.groups.push(new_group) - 1;
      this.generateByIdx(new_idx);
      new_group.on("regenerate", this.generate.bind(this));
      this.emit("regenerate", "Union extended");
    }
    else if(new_group instanceof Array){
      new_group.forEach((item)=>this.extend(item));
    }
    else{
      console.warn("Unknown card type")
    }
    return this;
  }
  draw(){//Take card
    const undealt = this.undealt;
    if(undealt.length<1){
      return false;
    }
    var idx = 0;
    if(this.shuffle)
      idx = getRandomInt(0, undealt.length - 1);
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
    this.multiplier = multiple;
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
