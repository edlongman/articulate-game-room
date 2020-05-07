'use strict';
const express = require('express');
const {makeId, shuffle, getRandomInt} = require('./gameUtil');
const imgStore = require('./imageStore');
const Players = require('./players');
const EventEmitter = require('events');
const {Image, Dice} = require('./cards')
const {Union, Duplicator} = require('./union')
var app = express.Router();
// const nunjucks = require('nunjucks');
// nunjucks.configure(,{
//   express: express
// });
// env.addGlobal("",express.mountpath);
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
    var new_cards = req.files.map((item) => (new Image(item)).generate().value);
    res.status(201).send(new_cards);
    cards = cards.concat(new_cards);
    cardNotifier.emit('cards',new_cards);
  }
});

const cardNotifier = new EventEmitter();
var game_players = new Players();
var cards = [];
var round_cards = [];
var game = null;
function adminStart(admin_socket){
  var mini_chameleon_dice = new Dice(['A1','B2', 'C3', 'D4']);
  game = {
    dice: mini_chameleon_dice,
    duplicator: new Duplicator([mini_chameleon_dice], game_players.length)
  }
  admin_socket.on("roll",game.dice.generate.bind(game.dice));
  game.duplicator.on("regenerate", (info)=>{
    cardNotifier.emit("regenerate", info);
  });
  admin_socket.emit("enable_action", {id: "roll", name: "Reroll the Chameleon Dice"})
}

async function cleanUp(){
  return Promise.all([imgStore.destroy]);
}

module.exports = {router: app, cleanUp: cleanUp,
  addUser: game_players.add.bind(game_players), currentUser: function(){return game_players.active;},
  getUsers:()=>game_players, getUsernames: function(){return game_players.names;},
  broadcast: cardNotifier, adminStart: adminStart
}; //Based off
