'use strict';
const express = require('express');
const {makeId, shuffle, getRandomInt} = require('./gameUtil');
const imgStore = require('./imageStore');
const User = require('./user');
const Players = require('./players');
const EventEmitter = require('events');
const {Image, Dice} = require('./cards')
const {Union, Duplicator} = require('./union')

var httpapp = express.Router();
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
httpapp.get('/', async function(req, res){
  const link = "<a href='"+req.baseUrl+"/index.html'>Join</a>";
  sendOkStyled(res,"Unimplemented page, Go to " +link);
});
httpapp.use(express.static(__dirname+'/static',{index: 'index.html'})); // Sets which page to load first
httpapp.use('/library', imgStore.library);
httpapp.use('/card/create', imgStore.upload20img, function addUploaded(req, res, next){
  if(req.imageUpload){
    var new_cards = req.files.map((item) => (new Image(item)).generate().value);
    res.status(201).send(new_cards);
    cards = cards.concat(new_cards);
    game.emit('cards',new_cards);
  }
});

var cards = [];
var round_cards = [];
class ChameleonGame extends EventEmitter{
  duplicator = null;
  dealer_set = null;
  dice = new Dice(['A1','A2','A3','A4',
                   'B1','B2','B3','B4',
                   'C1','C2','C3','C4',
                   'D1','D2','D3','D4']);
  chameleon_card = new Dice(['You are the chameleon']);
  players = new Players();
  admin = new User("Admin", null);
  constructor(){
    super();
    this.duplicator=new Duplicator([this.dice], this.players.length);
    this.dealer_set = new Union([this.duplicator, this.chameleon_card]);
    this.dealer_set.on("regenerate", (info)=>{
      game.emit("regenerate", info);
    });
  }
  connectAdmin(socket){
    if(!this.admin.updateSocket(socket)){
      return false;
    }
    this.admin.conn.on("roll",this.dice.generate.bind(this.dice));
    this.admin.conn.emit("enable_action", {id: "roll", name: "Reroll the Chameleon Dice"});
    this.admin.conn.on("deal",this.deal.bind(this));
    this.admin.conn.emit("enable_action", {id: "deal", name: "Deal the cards to the players"});
    return true;
  }
  addPlayer(name, socket){
    if (this.players.add(name, socket)){
      //Notify the other players of joining
      socket.broadcast.emit('feed', { text: name + " joined the game" });
      socket.emit('feed', {text: this.currentPlayersString()});
      this.duplicator.multiplier = this.players.length;
      if(this.duplicator.multiplier<0){
        this.duplicator.multiplier = 0;
      }
    }
    else{
      return false
    }
  }
  deal(){
    this.players.deal(this.dealer_set.deal())
  }
  currentPlayersString(){
    "Current players are: " + this.players.names.join(", ")
  };
}
var game = new ChameleonGame();
var io = null; //Gets overwritten later copy-listeners may be useful

function connect(socket_io){
  io = socket_io;
  io.on('connection', function (socket) {
    //io.emit('feed', { text: 'hello world' });
    socket.on('join', function(name){
      if(game.addPlayer(name, socket)){
        socket.emit('feed', {text: "User socket connected"});
      }
      else{
        socket.emit('kick', {text: "Could not join. User occupied"});
      }
    });
    socket.on('admin', function(){
      if(game.connectAdmin(socket)){
        socket.emit('feed', {text: "Admin socket connected"});
      }
      else{
        socket.emit('kick', {text: "Could not join. Admin occupied"});
      }
    });
    socket.on('next', function(data){
      if(game.players.active&&game.players.active.conn == socket){
        // Allowed to ask for next
        throw('Unimplemented next card interface');
      }
    });

  });

  game.on('cards', function(cardList){
    for(var i=0;i<cardList.length;i++){
      io.emit('feed', {text: 'New card ' + cardList[i].src});
    }
  })
  game.on('regenerate', function(info){
    io.emit('feed', {text: 'Generator updated: ' + info});
  });
}

async function cleanUp(){
  return Promise.all([imgStore.destroy]);
}

module.exports = {router: httpapp, connect: connect, cleanUp: cleanUp};
