'use strict';
class Generator{};//to implement
class Card{
  generator=null;//contains either an image file, or other card class that implements a generator function
  value=null;
  dealt=false;
  constructor(source){
    this.generator = source;
  }
  static fromFile(multer_file){
    return new Card({src:multer_file.filename});
  }

  generate(){
    if(typeof(this.generator)=='function'){
      this.value = generator();
      return this;
    }
    if(this.generator instanceof Generator){
      this.value = this.generator.draw();
      return this;
    }
    this.value  = this.generator;
    return this;
  }
  deal(){
    this.dealt = true;
    return this;
  }
}
module.exports = Card;
