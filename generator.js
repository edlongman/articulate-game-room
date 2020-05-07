'use strict';
const EventEmitter = require('events');
class Generator extends EventEmitter{
  value=null;
  dealt=false;
  constructor(){
    super();
  }
  generate(){
    console.warn("Unimplemented");
  }
  deal(){
    this.dealt = true;
    return this.value;
  }
}
module.exports = Generator;
