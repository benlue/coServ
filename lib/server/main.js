/*!
* coServ
* authors: Ben Lue
* license: MIT
* Copyright(c) 2016 Gocharm Inc.
*/
var  fs = require('fs'),
	 config = require('./config.js'),
	 bodyParser = require('body-parser'),
	 serverStatic = require('serve-static'),
	 path = require('path'),
	 connect = require('connect'),
     http = require('http'),
     uploader,
     webFront = require('./WebFront.js')();

var  serverIns;

exports.init = function(option)  {
    config.init( option );
    
    // delay the initialization of uploader...
    uploader = require('./Uploader.js')(config.getApiEngine());
}
    
exports.restart = function(option)  {
    if (serverIns)
        serverIns.close();
    serverIns = startServer();
}


function  startServer()  {
	var  app = createServerApp(),
	     server = http.createServer(app),
	     port = config.getServer().port || 8080;
         
	server.listen(port);
    return  server;
}


function  createServerApp()  {
	var  wwwPath = config.getWWW(),
		 app = connect()
		 .use(require('morgan')('dev'))
		 .use(require('cookie-parser')())
		 .use(serverStatic(path.join(__dirname, '../client')))
		 .use(serverStatic(wwwPath + '/cont'));
		//.use(require('express-session')({ secret: 'my secret here' }))

	// supply static file directories for all sites running on coServ
	var  staticList = listStaticPath();
	for (var i in staticList)  {
		var  spath = path.join(staticList[i], '../');
		app.use( serverStatic(spath, {index: false}) );
	}
	for (var i in staticList)  {
		var  spath = path.join(staticList[i], './cont');
		app.use( serverStatic(spath, {index: false}) );
	}

	app
	.use(require('./SiteLookup.js'))
	.use(require('connect-multiparty')())
	.use(uploader)
	.use(bodyParser.urlencoded({extended: true}))
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
	var  wwwPath = config.getWWW(),
		 siteFile = path.join( wwwPath, 'sites.json' ),
		 pathList = [];

	try  {
		var  sites = JSON.parse( fs.readFileSync(siteFile) );
		for (var domain in sites)  {
			var  siteInfo = sites[domain],
				 sitePath = siteInfo.sitePath;

			if (sitePath)  {
				if (sitePath.charAt(0) === '.')
					sitePath = path.join( wwwPath, sitePath );

				pathList.push( sitePath );
			}
		}
	}
	catch (e)  {
		console.error( e );
	}

	return  pathList;
}