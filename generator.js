'use strict';
const Collection = require('./collection');
const {makeId} = require('./gameUtil');
const silently = true;
class Generator extends Collection{
  reusable = true;
  source;
  constructor(name, source, reusable){
    super(name);
    // TODO: Integrity check the source?
    this.source = source;
    if(reusable == false){
      this.reusable = false;
    }
  }
  getCards(){
    if(this.cards == null){
      this.generate(silently);
    }
    if(this.reusable){
      // Return shallow copy of cards instead of originals
      return this.cards
        .map((card)=>Object.assign({},card)) // Shallow copy
        .map((card)=>Object.assign(card, {id: makeId(7)})) //With new ID
    }
    this.cards.filter((card)=>(!card.id)) //For cards without an ID
      .map((card)=>Object.assign(card, {id: makeId(7)})) //Set a new ID
    return this.cards;
  }
}
module.exports = Generator;
