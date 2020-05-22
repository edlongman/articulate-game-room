'use strict';
const Generator = require('./generator');
const {getRandomInt} = require('./gameUtil');
class Image extends Generator{
  constructor(name, multer_file, reusable){
    if(reusable != true){ // Default image behaviour is non-reusable
      reusable = false;
    }
    super(name, {src:multer_file.filename}, reusable);
    this.reusable = false;
  }

  generate(silent){
    this.empty();
    this.add(this.source);
    if(silent == true)return this;
    this.emit("regenerate", this.name + " regenerated");
    return this;
  }
}
exports.Image = Image;

class Dice extends Generator{
  constructor(name, side_values, reusable){
    if(!(side_values instanceof Array)){
      throw Error('Unknown dice sides');
    }
    super(name, side_values, reusable);
  }
  generate(silent){
    const sideCount = this.source.length;
    this.empty();
    if(sideCount<=0){
      return this;
    }
    this.add([{
      text: "Dice roll: " + this.source[getRandomInt(0, sideCount-1)]
    }]);
    // Exit early to generate without event emitting
    if(silent == true)return this;
    this.emit("regenerate", this.name + " regenerated");
    return this;
  }
}
exports.Dice = Dice;
