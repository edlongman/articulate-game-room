'use strict';
const express = require('express');
const {makeId, shuffle, getRandomInt} = require('./gameUtil');
const imgStore = require('./imageStore');

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
    var cards = req.files.map((item) => Card.fromFile(item));
    res.status(201).send(cards);
    cards.concat(cards);
  }
});


function Card(src){
  return {src: src};
}
Card.fromFile = function(multer_file){
  return new Card(multer_file.filename);
}
var users = [];
var current_user = '';
var cards = [];
var round_cards = [];

function User(name, socket){
  return {name: name, conn: socket};
}
var users = [];
var current_user = '';


function addUser(name, socket){
  if(users.map((item) => item.name).indexOf(name)==-1){
    users.push(new User(name, socket));
    return true;
  }
  return false;
}

function updateUser(name, socket){
  //Check user exists
  var idx = users.map((item) => item.name).indexOf(name);
  if(idx==-1){
    return false;
  }
  else{
    //Check it is closed before
    if((users[idx].socket)&&users[idx].socket.connected){
      return false;
    }
    else{
      users[idx].socket = socket;
      return true;
    }
  }
}

function getUsers(){
  return users;
}
function getUsernames(){
  return users.map((item) => item.name);
}

function currentUser(){
  return users[getUsernames.indexOf(current_user)];
}

async function cleanUp(){
  return Promise.all([imgStore.destroy]);
}

module.exports = {router: app, cleanUp: cleanUp,
  addUser: addUser, updateUser: updateUser,
  getUsers:getUsers, getUsernames: getUsernames, }; //Based off
