'use strict';
const EventEmitter = require('events');
const {getRandomInt, shuffle, makeId} = require('./gameUtil');
const silently = true;
class GeneratorBase extends EventEmitter{
  name = "GeneratorBase";
  cards = null;
  shuffle = false;
  constructor(name){
    super();
    if(new String(name) == name){
      this.name = String(name);
    }
  }
  generate(){
    console.warn("Unimplemented");
  }
  getCards(){
    if(this.cards == null){
      this.generate(silently);
    }
    return this.cards;
  }
  get undealt(){
    return this.getCards().filter((item)=>item.dealt!==true);
  }
  deal(){
    var candidates = this.undealt;
    if(this.shuffle){
      candidates = shuffle(candidates);
    }
    return candidates.map((card)=>Object.assign(card, {dealt: true}))
  }
  draw(){//Take card
    const undealt = this.undealt;
    if(undealt.length<1){
      return false;
    }
    var drawIdx = 0;
    if(this.shuffle)
      drawIdx = getRandomInt(0, undealt.length - 1);
    return Object.assign(undealt[drawIdx], {dealt: true});
  }
}
module.exports = GeneratorBase;
