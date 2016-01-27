var  config = require('./lib/server/config.js'),
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

var app = connect()
	.use(require('morgan')('dev'))
	.use(require('cookie-parser')())
	.use(serverStatic(path.join(__dirname, './www/admin/cont')))
	.use(serverStatic(wwwPath + '/cont'))
	//.use(require('serve-static')(wwwPath + '/cont'))
	//.use(require('express-session')({ secret: 'my secret here' }))
	.use(siteLookup)
	.use(uploader)
	.use(bodyParser.urlencoded({extended: true}))
	.use(webFront);

var  server = http.createServer(app);
server.listen(port);

exports.restart = function()  {
	server.close();
	server = http.createServer(app);
	server.listen(port);
}
