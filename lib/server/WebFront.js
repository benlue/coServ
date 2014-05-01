/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
module.exports = function WebFront()  {

	var  WebFront = function WebFront(req, res, next) {
		var  site = req.webSite;
		if (!site.run( req, res ))
			// TODO: should do some error handling
			next();
	};

	return  WebFront;
};