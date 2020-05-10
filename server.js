'use strict';
var express = require('express')();
var app = require('./app');
const config = require('./config');
const stoppable = require('stoppable');
const graceful_limit = 20000; // 20s to do gracefully shutdown
var server = stoppable(require('http').Server(express), graceful_limit);
var io = require('socket.io')(server);

server.listen(config.port, () => console.log("server listening on "+config.port));
// WARNING: app.listen(80) will NOT work here!

const mount_on = '/';
express.use(mount_on, app.router);

app.connect(io.of(mount_on));


// Handle ^C
process.on('SIGINT', function shutdown(){
  server.stop();
  app.cleanUp()
  .then(process.exit(0))
  .catch((err)=>{
    console.log("Could not cleanUp app. There may be orphaned files");
    process.exit(1);
  })
});
