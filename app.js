'use strict';
const express = require('express');
const {makeId, shuffle, getRandomInt} = require('./gameUtil');
const imgStore = require('./imageStore');
const Players = require('./players');
const EventEmitter = require('events');

var app = express.Router();
function sendOkStyled(res, content){
  const header = `
  <meta name="viewport" content="width=device-width, initial-scale=1"><style>
  body{margin:40px auto;padding:0 10px;max-width:650px;
    line-height:1.6;font-size:18px;font-family:sans-serif;color:#444}
  h1,h2,h3{line-height:1.2}</style><h2>`;
  const footer = `</h2>`
  res.status(200).send(header+content+footer);
}
app.get('/', async function(req, res){
  const link = "<a href='/join'>Join</a>";
  sendOkStyled(res,"Welcome to the articulate game room: " + link);
});
app.use(express.static(__dirname+'/static',{index: 'index.html'})); // Sets which page to load first
app.use('/library', imgStore.library);
app.use('/card/create', imgStore.upload20img, function addUploaded(req, res, next){
  if(req.imageUpload){
    var new_cards = req.files.map((item) => Card.fromFile(item));
    res.status(201).send(new_cards);
    cards.concat(new_cards);
    cardNotifier.emit('cards',new_cards);
  }
});


function Card(src){
  return {src: src};
}
Card.fromFile = function(multer_file){
  return new Card(multer_file.filename);
}
const cardNotifier = new EventEmitter();
var game_players = new Players();
var cards = [];
var round_cards = [];

async function cleanUp(){
  return Promise.all([imgStore.destroy]);
}

module.exports = {router: app, cleanUp: cleanUp,
  addUser: game_players.add.bind(game_players), currentUser: function(){return game_players.active;},
  getUsers:()=>game_players, getUsernames: function(){return game_players.names;},
  broadcast: cardNotifier
}; //Based off
