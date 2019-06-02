/*!
 * coServ
 * authors: Ben Lue
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */
var  fs = require('fs'),
	 path = require('path'),
	 config = require('./config.js'),
	 sse = require('./sse/SSEManager.js'),
	 WebSite = require('../base/WebSite.js');

var  siteList = [],
	 caList = [],
     allSites;

reload();

exports.reload = reload;
exports.lookup = hostToSite;
exports.lookupByCode = codeToHost;


function  reload()  {
	let  sitePath = path.join(config.getWWW() , './sites.json'),
		 fdata = fs.readFileSync( sitePath );
	allSites = JSON.parse( fdata );
	
	for (var k in allSites)  {
		var  siteInfo = allSites[k];
		// coServ 1.0 use 'appCode' instead of 'caCode'
		siteInfo.caCode = siteInfo.caCode || siteInfo.appCode;

		let  sitePath = siteInfo.sitePath = siteInfo.sitePath || ('./' + siteInfo.caCode);
		if (sitePath.charAt(0) === '.')
			sitePath = path.join( config.getWWW(), sitePath );
		siteInfo.sitePath = sitePath.replace(/\\/g, "/");
		//console.log('site path: ' + sitePath);
	}

    siteList = [];
    caList = [];
}


function  hostToSite(host)  {
	let  site = siteList[host];

	if (site === undefined)  {
		let  siteInfo = allSites[host];

		if (siteInfo)
			site = activateSite(host, siteInfo);
		else
			siteList[host] = null;
	}

	return  site;
}


function  codeToHost(caCode)  {
	let  site = caList[caCode];

	if (site === undefined)  {
		for (var k in allSites)  {
			var  siteInfo = allSites[k];

			if (siteInfo.caCode === caCode)  {
				site = activateSite(k, siteInfo);
				break;
			}
		}

		if (!site)
			caList[caCode] = null;
	}

	return  site;
}


function  activateSite(host, siteInfo)  {
	let  si = {host: host};
	for (let p in siteInfo)
		si[p] = siteInfo[p];

	let  site = new WebSite(si);
	caList[si.caCode] = siteList[host] = site;

	// initialize SSE channels
	if (siteInfo.sseChannels)
		for (url of siteInfo.sseChannels)
			sse.createChannel(host, url);

	return  site;
}