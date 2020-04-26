'use strict';
const multer = require('multer');
const util = require('util');
const fs = require('fs');
const {makeId} = require('./gameUtil');
const express = require('express');
const asyncUnlink = util.promisify(fs.unlink);

const fileLen = 10;
const extMap = {"image/png": 'png', "image/jpeg": 'jpeg'};

var instance_upload_list = [];
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
const cardUpload = upload.array('cards', 20);
function finishUpload(req, res, next) {
  req.imageUpload = true; //Mark as successful upload
  // Record all uploads to empty them when finished
  instance_upload_list = instance_upload_list.concat(
    req.files.map((item) => item.path)
  );
  next();
}


async function cleanUp(){
  //Remove all uploaded files
  return Promise.all(
    instance_upload_list.map( (item)=>asyncUnlink(item) )
  );
}
module.exports = {
  upload20img: [cardUpload, finishUpload],
  library: express.static(__dirname+'/useruploads',{
    index: null,
    maxAge: 604800,//one week - filenames are unique
  }),
  destroy: cleanUp
};
