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
    if(this.value==null){
      this.generate();
    }
    this.dealt = true;
    return this.value;
  }
}
module.exports = Generator;
