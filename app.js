'use strict';
const express = require('express');
const multer = require('multer');

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

const fileLen = 10;
const extMap = {"image/png": 'png', "image/jpeg": 'jpeg'}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'useruploads')
  },
  filename: function (req, file, cb) {
    const extension = extMap[file.mimetype];
    if(extension == null){
      cb("Illegal upload type");
      return;
    }
    cb(null, file.makeid(fileLen) + extension)
  }
});
const upload = multer({ storage: storage });
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
const cardUpload = upload.array(
  {name: 'cards',
  maxCount:20,
  limits:{fileSize: 1000000}});
app.post('/cardUpload', cardUpload, function (req, res, next) {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
})

function User(name, socket){
  return {name: name, conn: socket};
}
var users = [];
var current_user = '';
var cards = [];
var round_cards = [];


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

module.exports = {router: app, addUser: addUser, updateUser: updateUser,
  getUsers:getUsers, getUsernames: getUsernames, }; //Based off
