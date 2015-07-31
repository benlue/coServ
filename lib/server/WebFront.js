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
			site.run( req, res, next );
		else
			next();
	};

	return  WebFront;
};