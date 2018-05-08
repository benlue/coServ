/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2017 Gocharm Inc.
 */
const  sse = require('./sse/SSEManager.js');

module.exports = function WebFront()  {

	var  WebFront = function WebFront(req, res, next) {
		var  site = req.webSite;
		
		if (site)  {
			if (req.headers.accept && req.headers.accept == 'text/event-stream')  {
				// dealing with server side event
				var  host = (req.headers.host || '').split(':')[0],
					 channel = sse.findChannel(host, req.url);

				if (channel)
					sse.addClient(channel, req, res);
				else  {
					res.writeHead(404);
					res.end();
				}
				next();
			}
			else
				site.run( req, res, function(isStream, result)  {
					if (isStream)  {
						res.writeHead( 200 );
						result.pipe( res );
					}
					else  {
						res.writeHead( result.statusCode || 200, result.headers );
						res.end( result.body );
					}
						
					next();
				});
		}
		else
			next();
	};

	return  WebFront;
};