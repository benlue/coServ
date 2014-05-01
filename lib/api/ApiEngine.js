/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  http = require('http'),
	 config = require('../../config.json');

var  options = {
	//host: '192.168.1.190',
	host: config.apiEngine.host,
	port: config.apiEngine.port,
	method: config.apiEngine.method,
	headers: {
    	'Content-Type': 'application/json'
    }
};


exports.request = function request(caSite, srvPath, postData, handler)  {
	// check arguments...
	if (!handler)  {
		handler = postData;
		postData = {};
	}

	var  p_data = JSON.stringify( postData || {} ),
		 opt = {};

	for (var k in options)
		opt[k] = options[k];

	opt.host = caSite + '.' + opt.host;
	opt.path = srvPath;
	//opt.path = '/' + caSite + srvPath
	opt.headers['Content-Length'] = p_data.length;
	console.log( 'option is %s', JSON.stringify( opt ) );
	console.log('post data: %s', p_data);

	var postReq = http.request(opt, function(res) {
		var  ctype = res.headers['content-type'],
			 isJson = ctype === 'application/json',
			 isText = ctype.indexOf('text/') === 0,
			 inText = '';
		
		res.setEncoding('UTF-8');
		
		res.on('data', function(chunk)  {
			if (isJson || isText)
				inText += chunk;

	    	handler( ctype, chunk, false /* isDone */ );
		});
		
		res.on('end', function () {
			var  rtnObj = null;
			
			if (isJson)  {
				console.log('API response: %s', inText);
				rtnObj = eval('(' + inText + ')');
			}
			else  if (isText)
				rtnObj = inText;
			
			handler( ctype, rtnObj, true /* isDone */ );
		});
	});

	postReq.on('error', function(e) {
		console.log('API engine issue an error.');
		jObj = {errCode: -1, message: e.message};
		handler( 'application/json', jObj, true /* isDone */ );
	});

	// post the data
	postReq.write(p_data);
	postReq.end();
};


exports.setToken = function setToken(res, token)  {
	// dealing with the token from API engine
	if (token)  {
		// set the token to be expired after 60 days.
		// TODO: 'maxAge' should be configurable
		var  maxAge = parseInt(token) === '-1'  ?  -1 : 5184000000;
		res.setHeader( 'Set-Cookie', 'token=' + token + '; Path=/; expires=' + new Date(new Date().getTime()+maxAge).toUTCString());
	}
};