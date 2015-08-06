/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
module.exports = function WebFront()  {

	var  WebFront = function WebFront(req, res, next) {
		var  site = req.webSite;
		
		if (site)
			site.run( req, res, function(isStream, result)  {
				res.writeHead( result.statusCode || 200, result.headers );
				if (isStream)
					result.pipe( res );
				else
					res.end( result.body );
					
				next();
			} );
		else
			next();
	};

	return  WebFront;
};