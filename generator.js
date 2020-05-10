'use strict';
const EventEmitter = require('events');
class Generator extends EventEmitter{
  value=null;
  dealt=false;
  reusable = true; // TODO: Change this to not reset the reusable property on generate
  constructor(){
    super();
  }
  generate(){
    console.warn("Unimplemented");
  }
  deal(){
    if(this.dealt){
      return false;
    }
    if(this.value==null){
      this.generate();
    }
    if(!this.reusable){
      this.dealt = true;
    }
    return this.value;
  }
}
module.exports = Generator;
