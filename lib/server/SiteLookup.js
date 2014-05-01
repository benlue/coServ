/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  fs = require('fs'),
	 path = require('path'),
	 WebSite = require('../base/WebSite.js');

var  siteList = [];

module.exports = function SiteLookup(wwwPath)  {

	// loading all the site-info of this server
	var  fdata = fs.readFileSync( path.join(wwwPath , '../sites.json'), {encoding:'UTF-8'} ),
		 allSites = JSON.parse( fdata );
	
	return function SiteLookup(req, res, next) {
		var  host = req.headers.host.split(':')[0],
			 site = hostToSite(host, wwwPath, allSites);

		if (site !== null)  {
			req.webSite = site;
			next();
		}
		else  {
			res.res.writeHead(404, 'Unknown site');
			res.end();
		}
	};
};

function  hostToSite(domain, wwwPath, allSites)  {
	var  site = siteList[domain];
	if (!site)  {
		var  siteInfo = allSites[domain];
		
		if (!siteInfo)  {
			var  idx = domain.indexOf('.');
			siteInfo = allSites[domain.substring(idx)];
		}
		
		if (siteInfo)  {
			site = new WebSite(siteInfo, wwwPath);
			siteList[domain] = site;
		}
	}
	
	return  site;
};