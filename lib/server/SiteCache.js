/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2017 Gocharm Inc.
 */
var  fs = require('fs'),
	 path = require('path'),
	 config = require('./config.js'),
	 sse = require('./sse/SSEManager.js'),
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
	let  sitePath = path.join(config.getWWW() , './sites.json'),
		 fdata = fs.readFileSync( sitePath );
    allSites = JSON.parse( fdata );
    siteList = [];
    caList = [];
}


function  hostToSite(host)  {
	let  site = siteList[host];
	if (!site)  {
		let  siteInfo = allSites[host];

		if (siteInfo)  {
			// coServ 1.0 use 'appCode' instead of 'caCode'
			siteInfo.caCode = siteInfo.caCode || siteInfo.appCode;

			let  sitePath = siteInfo.sitePath = siteInfo.sitePath || ('./' + siteInfo.caCode);

			// web-apps using coServ 1.0 and after refer to the 'assets' instead of 'cont' directory
			if (sitePath.charAt(0) === '.')
				sitePath = path.join( config.getWWW(), sitePath );

			// this site uses the 'assets' or 'cont' directory
			siteInfo.useAsset = fs.existsSync(path.join(sitePath, './assets'));

			let  si = {host: host};
			for (let p in siteInfo)
				si[p] = siteInfo[p];

			site = new WebSite(si);
			caList[si.caCode] = siteList[host] = site;

			// initialize SSE channels
			if (siteInfo.sseChannels)
				for (url of siteInfo.sseChannels)
					sse.createChannel(host, url);
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