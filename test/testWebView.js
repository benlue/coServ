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
    'missing HTML': noHtmlTest,
    'HTML fragment': HtmlFragTest,
    'simple HTML': SimpleHtmlTest,
    'no such page': noSuchTest,
    'page title': pageTitleTest,
    'page description': pageDescTest,
    'dynamic content': dynamicContentTest,
    'embed block': embedBlockTest,
    'text output': textOutTest
}


/**
 * Page title is specified in the siteURI.json file.
 */
function  pageTitleTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/index'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        //console.log( "------\n" + result.body );
        beforeExit(function() {
            var  $ = cheerio.load( result.body );
            assert.equal($('head title').text(), 'HOME');
        });
    });
}


/**
 * Page description is specified in the siteURI.json file.
 */
function  pageDescTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/index'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        //console.log( "------\n" + result.body );
        beforeExit(function() {
            var  $ = cheerio.load( result.body );
            assert.equal($('head meta[name=description]').attr('content'), 'This is my page.');
        });
    });
}


function  dynamicContentTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/tempCase1'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        //console.log( "------\n" + result.body );
        beforeExit(function() {
            var  $ = cheerio.load( result.body );
            assert.equal($('div.TempCase1 li').length, 10);
        });
    });
}


function  embedBlockTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/case1.hf'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        beforeExit(function() {
            var  $ = cheerio.load( result.body );
            assert.equal($('#answer').text().trim(), 'x is 5');
        });
    });
}


/**
 * Plain text output should be generated from a local server module. No template will be referenced.
 */
function  textOutTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/txCase1.txt'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        beforeExit(function() {
            assert.equal(result.body, 'hello');
        });
    });
}


function  noHtmlTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/noHTML.hf'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        //console.log( "------\n" + result.body );
        beforeExit(function() {
            var  $ = cheerio.load( result.body );
            assert.equal($('._xsError').text(), 'Missing the block view directory for the /noHTML block.');
        });
    });
}


function  HtmlFragTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/index.hf'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        //console.log( "------\n" + result.body );
        beforeExit(function() {
            var  $ = cheerio.load( result.body );
            assert.equal($('.Index').text(), 'Hello!');
        });
    });
}


function  SimpleHtmlTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/index'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        //console.log( "------\n" + result.body );
        beforeExit(function() {
            var  $ = cheerio.load( result.body );
            assert.equal($('.Index').text(), 'Hello!');
        });
    });
}


function  noSuchTest(beforeExit, assert)  {
    var  site = new webSite(simpleSiteInfo),
         parsedURL = {
            pathname: '/noSuchPage'
         },
         req = {
            method: 'GET',
            url: "http://www.foo.com" + parsedURL.pathname,
            parsedURL: parsedURL,
            headers: {},
            cookies: {}
         };

    site.run(req, resMocker, function(isStream, result)  {
        //console.log( "------\n" + result.body );
        beforeExit(function() {
            var  $ = cheerio.load( result.body );
            assert.equal($('._xsError').text(), 'Oops! The block [/noSuchPage] is not found.');
        });
    });
}