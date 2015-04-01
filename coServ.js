var  config = require('./lib/server/config.js'),
	 bodyParser = require('body-parser');

// deal with the www path
var  port = config.getServer().port || 8080,
	 wwwPath = config.getWWW();

var connect = require('connect'),
    http = require('http'),
    siteLookup = require('./lib/server/SiteLookup.js')(wwwPath),
    uploader = require('./lib/server/Uploader.js')(config.getApiEngine()),
    webFront = require('./lib/server/WebFront.js')();

var app = connect()
	//.use(require('serve-favicon')(wwwPath + 'cont/shared/favicon.ico'))
	.use(require('morgan')('dev'))
	.use(require('cookie-parser')())
	.use(require('serve-static')(wwwPath + '/cont'))
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
