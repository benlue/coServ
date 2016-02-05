/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  siteCache = require('./SiteCache.js');

module.exports = function SiteLookup(req, res, next)  {
	var  method = req.method,
		 err;

	if (method === 'GET' || method === 'POST')  {
		var  host = (req.headers.host || '').split(':')[0],
			 site = siteCache.lookup(host);

		if (site)
			req.webSite = site;
		else
			// protect server from DDoS
			err = new Error('Unknown site.');
	}

	next(err);
};