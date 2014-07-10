var  path = require('path'),
	 config = require('./config.json');

// change this to the proper path
var  wwwPath = __dirname;
if (path.sep === '\\')
	wwwPath = wwwPath.replace(/\\/, '/');

var connect = require('connect'),
    http = require('http'),
    siteLookup = require('./lib/server/SiteLookup.js')(wwwPath + '/www/themes/'),
    uploader = require('./lib/server/Uploader.js')(config),
    webFront = require('./lib/server/WebFront.js')();

var app = connect()
	.use(require('static-favicon')())
	.use(require('morgan')('dev'))
	.use(require('cookie-parser')())
	.use(require('serve-static')(wwwPath + '/www/cont'))
	//.use(require('express-session')({ secret: 'my secret here' }))
	//.use(connect.static(wwwPath + '/www/cont'))
	.use(siteLookup)
	.use(uploader)
	.use(require('body-parser')())
	.use(webFront);

http.createServer(app).listen(7070);