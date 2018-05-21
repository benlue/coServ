/*!
* coServ
* authors: Ben Lue
* license: MIT
* Copyright(c) 2016 ~ 2018 Gocharm Inc.
*/
const  fs = require('fs'),
	   config = require('./config.js'),
	   bodyParser = require('body-parser'),
	   serverStatic = require('serve-static'),
	   path = require('path'),
	   connect = require('connect'),
       http = require('http'),
       webFront = require('./WebFront.js')();

var  uploader;

var  serverIns,
	 _sysOptions;

exports.init = function(option)  {
    config.init( _sysOptions = option );
    
    // delay the initialization of uploader...
    uploader = require('./Uploader.js')(config.getApiEngine());
}
    
exports.restart = function(option)  {
    if (serverIns)
        serverIns.close();
    serverIns = startServer();
}

exports.readConfig = function()  {
	return  _sysOptions;
}

function  startServer()  {
	let  app = createServerApp(),
	     server = http.createServer(app),
	     port = config.getServer().port || 8080;
         
	server.listen(port);
    return  server;
}


function  createServerApp()  {
	let  wwwPath = config.getWWW(),
		 app = connect()
		 .use(require('morgan')('dev'))
		 .use(require('cookie-parser')())
		 .use(serverStatic(path.join(__dirname, '../client')))
		 .use(serverStatic(wwwPath + '/cont'));
		//.use(require('express-session')({ secret: 'my secret here' }))

	// supply static file directories for all sites running on coServ
	let  staticList = listStaticPath();
	for (let i in staticList)  {
		let  spath = path.join(staticList[i], '../');
		app.use( serverStatic(spath, {index: false}) );
	}
	for (let i in staticList)  {
		let  conPath = path.join(staticList[i], './cont');
		if (fs.existsSync(conPath))
			app.use( serverStatic(conPath, {index: false}) );
		else  {
			let  asPath = path.join(staticList[i], './assets');
			app.use( serverStatic(asPath, {index: false}) );
		}
	}

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