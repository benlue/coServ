/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var csConfig = require('../../config.json'),
	http = require('http'),
	url = require('url');

var  apiProvider = csConfig.apiEngine.version || 'v1'

module.exports = function Uploader(apiEngine)  {

	return  function Uploader(req, res, next) {
		var  parsedURL = url.parse(req.url, true);
		req.parsedURL = parsedURL;

		var  pathname = parsedURL.pathname,
			 site = req.webSite;

		var  idx = pathname.indexOf('.'),
			 ep = idx > 0  ?  pathname.substring(0, idx) : pathname,
			 urlInfo = site.getUriList()[ep];

		// upload to the local coServ
		if (urlInfo && urlInfo.upload)
			return  next();

		var mtype = mime(req);

		if (req.method === 'POST' && 'multipart/form-data' === mtype[0])  {
			// we'll proxy the rquest to the COIMOTION API services
			var  boundry = mtype[1].trim(),
				 token = req.cookies.appToken || req.cookies.token,
				 cntLength = req.headers['content-length'];

            var  ppart = pathname.split('/'),
                 ca = ppart[1],
                 isIpAddr = isIP(apiEngine.host);
                 hostname = isIpAddr  ?  apiEngine.host : (ca + '.' + apiEngine.host);

			// can't use req.headers as our headers
			var  headers = {
				host: hostname,
				accept: '*/*',
				"content-type": 'multipart/form-data; ' + boundry
			};

			var  options = {
				host: hostname,
				port: apiEngine.port,
				method: apiEngine.method,
				path: pathname.substring(ca.length + 1),
				headers: headers
			};

			boundry = '--' + boundry.substring('boundary='.length);
			var  leading = boundry + '\r\nContent-Disposition: form-data; name="token"\r\n\r\n' + token + '\r\n';
			options.headers['content-length'] = parseInt(cntLength) + leading.length;
			if (apiProvider === 'v2')  {
				options.headers['x-deva-token'] = token;
				if (isIpAddr)
					options.headers['x-deva-appcode'] = ca;
			}

			var  pxy_req = http.request(options, function(pxy_res) {
				pxy_res.addListener('data', function(chunk) {
					res.write(chunk, 'binary');
				});

				pxy_res.addListener('end', function() {
					res.end();
				});

				res.writeHead( pxy_res.statusCode, pxy_res.headers );
			});

			var  isFirst = true;
			req.addListener('data', function(chunk) {
				if (isFirst)  {
					pxy_req.write(leading);
					//console.log(leading);
					isFirst = false;
				}
				//console.log(chunk);
				pxy_req.write(chunk, 'binary');
			});

			req.addListener('end', function()  {
				pxy_req.end();
			});
		}
		else
			next();
	};
};


function mime(req) {
	var str = req.headers['content-type'] || '';
	//console.log('content-type: ' + str);
	return str.split(';');
};

var ipv4Maybe = /^(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)$/;
function isIP(str) {
    if (!ipv4Maybe.test(str))
        return false;

    var parts = str.split('.').sort();
    return parts[3] <= 255;
};
