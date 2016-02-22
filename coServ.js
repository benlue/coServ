var  fs = require('fs'),
	 config = require('./lib/server/config.js'),
	 bodyParser = require('body-parser'),
	 serverStatic = require('serve-static'),
	 path = require('path'),
	 connect = require('connect'),
     http = require('http'),
     siteLookup = require('./lib/server/SiteLookup.js'),
     uploader = require('./lib/server/Uploader.js')(config.getApiEngine()),
     webFront = require('./lib/server/WebFront.js')();

// deal with the www path
var  port = config.getServer().port || 8080,
	 wwwPath = config.getWWW();

(function() {
	startServer();
})();


exports.restart = function()  {
	server.close();
	startServer();
}


function  startServer()  {
	var  app = createServerApp();
	server = http.createServer(app);
	server.listen(port);
}


function  createServerApp()  {
	var app = connect()
		.use(require('morgan')('dev'))
		.use(require('cookie-parser')())
		.use(serverStatic(wwwPath + '/cont'));
		//.use(require('express-session')({ secret: 'my secret here' }))

	// supply static file directories for all sites running on coServ
	var  staticList = listStaticPath();
	for (var i in staticList)  {
		app.use(serverStatic(staticList[i]));
	}

	app
	.use(siteLookup)
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
	var  siteFile = path.join( wwwPath, 'sites.json' ),
		 pathList = [];

	try  {
		var  sites = JSON.parse( fs.readFileSync(siteFile) );
		for (var domain in sites)  {
			var  siteInfo = sites[domain],
				 sitePath = siteInfo.sitePath;

			if (sitePath)  {
				if (sitePath.charAt(0) === '.')
					sitePath = path.join( wwwPath, sitePath );

				pathList.push( path.join(sitePath, './cont') );
			}
		}
	}
	catch (e)  {
		console.error( e );
	}

	return  pathList;
}