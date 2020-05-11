'use strict';
const EventEmitter = require('events');
const {makeId} = require('./gameUtil');

class Zone extends EventEmitter{
  drain = null;
  cards = [];
  name = 'Zone ';
  id = makeId(7);
  draw(card){
    this.cards.push(Object.assign({},card));
    this.emit('deal', card);
  }
  retrieve(card){
    const removee_id = this.cards.map((item) => item.id).indexOf(card.id);
    if(removee_id<0){
      return false;
    }
    const removee = (this.cards.splice(removee_id, 1))[0];
    this.emit('retrieve', removee);
  }
  flush(){
    this.cards.forEach(this.retrieve.bind(this));
    this.emit("flush");
    const card_cache = this.cards;
    this.cards = [];
    return card_cache;
  }
}
module.exports = Zone;
