/*!
 * coServ
 * authors: Ben Lue
 * Copyright(c) 2014 ~ 2019 Gocharm Inc.
 */
const  fs = require('fs'),
	   config = require('./config.js'),
	   mime = require('mime-types'),
	   sse = require('./sse/SSEManager.js');

const  SECONDS_IN_SEVEN_DAY = 24 * 60 * 60;

module.exports = function WebFront()  {

	return  function(req, res, next) {
		let  site = req.webSite;
		
		if (site)  {
			let  resource = site.isStaticResource(req)

			if (resource)  {
				if (resource.noCaching)  {
					let  fpath = resource.file,
						 readOpts = {highWaterMark: Math.pow(2,16)},
						 stream = fs.createReadStream(fpath, readOpts),
						 headers = {
							'Content-Type': mime.lookup( fpath )
						 }

					res.writeHead( 200, headers )
					stream.pipe( res )
				}
				else  {
					let  etag = req.headers['if-none-match'],	// watch out: use lower case!
						 stat = resource.stat,
						 nxETag = Math.round(stat.mtimeMs),
						 maxAge = site.isProduction || site.isMaster  ?  SECONDS_IN_SEVEN_DAY : 0,
						 headers = {
							'Cache-Control': 'max-age=' + maxAge,
							ETag: nxETag + ''
						 };

					if (etag && nxETag <= (etag + 0))  {
						// continue to use the cached version, if not modified since
						res.writeHead( 304, headers );		// 304: Not Modified
						res.end();
					}
					else  {
						let  fpath = resource.file,
							 readOpts = {highWaterMark: Math.pow(2,16)},
							 stream = fs.createReadStream(fpath, readOpts)

						headers['Content-Type'] = mime.lookup( fpath )
						res.writeHead( 200, headers );
						stream.pipe( res );
					}
				}
				next();
			}
			else  {
				if (req.headers.accept && req.headers.accept == 'text/event-stream')  {
					// dealing with server sent event
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
					site.run( req, res, function(result)  {
						res.writeHead( result.statusCode || 200, result.headers );
						if (result.stream)
							result.stream.pipe( res );
						else
							res.end( result.body || '' );
							
						next();
					});
			}
		}
		else
			next();
	};
};