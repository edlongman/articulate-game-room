'use strict';
const express = require('express');
const {makeId, shuffle, getRandomInt} = require('./gameUtil');
const imgStore = require('./imageStore');
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

var game_players = new Players();
var cards = [];
var round_cards = [];
class Chameleon extends EventEmitter{
  duplicator = null;
  dice = null;
}
var game = new Chameleon();
var io = new EventEmitter(); //Gets overwritten later copy-listeners may be useful
function adminStart(admin_socket){
  var mini_chameleon_dice = new Dice(['A1','B2', 'C3', 'D4']);
  game.dice=mini_chameleon_dice;
  game.duplicator=new Duplicator([mini_chameleon_dice], game_players.length);
  admin_socket.on("roll",game.dice.generate.bind(game.dice));
  game.duplicator.on("regenerate", (info)=>{
    game.emit("regenerate", info);
  });
  admin_socket.emit("enable_action", {id: "roll", name: "Reroll the Chameleon Dice"})
}

function connect(socket_io){
  io = socket_io;
  function currentUsersString(){
    return "Current players are: " + game_players.names.join(", ");
  }
  io.on('connection', function (socket) {
    //io.emit('feed', { text: 'hello world' });
    socket.on('join', function(name){
      if(game_players.add(name, socket)){
        socket.broadcast.emit('feed', { text: name + " joined the game" });
        socket.emit('feed', {text: currentUsersString()});
      }
      else{
        socket.emit('kick', {text: "Could not join. User occupied"});
      }
    });
    socket.on('admin', function(name){
      socket.emit('feed', {text: "Admin feed connected"});
      adminStart(socket);
    });
    socket.on('next', function(data){
      if(game_players.active&&game_players.active.conn == socket){
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
