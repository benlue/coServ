/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2015 Gocharm Inc.
 */
var  assert = require('assert'),
     cheerio = require('cheerio'),
	 path = require('path'),
	 webSite = require('../lib/base/webSite.js'),
	 webView = require('../lib/base/webView.js');

var  resMocker;

before(function()  {
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
});


describe('[coServ/variables]...', function() {
	it('execution result', function(done)  {
        var  themePath = path.join(__dirname, "./case/simple/themes"),
             siteInfo = {
                caCode: "foo",
                theme: "basic"
             },
             site = new webSite(siteInfo, themePath);

        var  req = {
                method: 'GET',
                url: "http://www.foo.com/exeErr",
                headers: {

                },
                cookies: {}
             };

        site.run(req, resMocker, function(isStream, result)  {
            //console.log( "------\n" + result.body );
            var  $ = cheerio.load( result.body );
            assert.equal($('div.err').text(), 'Oops! Execution error.', 'wrong message.');
            done();
        });
    });
});