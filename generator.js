'use strict';
const GeneratorBase = require('./generator-base');
const silently = true;
class Generator extends GeneratorBase{
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
      return this.cards.map((card)=>Object.assign({},card))
    }
    return this.cards;
  }
}
module.exports = Generator;
