/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2015 Gocharm Inc.
 */
var  assert = require('assert'),
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


describe('[coServ/rendering]...', function() {

    it('Missing the HTML file', function(done)  {
    	var  themePath = path.join(__dirname, "./case/simple/themes"),
    		 siteInfo = {
		 		caCode: "foo",
		 		theme: "basic"
    		 },
    		 site = new webSite(siteInfo, themePath);

    	var  req = {
    			method: 'GET',
    			url: "http://www.foo.com/noHTML.hf",
    			headers: {

    			},
    			cookies: {}
    		 };

    	site.run(req, resMocker, function()  {
    		var  result = resMocker.getResult();
    		//console.log( result );
    	assert.equal(result, '<div class="_xsError">Missing the block view directory for the /views/noHTML block.</div>', 'Show warning.');
    		done();
    	});
    });

    it('Simeple fragment. HTML only', function(done)  {
    	var  themePath = path.join(__dirname, "./case/simple/themes"),
    		 siteInfo = {
		 		caCode: "foo",
		 		theme: "basic"
    		 },
    		 site = new webSite(siteInfo, themePath);

    	var  req = {
    			method: 'GET',
    			url: "http://www.foo.com/index.hf",
    			headers: {

    			},
    			cookies: {}
    		 };

    	site.run(req, resMocker, function()  {
    		var  result = resMocker.getResult();
    		console.log( result );
    		//assert.equal(result, '<div>Hello!</div>', 'Show hello.');
    		done();
    	});
    });

    it('Simeple. HTML only', function(done)  {
    	var  themePath = path.join(__dirname, "./case/simple/themes"),
    		 siteInfo = {
		 		caCode: "foo",
		 		theme: "basic"
    		 },
    		 site = new webSite(siteInfo, themePath);

    	var  req = {
    			method: 'GET',
    			url: "http://www.foo.com/index",
    			headers: {

    			},
    			cookies: {}
    		 };

    	site.run(req, resMocker, function()  {
    		var  result = resMocker.getResult();
    		console.log( result );
    		//assert.equal(result, '<div>Hello!</div>', 'Show hello.');
    		done();
    	});
    });

    it('Not recognized path', function(done)  {
    	var  themePath = path.join(__dirname, "./case/simple/themes"),
    		 siteInfo = {
		 		caCode: "foo",
		 		theme: "basic"
    		 },
    		 site = new webSite(siteInfo, themePath);

    	var  req = {
    			method: 'GET',
    			url: "http://www.foo.com/noSuchPage",
    			headers: {

    			},
    			cookies: {}
    		 };

    	site.run(req, resMocker, function()  {
    		var  result = resMocker.getResult();
    		console.log( result );
    		//assert.equal(result, '<div>Hello!</div>', 'Show hello.');
    		done();
    	});
    });

});