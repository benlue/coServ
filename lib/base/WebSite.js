/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  fs = require('fs'),
	 path = require('path'),
	 url = require('url'),
	 engine = require('../api/ApiEngine.js'),
	 RenderQ = require('./RenderQ.js'),
	 WebView = require('./WebView.js');

var  rootPath,
	 modBasePath = path.join(__dirname, '../');

var  WebSite = (function()  {
	var  WebSite = function  WebSite(siteInfo, rPath)  {
		this.siteInfo = siteInfo;
		this.siteName = siteInfo.caCode;
		this.locale = siteInfo.locale;
		rootPath = rPath + siteInfo.caCode;

		var  uriList,
			 layoutMap;

		this.getUriList = function()  {
			if (uriList === undefined)  {
				var  fdata = fs.readFileSync( rootPath + '/siteURI.json', {encoding:'utf-8'} );
			 	uriList = JSON.parse( fdata );
			}
			return  uriList;
		};

		this.getLayoutMap = function()  {
			if (layoutMap === undefined)  {
				var  fdata = fs.readFileSync( rootPath + '/layoutMap.json', {encoding:'utf-8'} );
				layoutMap = JSON.parse( fdata );
			}
			return  layoutMap;
		};
	};
	
	WebSite.prototype.getRootPath = function()  {
		return  rootPath;
	};

	WebSite.prototype.run = function run(req, res) {
		var  urlParts = url.parse(req.url, true),
			 psURI = urlParts.pathname,
			 inData = getInputData( req, urlParts ),
			 isDone = true;
		
		if (psURI.substring(0, 10) === '/_api/post')  {
			// do a relay to the API engine
			var  caSite = inData.hasCA  ?  inData.url.split('/')[0] : this.siteName,
				 //apiPath = '/' + (inData.hasCA  ?  '' : (this.siteName + '/')) + inData.url;
				 apiPath = '/' + inData.url;
			if (inData.id)
				apiPath += '/' + inData.id;
			
			inData.post = inData.post || {};
			if (inData.hasCA)  {
				if (this.siteInfo.appKeys)  {
					// no token. so we should send out appKey
					inData.post._key = this.siteInfo.appKeys[caSite];
					console.log('requested api: %s, appKey: %s', apiPath, inData.post._key);
				}
			}
			else  {
				if (req.cookies.token)  {
					inData.post.token = req.cookies.token;
					delete  inData.post._key;
					console.log('requested api: %s, token: %s', apiPath, inData.post.token);
				}
				else  if (this.siteInfo.appKeys)  {
					// no token. so we should send out appKey
					inData.post._key = this.siteInfo.appKeys[this.siteName];
					console.log('requested api: %s, appKey: %s', apiPath, inData.post._key);
				}
			}
			
			if (!inData._loc && this.locale)
				inData._loc = mapLocaleToID(this.locale);
			
			engine.request(caSite, apiPath, inData.post, function(ctype, apiObj, isDone) {
				if (ctype === 'application/json')  {
					if (isDone)  {
						if (apiObj.token)
							engine.setToken( res, apiObj.token );
					
						res.setHeader( 'Content-Type', 'application/json; charset=UTF-8');
						res.end( JSON.stringify(apiObj) );
					}
				}
				else  if (ctype.indexOf('text/') === 0)  {
					if (isDone)  {
						res.setHeader( 'Content-Type', ctype + '; charset=UTF-8');
						res.end( apiObj );
					}
				}
				else  {
					if (isDone)
						res.end();
					else
						res.write(apiObj, 'binary');
				}
			});
		}
		else  {
			if (psURI === '/')  {
				psURI = this.siteInfo.home;
				inData = {};
			}
			
			var  cmReq = {pathname: psURI, cookies: req.cookies};
			cmReq.inData = inData;
			
			isDone = this.runBlock(res, cmReq);
		}

		return  isDone;
	};

	WebSite.prototype.runBlock = function runBlock(res, cmReq) {
		// make sure the first argument is res or renderQ
		var  renderQ = null;
		if (res)  {
			if (res.constructor.toString().indexOf('RenderQ') > 0)  {
				renderQ = res;
				res = null;
			}
		}
		
		// 1. we need to know if this is a valid url.
		var  srvObj = this.isValid(cmReq);

		if (srvObj != null)  {
			var  site = this;
			if (renderQ === null)
				renderQ = new RenderQ( this, res, srvObj );
			console.log( srvObj );

			// 2. execute pathname
			if (srvObj.service)  {
				// TODO: the api engine should know this client app
				var  apiPath = srvObj.service;
				if (srvObj.id)
					apiPath += '/' + srvObj.id;
				console.log('requested api: %s', apiPath);

				cmReq.inData = cmReq.inData || {};
				if (cmReq.cookies && cmReq.cookies.token)
					cmReq.inData.token = cmReq.cookies.token;
				else
					cmReq.inData._key = this.siteInfo.appKeys[this.siteName];
				
				if (!cmReq.inData._loc && this.locale)
					cmReq.inData._loc = mapLocaleToID(this.locale);
				
				engine.request(this.siteName, apiPath, cmReq.inData, function(ctype, apiObj, isDone) {
					if (isDone)  {
						if (apiObj.token)
							engine.setToken( res, apiObj.token );
						
					    site.viewIt( renderQ, srvObj, apiObj );
					}
				});
			}
			else  {
				var  mod = findService( srvObj.intPath );
				if (mod)  {
					mod.on('done', function(data) {
						site.viewIt(renderQ, srvObj, data);
					});
					
					// register the module with renderQ, so renderQ will clean up all listeners when a page is done
					renderQ.mod = mod;
					if (typeof mod.setContext === 'function')  {
						var  ctx = {basePath: modBasePath};
						if (cmReq.cookies && cmReq.cookies.token)
							ctx.token = cmReq.cookies.token;
						if (!cmReq.inData._loc && this.locale)
							ctx._loc = mapLocaleToID(this.locale);

						mod.setContext(ctx);
					}

					mod.run(cmReq.inData);
				}
				else
					site.viewIt(renderQ, srvObj, {errCode: 0, message: 'No-op'});
			}
		}

		return  srvObj != null;
	};
	
	// run the page layout with the result
	WebSite.prototype.viewIt = function viewIt(renderQ, srvObj, data)  {
		renderQ.setSrcData( data );
		var  pfix  = srvObj.postFix;
		
		if (pfix == 'wsj')
			renderQ.doOutput( JSON.stringify(data) );
		else  if (pfix == 'json')  {
			var  outData = data.value  ?  data.value : {};
			renderQ.doOutput( JSON.stringify(outData) );
		}
		else  if (pfix == 'txt')
			renderQ.doOutput( data );
		else  {
			// preset title
			if (srvObj.title)
				renderQ.setPageTitle( srvObj.title );
			
			var  rtnValue = data.value;
			if (rtnValue)  {
				if (rtnValue.title)
					renderQ.setPageTitle( rtnValue.title );
				if (rtnValue.summary)
					renderQ.setPageDescription( rtnValue.summary );
			}

			var  opPath = srvObj.intPath,
				 wView = new WebView( {rootPath: rootPath, path: rootPath + srvObj.viewPath, opPath:opPath}, renderQ );
			wView.compose();
		}
	};

	// if 'pathname' is recognized by this website, an URI object will be returned.
	WebSite.prototype.isValid = function isValid(cmReq)  {
		cmReq.uri = cmReq.pathname;		// keep the original request path in cmReq.uri
		
		var  uriList = this.getUriList(),
			 layoutMap = this.getLayoutMap(),
			 srvObj = makeSrvObj(uriList, layoutMap, cmReq, 'no');
		
		if (srvObj)
			srvObj.id = null;
		else  {
			// get rid of 'id' and match the uriList again
			var  pathname = cmReq.pathname,
				 idx = pathname.lastIndexOf('/'),
				 id = pathname.substring(idx + 1);
			cmReq.pathname = pathname.substring(0, idx);
			
			srvObj = makeSrvObj(uriList, layoutMap, cmReq, 'yes');
			if (srvObj)
				srvObj.id = id;
		}
		
		return  srvObj;
	};

	return  WebSite;
})();

module.exports = WebSite;


function  makeSrvObj(uriList, layoutMap, cmReq, needID)  {
	var  srvObj = null,
		 pathname = cmReq.pathname,
		 po = getPostFix(pathname),
		 postFix = po.postFix;
	pathname = po.p;
	
	if (isFormatSupported(postFix) && uriList.hasOwnProperty(pathname))  {
		// the input URL does not include 'id'
		var  uri = uriList[pathname];

		if (uri.id === needID || uri.id === 'maybe')  {
			var  isOk = true,
				 inData = cmReq.inData;
			
			if (inData && uri.hasOwnProperty('args'))  {
				for (var i = 0, len = uri.args.length; isOk && i < len; i++)
					isOk = inData[uri.args[i]]  ?  true : false;
			}
			
			if (isOk)  {
				// ok, this is a valid path. return its attributes
				var  isPage = postFix === 'html';
				srvObj = {uri: cmReq.uri, query: inData, cookies: cmReq.cookies,
						  intPath: pathname, args: uri.args, postFix: postFix, service: uri.service, isPage: isPage};
				srvObj.viewPath = isPage  ?  '/layout/' + mapLayout(layoutMap, pathname) : '/blocks/views' + pathname;
				srvObj.hasView = isPage || postFix === 'hf';
				srvObj.txEncode = 'utf-8';		// TODO: should not be hard-coded
				
				if (uri.title)
					srvObj.title = uri.title;
			}
		}
	}
	
	return  srvObj;
};


function  isFormatSupported(pf)  {
	return  pf === 'html' || pf === 'hf' || pf === 'wsj' || pf === 'json' || pf === 'txt';
};


function  mapLayout(layoutMap, pathname)  {
	var  path = pathname,
		 layoutName = null;

	while (layoutName === null && path)  {
		if (layoutMap.hasOwnProperty(path))
			layoutName = layoutMap[path];
		else  {
			var  idx = path.lastIndexOf('/');
			path = idx > 0  ?  path.substring(0, idx) : null;
		}
	}

	if (layoutName == null )
		layoutName = 'default';
	
	return  layoutName;
};


function findService(pathname)  {
	// 1. check for route-map
	//var  routeMap = {},
	//	 opPath = routeMap.hasOwnProperty(pathname)  ?  routeMap[pathname] : pathname,
	var  modPath = rootPath + '/blocks/modules' + pathname + '.js',
		 mod = null;

	try  {
		mod = require( modPath );
	}
	catch (e)  {
		console.log(e);
	}

	return  mod;
};


function getPostFix(p)  {
	var  idxS = p.lastIndexOf('/'),
		 idxD = p.lastIndexOf('.'),
		 postFix = 'html';

	if (idxS < idxD)  {
		postFix = p.substring( idxD+1 );
		p = p.substring( 0, idxD );
	}

	return  {p: p, postFix: postFix};
};


function  getInputData(req, psURI)  {
	if (req.method === 'GET')
		inData = psURI.query;
	else  if (req.method === 'POST')
		inData = req.body;
	
	return  inData || {};
};


function  mapLocaleToID(locale)  {
	var  locID = 1;
	
	switch (locale)  {
	case 'en':
		locID = 1;
		break;
		
	case 'zh':
		locID = 2;
		break;
	}
	
	return  locID;
};