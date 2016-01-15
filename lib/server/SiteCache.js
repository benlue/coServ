/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  fs = require('fs'),
	 path = require('path'),
	 config = require('./config.js'),
	 WebSite = require('../base/WebSite.js');

var  siteList = [],
	 caList = [],
     allSites = null,
     wwwPath,
	 themePath;

var  SiteCache = (function()  {
	// loading all the site-info of this server
    if (!allSites)  {
		wwwPath = config.getWWW();
		themePath = path.join(wwwPath, './themes/');
        reload();
	}

	var  SiteCache = function()  {};

	// export some handy methods
	SiteCache.reload = reload;
    SiteCache.lookup = hostToSite;
    SiteCache.lookupByCode = codeToHost;

	return  SiteCache;
})();

module.exports = SiteCache;


function  reload()  {
    var  fdata = fs.readFileSync( path.join(wwwPath , './sites.json'), {encoding:'UTF-8'} );
    allSites = JSON.parse( fdata );
    siteList = [];
    caList = [];
}


function  hostToSite(domain)  {
	var  site = siteList[domain];
	if (!site)  {
		var  siteInfo = allSites[domain];

		if (!siteInfo)  {
			var  idx = domain.indexOf('.');
			siteInfo = allSites[domain.substring(idx)];
		}

		if (siteInfo)  {
			site = new WebSite(siteInfo, themePath);
			siteList[domain] = site;
			caList[siteInfo.caCode] = site;
		}
	}

	return  site;
}


function  codeToHost(caCode)  {
	return  caList[caCode];
}