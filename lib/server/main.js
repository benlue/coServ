/*!
* The main program
* authors: Ben Lue
* license: MIT
* Copyright(c) 2016 ~ 2019 Gocharm Inc.
*/
const  config = require('./config.js'),
	   bodyParser = require('body-parser'),
	   serverStatic = require('serve-static'),
	   path = require('path'),
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
		 .use(serverStatic(path.join(__dirname, '../client'), {index: false}));

	app
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
	});

	return  app;
}


/*
function  listStaticPath()  {
	let  wwwPath = config.getWWW(),
		 siteFile = path.join( wwwPath, 'sites.json' ),
		 pathList = [];

	try  {
		let  sites = JSON.parse( fs.readFileSync(siteFile) );
		for (let domain in sites)  {
			let  siteInfo = sites[domain];
			if (!siteInfo.sitePath)
				siteInfo.sitePath = './' + (siteInfo.appCode || siteInfo.caCode);

			let  sitePath = siteInfo.sitePath;

			if (sitePath.charAt(0) === '.')
				sitePath = path.join( wwwPath, sitePath );

			pathList.push( sitePath );
		}
	}
	catch (e)  {
		console.error( e.stack );
	}

	return  pathList;
}
*/