/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var http = require('http'),
		url = require('url');

module.exports = function Uploader(config)  {

	return  function Uploader(req, res, next) {
		var mtype = mime(req);

		if (req.method === 'POST' && 'multipart/form-data' === mtype[0])  {
			var  boundry = mtype[1].trim(),
				 token = req.cookies.token,
				 cntLength = req.headers['content-length'];

            var  pathname = url.parse(req.url).pathname,
                 ppart = pathname.split('/'),
                 ca = ppart[1],
                 hostname = ca + '.' + config.apiEngine.host;

			// can't use req.headers as our headers
			var  headers = {
				host: hostname,
				accept: '*/*',
				"content-type": 'multipart/form-data; ' + boundry
			};

			var  options = {
				host: hostname,
				port: config.apiEngine.port,
				method: config.apiEngine.method,
				path: pathname.substring(ca.length + 1),
				headers: headers
			};

			boundry = '--' + boundry.substring('boundary='.length);
			var  leading = boundry + '\r\nContent-Disposition: form-data; name="token"\r\n\r\n' + token + '\r\n';
			options.headers['content-length'] = parseInt(cntLength) + leading.length;

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
					console.log(leading);
					isFirst = false;
				}
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
	return str.split(';');
};
