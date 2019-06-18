/*!
 * coServ
 * authors: Ben Lue
 * license: GPLv2
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */
const  siteCache = require('./SiteCache.js');

module.exports = function SiteLookup(req, res, next)  {
	let  method = req.method,
		 err;

	if (method === 'GET' || method === 'POST')  {
		let  host = (req.headers.host || '').split(':')[0],
			 site = siteCache.lookup(host);

		if (site) 
			req.webSite = site;
		else
			// protect server from DDoS
			err = new Error('Unknown site.');
	}

	next(err);
};