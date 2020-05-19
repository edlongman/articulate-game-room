'use strict';
const express = require('express');
const {makeId, shuffle, getRandomInt} = require('./gameUtil');
const imgStore = require('./imageStore');
const User = require('./user');
const Zone = require('./zone');
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
    var new_cards = req.files.map((item) => (new Image("Upload", item)));
    new_cards = new Union("Uploads", new_cards);
    var new_images = new_cards.undealt;
    res.status(201).send(new_images);
    game.emit('cards',new_cards);
  }
});

class ChameleonGame extends EventEmitter{
  duplicator = null;
  dealer_set = null;
  dealer_observer = new Zone();
  dice = new Dice("Roller", ['A1','A2','A3','A4',
                   'B1','B2','B3','B4',
                   'C1','C2','C3','C4',
                   'D1','D2','D3','D4']);
  chameleon_card = new Dice("Chameleoner", ['You are the chameleon']);
  topic_cards = new Union("Topics", []);
  players = new Players();
  admin = new User("Admin", null);
  feed = new EventEmitter();
  play_zone = null;
  constructor(){
    super();
    this.duplicator=new Duplicator("Roll duplicator", [this.dice], this.players.length);
    this.dealer_set = new Union("Role cards",[this.duplicator, this.chameleon_card], true);
    this.dealer_observer.name = "Roll cards";
    this.dealer_observer.masked = "Hidden Dice card";
    this.admin.subscribeZone(this.dealer_observer);
    this.play_zone = new Zone(this.feed);
    this.play_zone.name = "Topic"
    this.dealer_set.on("regenerate", (info)=>{
      game.emit("regenerate", info);
      this.dealer_observer.flush();
      this.dealer_observer.deal(this.dealer_set.undealt);
    });
    this.topic_cards.shuffle = false;
    this.topic_cards.on("regenerate", (info)=>{
      game.emit("regenerate", info);
      this.admin.hand.flush();
      this.admin.hand.deal(this.topic_cards.undealt);
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
    this.admin.conn.emit("enable_action", {id: "deal", name: "Deal the Roll to the players"});
    this.admin.conn.on("play",this.deal_topic.bind(this));
    this.admin.conn.emit("enable_action", {id: "play", name: "Play the first card Hand to Topic"});
    this.admin.sendZone(this.dealer_observer);
    this.feed.on('discard', (card) => {
      if(card instanceof Object){// TODO: instance of "Card" class
        this.admin.conn.emit("feed",{text: "Discarded text:" + card.text + ", src: " + card.src});
      }
    });
    this.feed.on('log', (data)=>this.admin.conn.emit("feed", data));
    this.feed.on('feed', (data)=>this.admin.conn.emit("feed", data));
    return true;
  }
  addPlayer(name, socket){
    const name_blacklist = ['', null, 'admin', 'null', 'undefined', undefined];
    if(name_blacklist.indexOf(name.toLowerCase())>=0){
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

    //If the new_player is a user type then do the setup and subscriptions
    if(new_player instanceof User){
      this.admin.conn.emit("players", this.currentPlayersString());
      new_player.on('disconnect', this.removePlayer.bind(this));
      new_player.subscribeZone(this.play_zone);
    }
    return new_player;
  }
  removePlayer(name){
    name = String(name);
    if(this.players.removeByName(name)){
      this.feed.emit('feed', {text: name + " left the game"});
      this.admin.conn.emit("players", this.currentPlayersString());
      this.duplicator.multiplier = this.players.length - 1;
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
    this.admin.hand.flush();
    this.admin.hand.deal(this.topic_cards.undealt);
    this.play_zone.add(topic_card);
  }
  currentPlayersString(){
    if(this.players.length<1){
      return "There are no players";
    }
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
      name = String(name);
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
        socket.emit('feed', {text: "Could not join. Admin occupied"});
      }
    });
    socket.on('next', function(data){
      // TODO: validate data
      if(game.players.active&&game.players.active.conn == socket){
        // Allowed to ask for next
        throw('Unimplemented next card interface');
      }
    });

  });

  game.on('regenerate', function(info){
    game.feed.emit('log', {text: 'Generator updated: ' + info});
  });
}

async function cleanUp(){
  return Promise.all([imgStore.destroy]);
}

module.exports = {router: httpapp, connect: connect, cleanUp: cleanUp};
