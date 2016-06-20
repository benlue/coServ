/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2016 Gocharm Inc.
 */
var  cheerio = require('cheerio'),
     config = require('../lib/server/config.js'),
	 path = require('path'),
	 webSite,
	 webView;

var  resMocker,
     simpleSiteInfo = {
        caCode: "simple",
        theme: "basic",
        title: 'HOME',
        sitePath: "./simple"
     };

(function()  {
    var  option = {
            "apiEngine": {
                "host": "coimapi.net",
                "port": 80,
                "method": "POST"
            },
            "server": {
                "wwwPath": path.join(__dirname, 'case')
            }
         };

    config.init( option );
    webSite = require('../lib/base/webSite.js');
    webView = require('../lib/base/webView.js');

	resMocker  = {
		setHeader: function(key, value)  {},
		end: function(s)  {
			this.result = s;
			//console.log( s );
		},
		getResult: function() {
			return  this.result;
		}
	};
})();

module.exports = {
    'ignoring postfix': ignorePostTest
}


/**
 * Page title is specified in the siteURI.json file.
 */
function  ignorePostTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/index.asp'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        //console.log( "------\n" + JSON.stringify(result.body, null, 4) );
        beforeExit(function() {
            var  $ = cheerio.load( result.body );
            assert.equal($('head title').text(), 'HOME');
        });
    });
}