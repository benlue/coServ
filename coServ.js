/*!
* coServ
* authors: Ben Lue
* license: MIT
* Copyright(c) 2016 ~ 2019 Gocharm Inc.
*/
const  fs = require('fs'),
       serverConfig = require('./lib/server/config');
       
// let's deal with the server configuration first...
let  config,
     configFile = './config/config.json',
     argv = process.argv;

// allow the config file to be specified in the command line
if (argv.length == 4)  {
    let  cmd = argv[2];
    if (cmd === '-c')
        config = JSON.parse( fs.readFileSync( argv[3] ) );
    else  if (cmd === '-r')
        configFile = './config/' + argv[3] + 'Config.json';
}

if (!config)
    config = require(configFile);

serverConfig.init( config );

// now initiate & start the server...
const  coServ = require('./lib/server/main');
coServ.init( config );
coServ.restart();

// start the rpc server
const  rpc = require('./lib/server/rpc.js');    // rpc require is delayed to make sure the init process can go without glitch
rpc.start();