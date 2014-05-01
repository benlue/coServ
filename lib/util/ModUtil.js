/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  fs = require('fs'),
	 path = require('path'),
	 RenderQ = require('../base/RenderQ.js'),
	 WebView = require('../base/WebView.js'),
	 WebSite = require('../base/WebSite.js');

// change this to the proper path
var  wwwPath = __dirname;
if (path.sep === '\\')
	wwwPath = wwwPath.replace(/\\/, '/');

var  fdata = fs.readFileSync( path.join(wwwPath , '../../www/sites.json'), {encoding:'UTF-8'} ),
	 allSites = JSON.parse( fdata );

exports.findWebSite = function findWebSite(domain)  {
	var  siteInfo = allSites[domain],
		 rPath = path.join( wwwPath, '../../www/themes/');
	return  siteInfo  ?  new WebSite(siteInfo, rPath) : null;
};

/**
 * Manually render a page. When the result is available, invoke the 'callback' function.
 */
exports.renderPage = function renderPage(webSite, vname, inData, callback)  {
	var  mockRes = new MockRes(callback),
		 srvObj = {query: inData, intPath: vname, viewPath: '/blocks/views' + vname,
				   postFix: 'html', isPage: true, hasView: true, txEncode: 'utf-8'},
		 renderQ = new RenderQ( webSite, mockRes, srvObj),
		 data = {value: inData};
	webSite.viewIt( renderQ, srvObj, data );
};


var  MockRes = (function() {
	// constructor
	var  MockRes = function MockRes(callback) {
		this.callback = callback;
	};

	MockRes.prototype.setHeader = function setHeader(key, value)  {
		// do nothiing
	};

	MockRes.prototype.end = function end(s)  {
		this.callback( s );
	};
	
	return  MockRes;
})();