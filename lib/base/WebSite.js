/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  config = require('../server/config.js'),
	 dd = require('../server/pp/DeviceDetector.js'),
	 fs = require('fs'),
	 path = require('path'),
	 util = require('util'),
	 engine = require('../api/ApiEngine.js'),
	 RenderQ = require('./RenderQ.js'),
	 WebView = require('./WebView.js');

var  modBasePath = path.join(__dirname, '../');

var  providerName = config.getApiEngine().version || 'v1',
	 svProvider = require('../api/coim' + providerName + '.js');


var  WebSite = (function()  {

	var  WebSite = function  WebSite(siteInfo)  {

		this.siteInfo = siteInfo;
		this.supportMultiD = false;
		this.standAlone = false;

		// local caches
		this.modCache = {};
		this.uriList = {},
		this.layoutMap = {},
		this.rootPath = {};

		var  themeBase = config.getWWW();
		if (siteInfo.sitePath)  {
			if (siteInfo.sitePath.charAt(0) === '.')
				themeBase = path.join(themeBase, siteInfo.sitePath);
			else
				themeBase = siteInfo.sitePath;
			this.standAlone = true;
		}
		var  themePath = path.join(themeBase, './themes/');
		//console.log('theme path: ' + themePath);

		if (siteInfo.theme)  {
			if (typeof siteInfo.theme === 'string')
				this.rootPath.desktop = path.join(themePath, siteInfo.theme);
			else  {
				for (var k in siteInfo.theme)
					this.rootPath[k] = path.join(themePath, siteInfo.theme[k]);
				this.supportMultiD = true;
			}
		}
		else
			this.rootPath.desktop = path.join(themePath, siteInfo.caCode);

		this.getUriList = function(userAgent)  {
			if (this.supportMultiD)  {
				if (!userAgent || (userAgent !== 'mobile' && userAgent !== 'tablet'))
					userAgent = 'desktop';
			}
			else
				userAgent = 'desktop';

			var  ulist = this.uriList[userAgent];
			if (ulist === undefined)  {
				try  {
					var  fdata = fs.readFileSync( this.getRootPath(userAgent) + '/siteURI.json' );
					ulist = JSON.parse( fdata );
				}
				catch (e) {
					ulist = null;
				}
				this.uriList[userAgent] = ulist;
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

			var  lm = this.layoutMap[userAgent];
			if (lm === undefined)  {
				try  {
					var  fdata = fs.readFileSync( this.getRootPath(userAgent) + '/layoutMap.json', {encoding:'utf-8'} );
					lm = JSON.parse( fdata );
				}
				catch (e)  {
				 	// allow 'layoutMap.json' to be missing
					lm = {};
				}
				this.layoutMap[userAgent] = lm;
			}
			return  lm;
		};

        this.getRootPath = function(userAgent)  {
			if (this.supportMultiD)  {
				var  p = this.rootPath[userAgent || 'desktop'];
				return  p || this.rootPath['desktop'];	// in case userAgent is neither desktop, mobile nor tablet
			}

			return  this.rootPath['desktop'];
        };
	};

	WebSite.prototype.run = function(req, res, cb) {
		var  urlParts = req.parsedURL,
			 psURI = urlParts.pathname,
			 inData = getInputData( req, urlParts ) || {},
			 locale = req.cookies._xs_locale || inData._loc || this.siteInfo.locale || 'en';

		//inData._loc = req.cookies._xs_locale || inData._loc || this.siteInfo.locale;
		//console.log('incoming request is [%s]', psURI);
		//console.log('[%s] -->\n%s', psURI, JSON.stringify(inData, null, 4));

		if (psURI.substring(0, 10) === '/_api/post')  {
			// do a relay to an API engine
			inData._loc = locale;

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
                psURI = this.siteInfo.home || '/index';

			var  userAgent = req.headers['user-agent'],
				 cmReq = {
				 	pathname: psURI,
				 	cookies: req.cookies,
					inData: inData,
					headers: req.headers,
					locale: locale
				 };
			cmReq.client = userAgent  ?  dd.detect(userAgent) : 'desktop';

			this.runBlock(res, cmReq, null, cb);
		}
	};


	WebSite.prototype.runBlock = function(res, cmReq, renderQ, cb) {
		var  plen = cmReq.pathname.length - 1;
		if (cmReq.pathname[plen] === '/')
			cmReq.pathname = cmReq.pathname.substring(0, plen);

		// 1. we need to know if this is a valid url.
		var  clientCategory = cmReq.client.category,
			 uriList = this.getUriList(clientCategory),
			 layoutMap = this.getLayoutMap(clientCategory),
			 srvObj = isValid(this.siteInfo, cmReq, uriList, layoutMap);
		//console.log('srvObj:\n', JSON.stringify(srvObj, null, 4));

		if (srvObj.viewPath)  {
			// this is a recognized page (block)
			//srvObj.title = srvObj.title || this.siteInfo.title;

			var  site = this;
			if (renderQ)
				renderQ.srvObj = srvObj;
			else  {
				renderQ = new RenderQ( this, srvObj );
				if (res)
					renderQ.setResponseObj( res );
			}

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
				var  themePath = this.getRootPath(cmReq.client.category),
					 mod = this.findService( themePath, srvObj.intPath );

				if (mod)  {
					// prepare the execution context
					var  ctx = {
							basePath: modBasePath,
							themePath: themePath,
							clientType: srvObj.client,
							cookies: cmReq.cookies,
							caCode: this.siteInfo.caCode,
							bi: srvObj
						 };
					if (cmReq.cookies && cmReq.cookies.token)
						ctx.token = cmReq.cookies.token;

					//ctx._loc = mapLocaleToID(cmReq.inData._loc);
					ctx._loc = mapLocaleToID(srvObj.locale);

					var  runMod = function(result) {
						if (result._stream)
							cb( true, result._stream );
						else  if (result._httpCode)  {
							var  rtnObj = {
									statusCode: result._httpCode,
									headers: result._httpHeaders,
									body: result._data
								 };
							cb( false, rtnObj );
						}
						else  {
                    		if (result._httpHeaders)  {
                    			// the local module may want to change the http respose headers
                    			for (var key in result._httpHeaders)
                    				res.setHeader(key, result._httpHeaders[key]);
                    			result = result._data || {};
                    		}

                    		viewIt(renderQ, srvObj, result, cb);
						}
                    };

                    if (typeof mod.execute === 'function')
						mod.execute(ctx, cmReq.inData, runMod);
					else  {
						if (typeof mod.setContext === 'function')
							mod.setContext(ctx);

						mod.run(cmReq.inData, runMod);
					}
				}
				else
					viewIt(renderQ, srvObj, {errCode: 0, message: 'No-op'}, cb);
			}
		}
        else  {
        	var  rtnObj = {};
        	rtnObj.body = srvObj.errMessage  ?  srvObj.errMessage : util.format('<div class="_xsError">Oops! The block [%s] is not found.</div>', cmReq.uri);
        	
        	cb( false, rtnObj );
        }
	};


	WebSite.prototype.findService = function(rootPath, pathname)  {
		var  mod = this.modCache[pathname];

		if (mod === undefined)  {
			var  modPath = rootPath + '/blocks/modules' + pathname + '.js';
			//console.log('modPath: ' + modPath);

			try  {
				//console.log('module path is ' + modPath);
				mod = require( modPath );
			}
			catch (e)  {
				//console.log('error type: ' + e.code);
				if (e.code != 'MODULE_NOT_FOUND')
					console.log( e.stack );
				//console.log('Trivial: block [%s] does not have a customized module', pathname);
				mod = null;
			}
			this.modCache[pathname] = mod;
		}

		return  mod;
	};


	/**
	 * Clear up the block mapping, so we can reload it.
	 */
	WebSite.prototype.resetBlockMap = function()  {
		this.uriList = {};
	};
	
	
	/**
	 * Clear up the layout mapping, so we can reload it.
	 */
	WebSite.prototype.resetLayoutMap = function()  {
		this.layoutMap = {};
	};

	return  WebSite;
})();

module.exports = WebSite;


/**
 * if 'pathname' is recognized by this website, an URI object will be returned.
 */
function isValid(siteInfo, cmReq, uriList, layoutMap)  {
	cmReq.uri = cmReq.pathname;		// keep the original request path in cmReq.uri

	var  srvObj = makeSrvObj(siteInfo, uriList, layoutMap, cmReq, 'no');

	if (!srvObj.viewPath)  {
		// get rid of 'id' and match the uriList again
		var  pathname = cmReq.pathname,
			 idx = pathname.lastIndexOf('/'),
			 id = pathname.substring(idx + 1);
		cmReq.pathname = pathname.substring(0, idx);

		srvObj = makeSrvObj(siteInfo, uriList, layoutMap, cmReq, 'yes');
		if (srvObj.viewPath)
			srvObj.id = id;
	}

	return  srvObj;
};


function  makeSrvObj(siteInfo, uriList, layoutMap, cmReq, needID)  {
	var  srvObj,
		 po = getPostFix(cmReq.pathname),
		 postFix = po.postFix,
		 pathname = po.p;
	//console.log('postfix: %s, pathname: %s', postFix, pathname);
	//console.log('url list is\n%s', JSON.stringify(uriList, null, 4));
	//console.log('cmReq:\n', JSON.stringify(cmReq, null, 4));

	//if (isFormatSupported(postFix) && uriList.hasOwnProperty(pathname))  {
	if (uriList.hasOwnProperty(pathname))  {
		// the input URL does not include 'id'
		var  pageInfo = uriList[pathname];

		// if the postfix is ignored, the value will be set to 'html'
		if (pageInfo.ignorePostfix)
			postFix = 'html';

		// the change below is to allow coServ to ignore the postfix in an URL
		if (isFormatSupported(postFix) && (pageInfo.id === needID || pageInfo.id === 'maybe'))  {
		//if (pageInfo.id === needID || pageInfo.id === 'maybe')  {
			var  inData = cmReq.inData || {},
				 knownAs = inData._cs_knownAs;
			delete  inData._cs_knownAs;

            if (pageInfo.query) {
            	var  pageQ = pageInfo.query;
            	//console.log('page query\n' + JSON.stringify(pageQ, null, 4));
				for (var p in pageQ)  {
					var  pi = pageQ[p];
					switch (pi.type)  {
						case 'int':
							inData[p] = parseInt(inData[p]);
							break;

						case 'bool':
							if (inData[p])  {
								var  intP = parseInt(inData[p]);
								if (isNaN(intP))
									inData[p] = inData[p] == 'true';
								else
									inData[p] = intP != 0;
							}
							else
								inData[p] = false;
							break;

						default:
							inData[p] = inData[p] + '';
					}
				}
			}

			// ok, this is a valid path. return its attributes
			var  isPage = postFix === 'html',
				 isGuest = cmReq.cookies.token  ?  cmReq.cookies.token[0] === '!' : true;

			if (isGuest && (pageInfo.isProtected || (pageInfo.isProtected === undefined && siteInfo.isProtected)))  {
				// this is page or block is protected, access will be blocked.
				if (isPage)
					cmReq.uri = pathname = siteInfo.home || '/index';
				else
					srvObj = {
						errMessage: util.format('<div class="_xsError">Not authorized to access [%s]</div>', cmReq.uri)
					};
			}
			
			if (!srvObj)
				srvObj = {
					uri: cmReq.uri, query: inData, cookies: cmReq.cookies, 'http-headers': cmReq.headers,
					intPath: pathname, postFix: postFix, service: pageInfo.service,
					viewPath: isPage  ?  '/layout/' + mapLayout(layoutMap, pathname) : '/blocks/views' + pathname,
					client: cmReq.client, isPage: isPage, knownAs: knownAs,
					title: pageInfo.title, description: pageInfo.description,
					locale: cmReq.locale,
					txEncode: 'utf-8',		// TODO: should not be hard-coded
					isGuest: isGuest
				};
		}
		else
			srvObj = {};
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
	if (srvObj.knownAs)
		renderQ.setCssID( srvObj.knownAs );

	var  pfix  = srvObj.postFix;
	//console.log('post fix is ' + pfix);

	if (pfix === 'html' || pfix === 'hf')  {
		if (srvObj.isPage)  {
			// preset title
			var  rtnValue = data.value,
				 rtnTitle,
				 rtnPageDescTx = srvObj.description;

			if (rtnValue)  {
				rtnTitle = rtnValue.title;
				if (rtnValue.summary)
					rtnPageDescTx = rtnValue.summary;
			}
			
			var  title = rtnTitle || srvObj.title || renderQ.getSite().siteInfo.title || srvObj.uri;
			renderQ.setPageTitle( title );
			renderQ.setPageDescription( rtnPageDescTx );
			//console.log(' page description: ' + rtnPageDescTx);
		}

		var  opPath = srvObj.intPath,
             rootPath = renderQ.webSite.getRootPath( srvObj.client.category ),
             pathObj = {
             	rootPath: rootPath,
             	path: rootPath + srvObj.viewPath, 
             	opPath: opPath
             },
			 wView = new WebView( pathObj, renderQ );
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
	//console.log('layout is ' + layoutName);

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

	else  if (req.method === 'POST')  {
		var  contentType = req.headers['content-type'].split(';')[0];
		//console.log('content type: ' + contentType);

		if (contentType === 'multipart/form-data')  {
			inData = req.body;
			inData.files = req.files;
		}
		else  {
			if (psURI.query)  {
				// accepting input from url
				inData = {};
				for (var k in psURI.query)
					inData[k] = psURI.query[k];
				for (var k in req.body)
					inData[k] = req.body[k];
			}
			else
				inData = req.body;
		}
	}

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
