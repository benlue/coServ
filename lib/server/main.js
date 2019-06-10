/*!
* coServ
* authors: Ben Lue
* license: GPLv2
* Copyright(c) 2016 ~ 2019 Gocharm Inc.
*/
const  config = require('./config.js'),
	   bodyParser = require('body-parser'),
	   connect = require('connect'),
	   http = require('http'),
	   https = require('https'),
       webFront = require('./WebFront.js')();

var  uploader;

var  serverIns,
	 securedServerIns

exports.init = function(option)  {
	config.init( option );
    
    // delay the initialization of uploader...
    uploader = require('./Uploader.js')(config.getApiEngine());
}
    
exports.restart = function()  {
    if (serverIns)
		serverIns.close();
	if (securedServerIns)
		securedServerIns.close();

	// start http server...
	serverIns = startServer();

	// if SSL certificate and key pair are available, start the https server...
	let  secureOption = config.getSecureOption();
	if (secureOption)
		securedServerIns = startServer( secureOption );
}

/*
exports.readConfig = function()  {
	return  _sysOptions;
}
*/

function  startServer(options)  {
	let  app = createServer(),
		 server,
		 port = config.getServer().port,
		 portNo;

	if (port.http)
		portNo = options  ?  port.https : port.http;
	else
		portNo = port;

	if (!portNo || isNaN(portNo))
		portNo = options  ?  3443 : 8080;

	if (options)
		server = https.createServer(options, app);
	else
	    server = http.createServer(app);
         
	server.listen(portNo);
    return  server;
}


function  createServer()  {
	let  app = connect()
			.use(require('morgan')('dev'))
			.use(require('cookie-parser')())
			.use(require('./SiteLookup.js'))
			.use(uploader)
			.use(bodyParser.urlencoded({extended: true}))
			.use(require('connect-multiparty')())
			.use(bodyParser.json())
			.use(webFront)
			.use(function(err, req, res, next)  {
				if (err)  {
					res.writeHead(404, 'Unknown site');
					res.end();
				}
			})

	return  app;
}