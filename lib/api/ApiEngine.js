/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  http = require('http'),
	 config = require('../../config.json');

var  options = {
	host: config.apiEngine.host,
	port: config.apiEngine.port,
	method: config.apiEngine.method,
	headers: {
    	'Content-Type': 'application/json'
    }
};


exports.request = function request(endpoint, postData, custOpt, handler)  {
	// check arguments...
	if (arguments.length === 2)  {
		handler = postData;
		postData = {};
	}
	else  if (arguments.length === 3)  {
		handler = custOpt;
		custOpt = null;
	}
	custOpt = custOpt || {};

	var  p_data = JSON.stringify( postData || {} ),
		 opt = {headers: {}};

	for (var k in options)  {
		if (k === "headers")  {
			for (var h in options.headers)
				opt.headers[h] = options.headers[h];
		}
		else
			opt[k] = options[k];
	}

    // add the customized option...
	for (var k in custOpt)  {
		if (k === 'headers')  {
			for (var h in custOpt.headers)
				opt.headers[h] = custOpt.headers[h];
		}
		else
			opt[k] = custOpt[k];
	}

    if (isIP(opt.host))
        opt.path = endpoint;
    else  if (custOpt.headers && custOpt.headers['x-deva-appcode'])  {
    	var  caSite = custOpt.headers['x-deva-appcode'];
        opt.host = caSite + '.' + opt.host;
        opt.path = endpoint;
    }
    else  {
        var  caSite = endpoint.split('/')[1];
        opt.host = caSite + '.' + opt.host;
        opt.path = endpoint.substring(caSite.length+1);
    }

	// consider non-English characters
	opt.headers['Content-Length'] = Buffer.byteLength(p_data);

	//console.log( 'option is %s', JSON.stringify( opt, null, 4 ) );
	//console.log('post data: %s', p_data);

	var postReq = http.request(opt, function(res) {
		var  ctype = res.headers['content-type'],
			 isJson = ctype === 'application/json',
			 inText = '';

		if (isJson)  {
			res.setEncoding('UTF-8');

			res.on('data', function(chunk)  {
				inText += chunk;
		    	handler( ctype, chunk, false /* isDone */ );
			});

			res.on('end', function () {
				console.log('API response:\n' + inText);
				var  rtnObj = JSON.parse( inText );
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
		var  maxAge = 5184000000;
		//if (token[0] === '!')
		//	token = token.substring(1);
		res.setHeader( 'Set-Cookie', 'token=' + token + '; Path=/; expires=' + new Date(new Date().getTime()+maxAge).toUTCString());
	}
	else  {
		var  maxAge = 5184000000;
		res.setHeader( 'Set-Cookie', 'token=; Path=/; expires=' + new Date(new Date().getTime()-maxAge).toUTCString());
	}
};


var ipv4Maybe = /^(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)$/;
function isIP(str) {
    if (!ipv4Maybe.test(str))
        return false;

    var parts = str.split('.').sort();
    return parts[3] <= 255;
};