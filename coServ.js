/*!
* coServ
* authors: Ben Lue
* license: MIT
* Copyright(c) 2016 ~ 2018 Gocharm Inc.
*/
const  fs = require('fs'),
       coServ = require('./lib/server/main.js');

let  config,
     argv = process.argv;

// allow the config file to be specified in the command line
if (argv.length == 4 && argv[2] == '-c')
    config = JSON.parse( fs.readFileSync( argv[3] ) );
else
    config = require('./config.json');

coServ.init( config );
coServ.restart();