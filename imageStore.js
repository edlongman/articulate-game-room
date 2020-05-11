'use strict';
const multer = require('multer');
const jpegRot = require('jpeg-autorotate');
const util = require('util');
const fs = require('fs').promises;
const {makeId} = require('./gameUtil');
const express = require('express');
const asyncUnlink = util.promisify(fs.unlink);
const path = require('path');
const fileLen = 10;
const extMap = {"image/png": 'png', "image/jpeg": 'jpeg'};

var instance_upload_list = [];
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'useruploads'))
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
const upload = multer({
  storage: storage,
  limits:{fileSize: 10000000},
  fileFilter: function(req, file, cb){
    const extension = extMap[file.mimetype];
    if(extension == null){ //TODO: Check if this can be fooled
      cb(null, false);
      return;
    }
    cb(null, true);
  }
});
const cardUpload = upload.array('cards', 20);
function finishUpload(req, res, next) {
  req.imageUpload = true; //Mark as successful upload
  // Fix rotation on jpegs
  Promise.all(req.files.map((file)=>{
    if(file.mimetype=="image/jpeg"){
      return jpegRot.rotate(file.path,{})
        .then(function (new_image){
          // Overwrite the original file
          return fs.writeFile(file.path, new_image.buffer);
        })
        .catch((err)=>{
          switch(err.code){
            case jpegRot.errors.read_exif:
            case jpegRot.errors.no_orientation:
            case jpegRot.errors.unknown_orientation:
            case jpegRot.errors.correct_orientation:
              // Ignore error and leave image unchanged
              break;
            default:
              console.log(err);
              throw err;
              break;
          }
        });
    }
    return true;
  })).then(()=>{
    // Record all uploads to empty them when finished
    instance_upload_list = instance_upload_list.concat(
      req.files.map((item) => item.path)
    );

    next();
  }).catch(next);
}


async function cleanUp(){
  //Remove all uploaded files
  return Promise.all(
    instance_upload_list.map( (item)=>asyncUnlink(item) )
  );
}
module.exports = {
  upload20img: [cardUpload, finishUpload],
  library: express.static(path.join(__dirname, 'useruploads'),{
    index: null,
    maxAge: 604800,//one week - filenames are unique
  }),
  destroy: cleanUp
};
