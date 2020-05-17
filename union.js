'use strict';
const EventEmitter = require('events');
const Generator = require('./generator');
const GeneratorBase = require('./generator-base');
const {getRandomInt, shuffle, makeId} = require('./gameUtil');
// TODO: extend the generator class
class Union extends GeneratorBase{
  groups = [];
  constructor(name, groups, shuffle){
    if(name==false){
      name = "Union"
    }
    super(name);
    if(shuffle == true){
      this.shuffle = true;
    }
    // Listen for regenerate events
    for(var i=0;i<groups.length;i++){
      groups[i].on("regenerate", this.generate.bind(this));
    }
    this.groups=groups;
  }
  generateByIdx(idx){
    const new_card = this.groups[idx].getCards();
    if(new_card instanceof Array){ // TODO: Reverse to check first method
      for(var j=0;j<new_card.length;j++){
        new_card[j].id = makeId(7); //TODO: Card class should auto gen this id
        this.cards = this.cards.concat(new_card[j]);
      }
    }
    else{
      console.warn("Unknown Generator output");
    }
  }
  generate(silent){
    this.cards = [];
    for(var i=0; i<this.groups.length; i++){
      this.generateByIdx(i);
    }
    // Exit early to generate without event emitting
    if(silent == true)return this;
    this.emit("regenerate", this.name + " regenerated");
    return this;
  }
  extend(new_group){
    if(this.cards == null){
      this.cards = [];
    }
    if(new_group instanceof GeneratorBase){
      const new_idx = this.groups.push(new_group) - 1;
      this.generateByIdx(new_idx);
      new_group.on("regenerate", this.generate.bind(this));
      this.emit("regenerate", this.name + " extended");
    }
    else if(new_group instanceof Array){
      new_group.forEach((item)=>this.extend(item));
    }
    else{
      console.warn("Unknown card type");
    }
    return this;
  }
}
exports.Union = Union;

class Duplicator extends Union{
  _multiplier = 0;
  constructor(name, groups, shuffle, multiple){
    if(arguments.length==3){
      multiple = shuffle;
      shuffle = null;
    }
    if(!name){
      name = "Duplicator"
    }
    super(name, groups, shuffle);
    this.multiplier = multiple;
  }
  generateByIdx(idx){ //TODO: match this structure to that of Union
    const new_card = this.groups[idx].getCards();
    for(var j=0;j<new_card.length;j++){
      if(new_card instanceof Object){
        this.cards = this.cards.concat(
          Array(this.multiplier).fill(new_card));
      }
      else{
        console.warn("Unknown card type");
      }
    }
    this.emit("regenerate", "Duplicator");
  }
  set multiplier(value){
    if(!(Number.isFinite(value)&&Number.isInteger(value))){
      throw Error("Can only duplicate by integer or 0");
    }
    if(value<0){ //Permit but correct neg integers
      value = 0;
    }
    this._multiplier = value;
  }
  get multiplier(){
    return this._multiplier;
  }
}
exports.Duplicator = Duplicator;
