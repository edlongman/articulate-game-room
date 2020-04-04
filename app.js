'use strict';
const express = require('express');

function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


var app = express.Router();
app.use(express.static(__dirname+'/static',{index: 'index.html'})); // Sets which page to load first

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

function User(name, socket){
  return {name: name, conn: socket};
}
var users = [];

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

module.exports = {router: app, addUser: addUser, updateUser: updateUser,
  getUsers:getUsers, getUsernames: getUsernames, }; //Based off
