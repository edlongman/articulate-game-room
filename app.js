'use strict';
const express = require('express');
const imgStore = require('./imageStore');
const User = require('./user');
const ChameleonGame = require('./chameleon-game');
const {Image} = require('./cards');
const {Union} = require('./union');
const path = require('path');
var httpapp = express();
const nunjucks = require('nunjucks');
const env = new nunjucks.configure(path.join(__dirname,"templates"),{
  noCache: true
});
env.addGlobal("mountpath",express.mountpath);


class GameManager{
  games = [];
  gameLimit = 100;
  game_prototype = ChameleonGame;
  idxById(id){
    //Check game exists
    var idx = this.games.map((item) => item.id.toUpperCase())
      .indexOf(id.toUpperCase());
    if(idx==-1)return false;
    return idx;
  }
  byId(id){
    if(!id)return false;
    id = String(id);
    //Check user exists
    const idx=this.idxById(id);
    if(idx === false)return idx;
    return this.games[idx];
  }
  newGame(){
    if(this.games.length>this.gameLimit&&this.gamesBusy()){
      return false;
    }
    var new_game = this.createGame();
    return new_game.id;
  }
  createGame(){
    var new_game = new this.game_prototype();
    this.games.push(new_game);
    return new_game;
  }
  gamesBusy(){
    //Returns true if all games are busy
    // Returns false if there is now space
    console.warn("Unimplemented gamesBusy");
    return true;
  }
}
var manager = new GameManager();

httpapp.get('/', async function(req, res){
  res.send(env.render('index.html', {mountpath: req.baseUrl, gameId: ''}));
});
httpapp.get('/play/:gameId?', async function(req, res){
  var gameId = '';
  if(req.params.gameId&&req.params.gameId.length<10){
    gameId = req.params.gameId;
  }
  res.send(env.render('play.html', {mountpath: req.baseUrl, gameId: gameId}));
});
httpapp.get('/admin/:gameId?', async function(req, res){
  var gameId = '';
  if(req.params.gameId&&req.params.gameId.length<10){
    gameId = req.params.gameId;
  }
  res.send(env.render('admin.html', {mountpath: req.baseUrl, gameId: gameId}));
});
httpapp.use(express.static(__dirname+'/static',{index: 'index.html'})); // Sets which page to load first
httpapp.use('/library', imgStore.library);
httpapp.use('/card/create', imgStore.upload20img, function addUploaded(req, res, next){
  if(req.imageUpload){
    var new_cards = req.files.map((item) => (new Image("Upload", item)));
    new_cards = new Union("Uploads", new_cards);
    var new_images = new_cards.undealt;
    var gameId = '';
    if(req.body.game_id&&req.body.game_id.length<10){
      gameId = req.body.game_id;
    }
    var game = manager.byId(gameId);
    if(!game){
      var err = new Error('Game unknown');
      err.status = 404;
      err.statusCode = 'Game unknown';
      next(err);
      return;
    }
    res.status(201).send(new_images);
    game.emit('cards',new_cards);
  }
});

var io = null; //Gets overwritten later copy-listeners may be useful

function connect(socket_io){
  io = socket_io;
  io.on('connection', function (socket) {

    if(!process.env.NODE_ENV){
      const sockShortId = socket.id.substring(0,5);
      console.log(`Sock ${sockShortId}: connected`);
      // Not production so do verbose socket log
      socket.conn.on("packet",function(packet){
        if(packet.type !="message"){
          console.log(`Sock ${sockShortId}: Packet recevied: ${packet.type}`);
          return;
        }
        const args = JSON.parse(
          packet.data.substring(packet.data.indexOf('['))
        );
        const evArgs = JSON.stringify(args.splice(1));
        const evStr = `${args[0]}(${evArgs})`;
        console.log(`Sock ${sockShortId}: Event: ${evStr}`);
        return true;
      })/*
      socket.use(function(data,next,test){
        // Build debug string
        const evArgs = JSON.stringify(data.splice(1));
        const evStr = `${data[0]}(${evArgs})`;
        console.log(`Sock ${sockShortId}: Event: ${evStr}`);
        next();
      });*/
    }
    socket.once('user', function(name){
      socket.emit('feed', {text: "User socket connected"});
      name = String(name);
      socket.on('join', function(gameId, respondId){
        const game = manager.byId(gameId);
        if(!game){
          socket.emit('kick', {text: "Could not join. Game unknown"});
          return;
        }
        respondId(game.id.toUpperCase()); //Must be before zone are send by user class
        if(!game.addPlayer(name, socket)){
          socket.emit('kick', {text: "Could not join. User occupied"});
        }
      });
    });
    socket.once('admin', function(){
      socket.emit('feed', {text: "Admin socket connected"});
      socket.on('join', function(gameId, respondId){
        if(typeof(respondId)!="function"){
          socket.emit('kick', {text: "Could not join. No response callback"});
          return;
        }
        if(gameId == null){
          gameId = manager.newGame();
        }
        const game = manager.byId(gameId)
        if(!game){
          socket.emit('kick', {text: "Could not join. Game unknown"});
          return;
        }
        respondId(gameId.toUpperCase()); //Must be before zone are send by user class
        if(!game.connectAdmin(socket)){
          socket.emit('kick', {text: "Could not join. Admin occupied"});
          return;
        }
      });
    });

  });

}

async function cleanUp(){
  return Promise.all([imgStore.destroy]);
}

module.exports = {router: httpapp, connect: connect, cleanUp: cleanUp};
