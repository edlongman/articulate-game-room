'use strict';
const express = require('express');
const {makeId, shuffle, getRandomInt} = require('./gameUtil');
const imgStore = require('./imageStore');
const User = require('./user');
const Players = require('./players');
const EventEmitter = require('events');
const {Image, Dice} = require('./cards')
const {Union, Duplicator} = require('./union')
const path = require('path');
var httpapp = express();
const nunjucks = require('nunjucks');
const env = new nunjucks.configure(path.join(__dirname,"templates"),{
  noCache: true
});
env.addGlobal("mountpath",express.mountpath);
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
  res.send(env.render('index.html', {mountpath: req.baseUrl}));
});
httpapp.get('/admin', async function(req, res){
  res.send(env.render('admin.html', {mountpath: req.baseUrl}));
});
httpapp.use(express.static(__dirname+'/static',{index: 'index.html'})); // Sets which page to load first
httpapp.use('/library', imgStore.library);
httpapp.use('/card/create', imgStore.upload20img, function addUploaded(req, res, next){
  if(req.imageUpload){
    var new_cards = req.files.map((item) => (new Image(item)));
    var new_images = new_cards.map((item) => item.generator);
    res.status(201).send(new_cards);
    cards = cards.concat(new_cards);
    game.emit('cards',new_cards);
  }
});

var cards = [];
var round_cards = [];
class Zone extends EventEmitter{
  drain = null;
  cards = [];
  name = 'Zone ';
  id = makeId(7);
  draw(card){
    this.cards.push(card);
    this.emit('deal', card);
  }
  retrieve(card){
    const removee_id = this.cards.map((item) => item.id).indexOf(card.id);
    if(removee_id<0){
      return false;
    }
    const removee = (this.cards.splice(removee_id, 1))[0];
    this.emit('retrieve', removee);
  }
}
class ChameleonGame extends EventEmitter{
  duplicator = null;
  dealer_set = null;
  dice = new Dice(['A1','A2','A3','A4',
                   'B1','B2','B3','B4',
                   'C1','C2','C3','C4',
                   'D1','D2','D3','D4']);
  chameleon_card = new Dice(['You are the chameleon']);
  topic_cards = new Union([]);
  players = new Players();
  admin = new User("Admin", null);
  feed = new EventEmitter();
  play_zone = null;
  constructor(){
    super();
    this.duplicator=new Duplicator([this.dice], this.players.length);
    this.dealer_set = new Union([this.duplicator, this.chameleon_card]);
    this.play_zone = new Zone(this.feed);
    this.play_zone.name = "Topic"
    this.dealer_set.on("regenerate", (info)=>{
      game.emit("regenerate", info);
    });
    this.players.subscribeZone(this.play_zone);
    this.feed.on('discard', this.players.feedDiscard.bind(this.players));
    this.on('cards', this.topic_cards.extend.bind(this.topic_cards));
  }
  connectAdmin(socket){
    if(!this.admin.updateSocket(socket)){
      return false;
    }
    this.admin.conn.on("roll",this.dice.generate.bind(this.dice));
    this.admin.conn.emit("enable_action", {id: "roll", name: "Reroll the Chameleon Dice"});
    this.admin.conn.on("deal",this.deal.bind(this));
    this.admin.conn.emit("enable_action", {id: "deal", name: "Deal the cards to the players"});
    this.admin.conn.on("play",this.deal_topic.bind(this));
    this.admin.conn.emit("enable_action", {id: "play", name: "Play the first card in hand"});
    this.feed.on('discard', (card) => {
      if(card instanceof Object){// TODO: instance of "Card" class
        this.admin.conn.emit("feed",{text: "Discarded text:" + card.text + ", src: " + card.src});
      }
    });
    this.feed.on('feed', (data)=>this.admin.conn.emit("feed", data));
    return true;
  }
  addPlayer(name, socket){
    const name_blacklist = ['', null, 'admin', 'null', 'undefined', undefined];
    if(name_blacklist.indexOf(name)>=0){
      return false;
    }
    const new_player = this.players.add(name, socket);
    if(new_player == false){
      return false;
    }
    //Notify the other players of joining
    socket.broadcast.emit('feed', { text: name + " joined the game" });
    socket.emit('feed', {text: this.currentPlayersString()});
    this.duplicator.multiplier = this.players.length - 1;
    if(this.duplicator.multiplier<0){
      this.duplicator.multiplier = 0;
    }

    //If the new_player is a user type then do the setup and subscriptions
    if(new_player instanceof User){
      new_player.on('disconnect', this.removePlayer.bind(this));
      new_player.subscribeZone(this.play_zone);
    }
    return new_player;
  }
  removePlayer(name){
    if(this.players.removeByName(name)){
      this.feed.emit('feed', {text: name + " left the game"});
      this.duplicator.multiplier = this.players.length - 1;
      if(this.duplicator.multiplier<0){
        this.duplicator.multiplier = 0;
      }
    }
  }
  deal(){
    this.players.emptyHands.call(this.players, this.feed);
    this.players.deal(this.dealer_set.deal());
  }
  deal_topic(){
    while(this.play_zone.cards.length>0){
      this.play_zone.retrieve(this.play_zone.cards[0]);
    }
    const topic_card = this.topic_cards.draw();
    if(topic_card==false){
      return false;
    }
    this.play_zone.draw(topic_card);
  }
  currentPlayersString(){
    return "Current players are: " + this.players.names.join(", ");
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

  game.on('regenerate', function(info){
    io.emit('feed', {text: 'Generator updated: ' + info});
  });
}

async function cleanUp(){
  return Promise.all([imgStore.destroy]);
}

module.exports = {router: httpapp, connect: connect, cleanUp: cleanUp};
