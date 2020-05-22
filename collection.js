'use strict';
const EventEmitter = require('events');
const {getRandomInt, shuffle, makeId} = require('./gameUtil');
class Collection extends EventEmitter{
  name = "Collection";
  cards = null;
  shuffle = false;
  constructor(name){
    super();
    if(new String(name) == name){
      this.name = String(name);
    }
  }
  add(card){
    if(this.cards == null){
      this.cards = [];
    }
    if(card instanceof Array){
      card.forEach((item)=>this.add(item));
    }
    else{
      this.cards.push(card);
      this.emit('add', card);
    }
  }
  remove(card){
    const removee_id = this.cards.map((item) => item.id).indexOf(card.id);
    if(removee_id<0){
      return false;
    }
    const removee = (this.cards.splice(removee_id, 1))[0];
    this.emit('retrieve', removee);
    return removee;
  }
  empty(){
    var removed = [];
    while(this.cards && this.cards.length>0){
      removed.push(this.remove(this.cards[this.cards.length-1]));
    }
    this.emit("flush");
    return removed;
  }
  getCards(){
    return this.cards || [];
  }
  get undealt(){
    return this.getCards().filter((item)=>item.dealt!==true);
  }
  deal(){
    var candidates = this.undealt;
    if(this.shuffle){
      candidates = shuffle(candidates);
    }
    return candidates.map((card)=>
      Object.assign(this.remove(card), {dealt: true})
    );
  }
  draw(){//Take card
    const undealt = this.undealt;
    if(undealt.length<1){
      return false;
    }
    var drawIdx = 0;
    if(this.shuffle)
      drawIdx = getRandomInt(0, undealt.length - 1);
    return Object.assign(this.remove(undealt[drawIdx]), {dealt: true});
  }
}
module.exports = Collection;
