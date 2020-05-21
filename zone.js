'use strict';
const Collection = require('./collection')
const {makeId} = require('./gameUtil');

function Zone(collection){
  if(!(collection instanceof Collection))return null;
  collection.zoneId = makeId(7);
  collection.masked = false;
  return collection;
}
module.exports = Zone;
