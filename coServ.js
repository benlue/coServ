var  coServ = require('./lib/server/main.js');

coServ.init( require('./config.json') );
coServ.restart();