/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  http = require('http'),
     validator = require('validator'),
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


exports.request = function request(srvPath, postData, custOpt, handler)  {
	// check arguments...
	if (!custOpt)  {
		handler = postData;
		postData = {};
	}
	else  if (!handler)  {
		handler = custOpt;
		custOpt = null;
	}

	var  p_data = JSON.stringify( postData || {} ),
		 opt = {};

	for (var k in options)
		opt[k] = options[k];

    // add the customized option...
	if (custOpt)  {
		for (var k in custOpt)
			opt[k] = custOpt[k];
	}

    //if (opt.host.indexOf('127.0.0') === 0)
    if (validator.isIP(opt.host, 4))
        opt.path = srvPath;
    else  {
        var  caSite = srvPath.split('/')[1];
        opt.host = caSite + '.' + opt.host;
        opt.path = srvPath.substring(caSite.length+1);
    }

	// consider non-English characters
	opt.headers['Content-Length'] = Buffer.byteLength(p_data);
	console.log( 'option is %s', JSON.stringify( opt ) );
	console.log('post data: %s', p_data);

	var postReq = http.request(opt, function(res) {
		var  ctype = res.headers['content-type'],
			 isJson = ctype === 'application/json',
			 inText = '';

		if (isJson)  {
			res.setEncoding('UTF-8');

			res.on('data', function(chunk)  {
				if (isJson)  {
					console.log('API response: %s', chunk);
					inText += chunk;
				}

		    	handler( ctype, chunk, false /* isDone */ );
			});

			res.on('end', function () {
				var  rtnObj = null;

				if (isJson)
					rtnObj = eval('(' + inText + ')');

				handler( ctype, rtnObj, true /* isDone */ );
			});
		}
		else
			handler( res );
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
