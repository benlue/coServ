/*!
* coServ
* authors: Ben Lue
* license: MIT
* Copyright(c) 2016 Gocharm Inc.
*/
var  coServ = require('./lib/server/main.js');

coServ.init( require('./config.json') );
coServ.restart();