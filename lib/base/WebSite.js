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
		//rootPath = themePath + (siteInfo.theme  ?  siteInfo.theme : siteInfo.caCode);

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

	WebSite.prototype.run = function run(req, res, next) {
		var  urlParts = url.parse(req.url, true),
			 psURI = urlParts.pathname,
			 inData = getInputData( req, urlParts ) || {},
			 isDone = true;
		inData._loc = inData._loc || this.locale;

		if (psURI.substring(0, 10) === '/_api/post')  {
			// do a relay to an API engine
			svProvider.postToServer( this.siteInfo, inData, req, res, function(ctype, apiObj, isDone) {
				if (apiObj)  {
					// only json or text will go through this
					if (isDone)  {
						if (apiObj.token)
							engine.setToken( res, apiObj.token );

						res.setHeader( 'Content-Type', 'application/json; charset=UTF-8');
						res.end( JSON.stringify(apiObj) );
						next();
					}
				}
				else  {
					// simply do a proxy
					var  pxy_res = ctype;
					res.writeHead( pxy_res.statusCode, pxy_res.headers );
					pxy_res.pipe( res );
					next();
				}
			} );
		}
		else  {
			if (psURI === '/')  {
                psURI = this.siteInfo.home;

                var  psParts = psURI.split('?');
                if (psParts.length > 1)  {
                    psURI = psParts[0];
                    var  qs = querystring.parse( psParts[1] );
                    for (var k in qs)
		                 inData[k] = qs[k];
                }
            }

			var  userAgent = req.headers['user-agent'],
				 cmReq = {pathname: psURI, cookies: req.cookies,
						  inData: inData, headers: req.headers};
			cmReq.client = userAgent  ?  dd.detect(userAgent) : 'desktop';

			this.runBlock(res, cmReq, null, next);
		}
	};


	WebSite.prototype.runBlock = function runBlock(res, cmReq, renderQ, next) {
		// 1. we need to know if this is a valid url.
		var  clientCategory = cmReq.client.category,
			 uriList = this.getUriList(clientCategory),
			 layoutMap = this.getLayoutMap(clientCategory),
			 srvObj = isValid(cmReq, uriList, layoutMap);

		if (srvObj.viewPath)  {
			// this is a recognized page (block)
			srvObj.title = srvObj.title || this.siteInfo.title;

			var  site = this;
			renderQ = renderQ || new RenderQ( this, res, srvObj );
			if (next)
				renderQ.next = next;

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
							if (apiObj.token)  {
								console.log('token will be: ' + apiObj.token);
								engine.setToken( res, apiObj.token );
							}

							viewIt( renderQ, srvObj, apiObj );
						}
					}
					else  {
						var  pxy_res = ctype;
						res.writeHead( pxy_res.statusCode, pxy_res.headers );
						pxy_res.pipe( res );
					}
				});
			}
			else  {
				var  mod = findService( this.getRootPath(cmReq.client.category), srvObj.intPath );
				if (mod)  {
					if (typeof mod.setContext === 'function')  {
						var  ctx = {basePath: modBasePath};
						if (cmReq.cookies && cmReq.cookies.token)
							ctx.token = cmReq.cookies.token;
						//if (!cmReq.inData._loc && this.locale)
						//	ctx._loc = mapLocaleToID(this.locale);
						ctx._loc = mapLocaleToID(cmReq.inData._loc);

						mod.setContext(ctx);
					}

                    mod.run(cmReq.inData, function(result) {
						var  moveOn = true;

						if (result._httpCode)  {
							if (result._httpHeaders)
								res.writeHead( result._httpCode, result._httpHeaders );
							else
								res.writeHead( result._httpCode );

							if (!result._data)  {
								moveOn = false;
								res.end();
							}
						}
						else  if (result._httpHeaders)
							for (var key in result._httpHeaders)
								res.setHeader( key, result._httpHeaders[key] );

						if (moveOn)  {
							if (srvObj.hasView)
                        		viewIt(renderQ, srvObj, result);
                        	else  {
                        		// this block is faceless
								var  pxy_res = result;
								res.writeHead( pxy_res.statusCode, pxy_res.headers );
								pxy_res.pipe( res );
							}
						}
                    });
				}
				else
					viewIt(renderQ, srvObj, {errCode: 0, message: 'No-op'});
			}
		}
        else  {
            if (!renderQ)  {
            	renderQ = new RenderQ(this, res, srvObj);
            	renderQ.next = next;
            }

            renderQ.getItem(true).receiver(util.format('<div class="_xsError">Oops! The block [%s] is not found.</div>', cmReq.uri));
            renderQ.seal();
        }
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
				srvObj = {uri: cmReq.uri, query: inData, cookies: cmReq.cookies, 'http-headers': cmReq.headers,
						  intPath: pathname, postFix: postFix, service: uri.service,
						  client: cmReq.client, isPage: isPage};
				srvObj.viewPath = isPage  ?  '/layout/' + mapLayout(layoutMap, pathname) : '/blocks/views' + pathname;
				srvObj.hasView = uri.faceless ?  false : (isPage || postFix === 'hf');
				srvObj.txEncode = 'utf-8';		// TODO: should not be hard-coded
                srvObj.isGuest = cmReq.cookies.token  ?  false : true;
				if (isNaN(inData._loc))
					srvObj.locale = inData._loc;

				if (uri.title)
					srvObj.title = uri.title;
			}
		}
	}
	else  {
		postFix = isFormatSupported(postFix)  ?  postFix : 'html';
		var  isPage = postFix === 'html';
		srvObj = {isPage: isPage, postFix: postFix};
	}

	return  srvObj;
};


// run the page layout with the result
function viewIt(renderQ, srvObj, data)  {
	renderQ.setSrcData( data );
	var  pfix  = srvObj.postFix;

	if (pfix == 'wsj')
		renderQ.doOutput( JSON.stringify(data) );
	else  if (pfix == 'json')
		renderQ.doOutput( JSON.stringify(data.value || {}) );
	else  if (pfix == 'txt')
		renderQ.doOutput( data );
	else  {
		//console.log('is page? ' + srvObj.isPage);
		if (srvObj.isPage)  {
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
		}

		var  opPath = srvObj.intPath,
             rootPath = renderQ.webSite.getRootPath( srvObj.client.category ),
			 wView = new WebView( {rootPath: rootPath, path: rootPath + srvObj.viewPath, opPath:opPath}, renderQ );
		//console.log('block rootPath: %s, viewPath: %s', rootPath, srvObj.viewPath);
		wView.compose();
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


function findService(rootPath, pathname)  {
	var  modPath = rootPath + '/blocks/modules' + pathname + '.js',
		 mod = null;

	try  {
		//console.log('module path is ' + modPath);
		mod = require( modPath );
	}
	catch (e)  {
		//console.log('Trivial: block [%s] does not have a customized module', pathname);
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
