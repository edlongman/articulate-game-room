'use strict';
const Generator = require('./generator');
const {getRandomInt} = require('./gameUtil');
class Image extends Generator{
  source = null;
  constructor(multer_file){
    super();
    this.source = {src:multer_file.filename};
    this.reusable = false;
  }

  generate(){
    this.dealt = false;
    this.value  = this.source;
    this.emit("regenerate");
    return this;
  }
}
exports.Image = Image;

class Dice extends Generator{
  sides = [];
  constructor(side_values){
    super();
    if(!(this.sides instanceof Array)){
      throw Error('Unknown dice sides');
    }
    this.sides = side_values;
  }
  generate(){
    this.dealt = false;
    const sideCount= this.sides.length
    if(sideCount<=0){
      this.value=null;
      return this;
    }
    this.value = {text: "Dice roll: " + this.sides[getRandomInt(0, sideCount-1)]};
    this.emit("regenerate");
    return this;
  }
}
exports.Dice = Dice;
