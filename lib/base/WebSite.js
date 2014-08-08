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

var  modBasePath = path.join(__dirname, '../');

var  WebSite = (function()  {
	var  WebSite = function  WebSite(siteInfo, rPath)  {
		this.siteInfo = siteInfo;
		this.siteName = siteInfo.caCode;
		this.locale = siteInfo.locale;
		rootPath = rPath + (siteInfo.theme  ?  siteInfo.theme : siteInfo.caCode);

		var  uriList,
			 layoutMap,
             rootPath;

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

        this.getRootPath = function()  {
            return  rootPath;
        };
	};

	WebSite.prototype.run = function run(req, res) {
		var  urlParts = url.parse(req.url, true),
			 psURI = urlParts.pathname,
			 inData = getInputData( req, urlParts ) || {},
			 isDone = true;

		inData._loc = inData._loc || this.locale;

		if (psURI.substring(0, 10) === '/_api/post')  {
			// do a relay to the API engine
			var  apiPath = '/' + (inData.hasCA  ?  '' : this.siteName) + inData.url;
			if (inData.id)
				apiPath += '/' + inData.id;

			inData.post = inData.post || {};
			if (req.cookies.token)  {
				inData.post.token = req.cookies.token;
				//delete  inData.post._key;
				console.log('requested api: %s, token: %s', apiPath, inData.post.token);
			}
			else  if (this.siteInfo.appKeys)  {
				// no token. so we should send out appKey
				var  siteName = inData.hasCA  ?  inData.url.split('/')[0] : this.siteName;
				inData.post._key = this.siteInfo.appKeys[siteName];
				console.log('requested api: %s, appKey: %s', apiPath, inData.post._key);
			}
			else
				console.log('requested api: %s. No token, no appKey.');

			inData.post._loc = inData.post._loc || mapLocaleToID(inData._loc);

			engine.request(apiPath, inData.post, function(ctype, apiObj, isDone) {
				if (apiObj)  {
					// only json or text will go through this
					if (isDone)  {
						if (apiObj.token)
							engine.setToken( res, apiObj.token );

						res.setHeader( 'Content-Type', 'application/json; charset=UTF-8');
						res.end( JSON.stringify(apiObj) );
					}
				}
				else  {
					// simply do a proxy
					var  pxy_res = ctype;
					res.writeHead( pxy_res.statusCode, pxy_res.headers );
					pxy_res.pipe( res );
				}
			});
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

			var  cmReq = {pathname: psURI, cookies: req.cookies, inData: inData};
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
                var  siteName = inData.hasCA  ?  inData.url.split('/')[0] : this.siteName,
                     apiPath = '/' + siteName + srvObj.service;
				//var  apiPath = '/' + this.siteName + srvObj.service;
				if (srvObj.id)
					apiPath += '/' + srvObj.id;
				console.log('requested api: %s', apiPath);

				cmReq.inData = cmReq.inData || {};
				if (cmReq.cookies && cmReq.cookies.token)  {
					cmReq.inData.token = cmReq.cookies.token;
                    if (this.siteInfo.appKeys)
                        cmReq.inData._key = this.siteInfo.appKeys[siteName];
					console.log('requested api: %s, token: %s', apiPath, cmReq.inData.token);
				}
				else  if (this.siteInfo.appKeys)  {
					// no token. so we should send out appKey
					//var  siteName = inData.hasCA  ?  inData.url.split('/')[0] : this.siteName;
					cmReq.inData._key = this.siteInfo.appKeys[siteName];
					console.log('requested api: %s, appKey: %s', apiPath, cmReq.inData._key);
				}
				else
					console.log('requested api: %s. No token, no appKey.');

				cmReq.inData._loc = mapLocaleToID(cmReq.inData._loc);

				engine.request(apiPath, cmReq.inData, function(ctype, apiObj, isDone) {
					if (apiObj)  {
						if (isDone)  {
							if (apiObj.token)
								engine.setToken( res, apiObj.token );

							site.viewIt( renderQ, srvObj, apiObj );
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
				var  mod = findService( this.getRootPath(), srvObj.intPath );
				if (mod)  {
					// register the module with renderQ, so renderQ will clean up all listeners when a page is done
					renderQ.mod = mod;
					if (typeof mod.setContext === 'function')  {
						var  ctx = {basePath: modBasePath};
						if (cmReq.cookies && cmReq.cookies.token)
							ctx.token = cmReq.cookies.token;
						//if (!cmReq.inData._loc && this.locale)
						//	ctx._loc = mapLocaleToID(this.locale);
						ctx._loc = mapLocaleToID(cmReq.inData._loc);

						mod.setContext(ctx);
					}

                    if (typeof mod.on === 'function')  {
                        // backward compatible. should not be used anymore.
                        mod.on('done', function(result) {
                            site.viewIt(renderQ, srvObj, result);
                        });

                        mod.run(cmReq.inData);
                    }
                    else
                        mod.run(cmReq.inData, function(result) {
                            site.viewIt(renderQ, srvObj, result);
                        });
				}
				else
					site.viewIt(renderQ, srvObj, {errCode: 0, message: 'No-op'});
			}
		}
        else
            console.log('Oops! The block [%s] is not found.', cmReq.pathname);

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
                 rootPath = this.getRootPath(),
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

            if (uri.params) {
				for (var p in uri.params)
					inData[p] = uri.params[p];
			}

			if (inData && uri.hasOwnProperty('args'))  {
				for (var i = 0, len = uri.args.length; isOk && i < len; i++)
					isOk = inData[uri.args[i]]  ?  true : false;
			}

			if (isOk)  {
				// ok, this is a valid path. return its attributes
				var  isPage = postFix === 'html';
				srvObj = {uri: cmReq.uri, query: inData, cookies: cmReq.cookies, locale: inData._loc,
						  intPath: pathname, args: uri.args, postFix: postFix, service: uri.service, isPage: isPage};
				srvObj.viewPath = isPage  ?  '/layout/' + mapLayout(layoutMap, pathname) : '/blocks/views' + pathname;
				srvObj.hasView = isPage || postFix === 'hf';
				srvObj.txEncode = 'utf-8';		// TODO: should not be hard-coded
                srvObj.isGuest = cmReq.cookies.token  ?  false : true;

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


function findService(rootPath, pathname)  {
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
