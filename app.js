'use strict';
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const util = require('util');
const {makeId, shuffle, getRandomInt} = require('./gameUtil');

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
    cb(null, makeId(fileLen) + '.'+ extension)
  }
});
const upload = multer({ storage: storage,
  limits:{fileSize: 1000000} });
var app = express.Router();
const asyncUnlink = util.promisify(fs.unlink);
async function cleanUp(){
  //Remove all uploaded files
  return Promise.all(
    instance_upload_list.map( (item)=>asyncUnlink(item) )
  );
}
app.use(express.static(__dirname+'/static',{index: 'index.html'})); // Sets which page to load first
app.use('/library',
  express.static(__dirname+'/useruploads',{
    index: null,
    maxAge: 604800,//one week - filenames are unique
  })
);

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

function Card(src){
  return {src: src};
}
Card.fromFile = function(multer_file){
  return new Card(multer_file.filename);
}
var instance_upload_list = [];
var users = [];
var current_user = '';
var cards = [];
var round_cards = [];
const cardUpload = upload.array('cards', 20);
app.post('/cardUpload', cardUpload, function (req, res, next) {
  // Record all uploads to empty them when finished
  instance_upload_list = instance_upload_list.concat(
    req.files.map((item) => item.path)
  );
  cards = cards.concat(
    req.files.map((item) => Card.fromFile(item))
  );
  res.status(201).send(cards)
})

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

module.exports = {router: app, cleanUp: cleanUp,
  addUser: addUser, updateUser: updateUser,
  getUsers:getUsers, getUsernames: getUsernames, }; //Based off
