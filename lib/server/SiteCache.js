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
     allSites;

var  SiteCache = (function()  {
	// loading all the site-info of this server
    if (!allSites)
        reload();

	var  SiteCache = function()  {};

	// export some handy methods
	SiteCache.reload = reload;
    SiteCache.lookup = hostToSite;
    SiteCache.lookupByCode = codeToHost;

	return  SiteCache;
})();

module.exports = SiteCache;


function  reload()  {
    var  fdata = fs.readFileSync( path.join(config.getWWW() , './sites.json') );
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
			site = new WebSite(siteInfo);
			siteList[domain] = site;
			caList[siteInfo.caCode] = site;
		}
	}

	return  site;
}


function  codeToHost(caCode)  {
	var  site = caList[caCode];
	if (!site)  {
		for (var k in allSites)  {
			var  siteInfo = allSites[k];

			if (siteInfo.caCode === caCode)  {
				var  si = {domain: k};
				for (var p in siteInfo)
					si[p] = siteInfo[p];

				site = new WebSite(si);
				siteList[k] = site;
				caList[caCode] = site;
				break;
			}
		}
	}

	return  site;
}