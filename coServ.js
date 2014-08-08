var  path = require('path'),
	 config = require('./config.json');

// deal with the www path
var  wwwPath = config.wwwPath;
if (!wwwPath)
	wwwPath = path.join(__dirname, './www/');
if (path.sep === '\\')
	wwwPath = wwwPath.replace(/\\/, '/');

var connect = require('connect'),
    http = require('http'),
    siteLookup = require('./lib/server/SiteLookup.js')(wwwPath + '/themes/'),
    uploader = require('./lib/server/Uploader.js')(config),
    webFront = require('./lib/server/WebFront.js')();

var app = connect()
	.use(require('static-favicon')())
	.use(require('morgan')('dev'))
	.use(require('cookie-parser')())
	.use(require('serve-static')(wwwPath + '/cont'))
	//.use(require('express-session')({ secret: 'my secret here' }))
	//.use(connect.static(wwwPath + '/www/cont'))
	.use(siteLookup)
	.use(uploader)
	.use(require('body-parser')())
	.use(webFront);

http.createServer(app).listen(8080);
