/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  csConfig = require('../../config.json'),
	 dd = require('../server/pp/DeviceDetector.js'),
	 fs = require('fs'),
	 path = require('path'),
	 url = require('url'),
	 util = require('util'),
	 engine = require('../api/ApiEngine.js'),
	 RenderQ = require('./RenderQ.js'),
	 WebView = require('./WebView.js');

var  modBasePath = path.join(__dirname, '../');

var  providerName = csConfig.apiEngine.version || 'v1',
	 svProvider = require('../api/coim' + providerName + '.js');


var  WebSite = (function()  {

	var  WebSite = function  WebSite(siteInfo, themePath)  {

		this.siteInfo = siteInfo;
		this.locale = siteInfo.locale;
		this.supportMultiD = false;
		this.modCache = {};
		this.viewIt = viewIt;
		//rootPath = themePath + (siteInfo.theme  ?  siteInfo.theme : siteInfo.caCode);

		// quit a few local caches
		var  uriList = {},
			 layoutMap = {},
			 rootPath = {};
		//console.log('theme path: ' + themePath);

		if (siteInfo.theme)  {
			if (typeof siteInfo.theme === 'string')
				rootPath.desktop = path.join(themePath, siteInfo.theme);
			else  {
				for (var k in siteInfo.theme)
					rootPath[k] = path.join(themePath, siteInfo.theme[k]);
				this.supportMultiD = true;
			}
		}
		else
			rootPath.desktop = path.join(themePath, siteInfo.caCode);

		this.getUriList = function(userAgent)  {
			if (this.supportMultiD)  {
				if (!userAgent || (userAgent !== 'mobile' && userAgent !== 'tablet'))
					userAgent = 'desktop';
			}
			else
				userAgent = 'desktop';

			var  ulist = uriList[userAgent];
			if (ulist === undefined)  {
				try  {
					var  fdata = fs.readFileSync( this.getRootPath(userAgent) + '/siteURI.json', {encoding:'utf-8'} );
					ulist = JSON.parse( fdata );
				}
				catch (e) {
					ulist = null;
				}
				uriList[userAgent] = ulist;
			}
			return  ulist;
		};

		this.getLayoutMap = function(userAgent)  {
			if (this.supportMultiD)  {
				if (!userAgent || (userAgent !== 'mobile' && userAgent !== 'tablet'))
					userAgent = 'desktop';
			}
			else
				userAgent = 'desktop';

			var  lm = layoutMap[userAgent];
			if (lm === undefined)  {
				try  {
					var  fdata = fs.readFileSync( this.getRootPath(userAgent) + '/layoutMap.json', {encoding:'utf-8'} );
					lm = JSON.parse( fdata );
				}
				catch (e)  {
				 	// allow 'layoutMap.json' to be missing
					lm = {};
				}
				layoutMap[userAgent] = lm;
			}
			return  lm;
		};

        this.getRootPath = function(userAgent)  {
			if (this.supportMultiD)  {
				var  p = rootPath[userAgent || 'desktop'];
				return  p || rootPath['desktop'];	// in case userAgent is neither desktop, mobile nor tablet
			}

			return  rootPath['desktop'];
        };
	};

	WebSite.prototype.run = function run(req, res, cb) {
		var  urlParts = url.parse(req.url, true),
			 psURI = urlParts.pathname,
			 inData = getInputData( req, urlParts ) || {},
			 isDone = true;
		inData._loc = inData._loc || this.locale;
		//console.log('incoming request is [%s]', psURI);

		if (psURI.substring(0, 10) === '/_api/post')  {
			// do a relay to an API engine
			svProvider.postToServer( this.siteInfo, inData, req, res, function(ctype, apiObj, isDone) {
				if (apiObj)  {
					// only json or text will go through this
					if (isDone)  {
						if (apiObj.token)
							engine.setToken( res, apiObj.token );

						var  rtnObj = {
								headers: {
									'Content-Type': 'application/json; charset=UTF-8'
								},
								body: JSON.stringify(apiObj)
							 };
						cb( false, rtnObj );
					}
				}
				else  {
					// simply do a proxy
					cb( true, ctype );
				}
			} );
		}
		else  {
			if (psURI === '/')
                psURI = this.siteInfo.home;

			var  userAgent = req.headers['user-agent'],
				 cmReq = {pathname: psURI, cookies: req.cookies,
						  inData: inData, headers: req.headers};
			cmReq.client = userAgent  ?  dd.detect(userAgent) : 'desktop';

			this.runBlock(res, cmReq, null, cb);
		}
	};


	WebSite.prototype.runBlock = function runBlock(res, cmReq, renderQ, cb) {
		// 1. we need to know if this is a valid url.
		var  clientCategory = cmReq.client.category,
			 uriList = this.getUriList(clientCategory),
			 layoutMap = this.getLayoutMap(clientCategory),
			 srvObj = isValid(cmReq, uriList, layoutMap);

		if (srvObj.viewPath)  {
			// this is a recognized page (block)
			//srvObj.title = srvObj.title || this.siteInfo.title;

			var  site = this;
			renderQ = renderQ || new RenderQ( this, srvObj );

			// 2. process the block
			if (srvObj.service)  {
				var  postData = {
						post: cmReq.inData || {},
						url: srvObj.service,
						id: srvObj.id
					 };
				//console.log('service post data\n%s', JSON.stringify(postData, null, 4));

				svProvider.postToServer( this.siteInfo, postData, cmReq, res, function(ctype, apiObj, isDone) {
					if (apiObj)  {
						if (isDone)  {
							if (apiObj.token)
								engine.setToken( res, apiObj.token );

							viewIt( renderQ, srvObj, apiObj, cb );
						}
					}
					else
						cb( true, ctype );
				});
			}
			else  {
				var  mod = this.findService( this.getRootPath(cmReq.client.category), srvObj.intPath );
				if (mod)  {
					if (typeof mod.setContext === 'function')  {
						var  ctx = {
								basePath: modBasePath,
								clientType: srvObj.client
							 };
						if (cmReq.cookies && cmReq.cookies.token)
							ctx.token = cmReq.cookies.token;
						//if (!cmReq.inData._loc && this.locale)
						//	ctx._loc = mapLocaleToID(this.locale);
						ctx._loc = mapLocaleToID(cmReq.inData._loc);

						mod.setContext(ctx);
					}

                    mod.run(cmReq.inData, function(result) {
						if (result._httpCode)  {
							var  rtnObj = {
									statusCode: result._httpCode,
									headers: result._httpHeaders,
									body: result._data
								 };
							cb( false, rtnObj );
						}
						else  {
							if (result.statusCode)
								cb( true, ctype );
                        	else  {
                        		if (result._httpHeaders)  {
                        			// the local module may want to change the http respose headers
                        			for (var key in result._httpHeaders)
                        				res.setHeader(key, result._httpHeaders[key]);
                        			result = result._data || {};
                        		}

								viewIt(renderQ, srvObj, result, cb);
                        	}
						}
                    });
				}
				else
					viewIt(renderQ, srvObj, {errCode: 0, message: 'No-op'}, cb);
			}
		}
        else  {
        	var  rtnObj = {
        			body: util.format('<div class="_xsError">Oops! The block [%s] is not found.</div>', cmReq.uri)
        		 };
        	cb( false, rtnObj );
        }
	};


	WebSite.prototype.findService = function findService(rootPath, pathname)  {
		var  mod = this.modCache[pathname];

		if (mod === undefined)  {
			var  modPath = rootPath + '/blocks/modules' + pathname + '.js';
			//console.log('modPath: ' + modPath);

			try  {
				//console.log('module path is ' + modPath);
				mod = require( modPath );
			}
			catch (e)  {
				//console.log( e.stack );
				//console.log('Trivial: block [%s] does not have a customized module', pathname);
				mod = null;
			}
			this.modCache[pathname] = mod;
		}

		return  mod;
	};

	return  WebSite;
})();

module.exports = WebSite;


/**
 * if 'pathname' is recognized by this website, an URI object will be returned.
 */
function isValid(cmReq, uriList, layoutMap)  {
	cmReq.uri = cmReq.pathname;		// keep the original request path in cmReq.uri

	var  srvObj = makeSrvObj(uriList, layoutMap, cmReq, 'no');

	if (srvObj.viewPath)
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


function  makeSrvObj(uriList, layoutMap, cmReq, needID)  {
	var  srvObj,
		 po = getPostFix(cmReq.pathname),
		 postFix = po.postFix,
		 pathname = po.p;
	//console.log('postfix: %s, pathname: %s', postFix, pathname);
	//console.log('url list is\n%s', JSON.stringify(uriList, null, 4));

	if (isFormatSupported(postFix) && uriList.hasOwnProperty(pathname))  {
		// the input URL does not include 'id'
		var  uri = uriList[pathname];

		if (uri.id === needID || uri.id === 'maybe')  {
			var  isOk = true,
				 inData = cmReq.inData;

            if (uri.params) {
				for (var p in uri.params)
					inData[p] = uri.params[p];
			}

			// check for required arguments (input parameters)
			if (inData && uri.hasOwnProperty('args'))  {
				for (var i = 0, len = uri.args.length; isOk && i < len; i++)
					isOk = inData.hasOwnProperty(uri.args[i]);
			}

			if (isOk)  {
				// ok, this is a valid path. return its attributes
				var  isPage = postFix === 'html';
				srvObj = {
					uri: cmReq.uri, query: inData, cookies: cmReq.cookies, 'http-headers': cmReq.headers,
					intPath: pathname, postFix: postFix, service: uri.service,
					client: cmReq.client, isPage: isPage,
					title: uri.title
				};
				srvObj.viewPath = isPage  ?  '/layout/' + mapLayout(layoutMap, pathname) : '/blocks/views' + pathname;
				srvObj.txEncode = 'utf-8';		// TODO: should not be hard-coded
				if (cmReq.cookies.token)
					srvObj.isGuest = cmReq.cookies.token[0] === '!';
				else
					srvObj.isGuest = true;
                //srvObj.isGuest = cmReq.cookies.token  ?  false : true;
				if (isNaN(inData._loc))
					srvObj.locale = inData._loc;
			}
		}
	}
	else  {
		// the requested block is not valid, prepare to bail out
		postFix = isFormatSupported(postFix)  ?  postFix : 'html';
		var  isPage = postFix === 'html';
		srvObj = {isPage: isPage, postFix: postFix};
	}

	return  srvObj;
};


// run the page layout with the result
function viewIt(renderQ, srvObj, data, cb)  {
	renderQ.setSrcData( data );
	var  pfix  = srvObj.postFix;
	//console.log('post fix is ' + pfix);

	if (pfix === 'html' || pfix === 'hf')  {
		if (srvObj.isPage)  {
			// preset title
			var  rtnValue = data.value,
				 rtnTitle;

			if (rtnValue)  {
				rtnTitle = rtnValue.title;
				if (rtnValue.summary)
					renderQ.setPageDescription( rtnValue.summary );
			}
			
			var  title = rtnTitle || srvObj.title || renderQ.getSite().siteInfo.title || srvObj.uri;
			renderQ.setPageTitle( title );
		}

		var  opPath = srvObj.intPath,
             rootPath = renderQ.webSite.getRootPath( srvObj.client.category ),
			 wView = new WebView( {rootPath: rootPath, path: rootPath + srvObj.viewPath, opPath:opPath}, renderQ );
		//console.log('block rootPath: %s, viewPath: %s', rootPath, srvObj.viewPath);
		wView.compose(false, cb);
	}
	else  {
		var  header,
			 txEncode = srvObj.txEncode,
			 body = data;

		switch (pfix)  {
			case  'js':
				header = 'application/javascript; charset=';
				break;
			case  'css':
				header = 'text/css; charset=';
				break;
			case  'wsj':
				header = 'application/json; charset=';
				body = JSON.stringify(data);
				break;
			case  'json':
				header = 'application/json; charset=';
				body = JSON.stringify(data.value || {});
				break;
			case  'txt':
				header = 'text/plain; charset=';
				if (data.message && data.hasOwnProperty('value'))
					body = data.value;
				break;
		}

		var  rtnObj = {
				headers: {
					'Content-Type': header + txEncode
				},
				body: body
			 };

		cb( false, rtnObj );
	}
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
	var  inData;

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
