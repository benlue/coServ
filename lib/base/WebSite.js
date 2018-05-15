/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */
var  config = require('../server/config.js'),
	 dd = require('../server/pp/DeviceDetector.js'),
	 fs = require('fs'),
	 path = require('path'),
	 util = require('util'),
	 engine = require('../api/ApiEngine.js'),
	 sse = require('../server/sse/SSEManager.js'),
	 RenderQ = require('./RenderQ.js'),
	 WebView = require('./WebView.js'),
	 emulator = require('../uic/EmulateUIC');

const  modBasePath = path.join(__dirname, '../');

const  providerName = config.getApiEngine().version || 'v2',
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

		themeBase = themeBase.replace(/\\/g, "/");
		var  idx = themeBase.lastIndexOf('/');
		this.themeRoot = themeBase.substring(idx+1);

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
			 psURI = decodeURI( urlParts.pathname ),
			 inData = getInputData( req, urlParts ) || {},
			 locale = req.cookies._xs_locale || inData._loc || this.siteInfo.locale || 'en';

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
				// the default home or index page
				psURI = this.siteInfo.home || '/index';
			else  {
				if (psURI.slice(-1) === '/')
					psURI = psURI.slice(0, -1);
			}

			let  userAgent = req.headers['user-agent'],
				 client = userAgent  ?  dd.detect(userAgent) : {category: 'desktop'},
				 cmReq = {
				 	uri: psURI,
					inData: inData,
					cookies: req.cookies,
					headers: req.headers,
					locale: locale,
					client: client
				 };

			this.runBlock(res, cmReq, null, cb);
		}
	};


	/**
	 * Check if an UIC URI is valid.
	 * 
	 * @param {*} cmReq 
	 * @param {*} cb 
	 */
	WebSite.prototype.verifyURI = function(cmReq) {
		let  uriList = this.getUriList(cmReq.client.category);
		return  packRequestInfo(this, cmReq, uriList);
	}


	/**
	 * Build the block data model
	 * @param {*} cmReq 
	 * @param {*} renderQ 
	 * @param {*} res this is only used to set the token cookie. It's optional.
	 * @param {*} cb return an object of 'uic' and 'result'
	 */
	WebSite.prototype.buildBlockModel = function(cmReq, renderQ, res, cb) {
		let  srvObj = renderQ.srvObj;

		if (srvObj.service)  {
			let  postData = {
					post: srvObj.query,
					url: srvObj.service,
					id: srvObj.id
				 };
			//console.log('service post data\n%s', JSON.stringify(postData, null, 4));

			svProvider.postToServer( this.siteInfo, postData, cmReq, res, function(ctype, apiObj, isDone) {
				if (apiObj)  {
					if (isDone)  
						cb( null, apiObj );
				}
				else
					cb( null, {_stream: ctype} );
			});
		}
		else  {
			let  themePath = this.getRootPath(cmReq.client.category);

			if (srvObj.postFix == 'xs')  {
				let  blockRoot = themePath + '/blocks',
				xsPath = blockRoot + srvObj.intPath + '.xs';
					 //xsPath = blockRoot + '/' + srvObj.intPath + '.xs';

				emulator.interpretUIC(xsPath, blockRoot, renderQ).then( uic => {
					if (uic.err)  {
						cb(null, {
							code: -1,
							message: 'Syntax errors in the block model.',
							value: uic.err
						});
					}
					else  {
						// program does not have syntax errors, continue
						let  message;
						if (uic.checkIn && (message = emulator.checkInput( uic.checkIn, cmReq.inData )))
							// input error
							cb(null, {
								code: -2,
								message: 'Input parameter errors.',
								value: message
							});
						else  {
							let  ctx = renderQ.createCtx(srvObj.id);
							emulator.buildModel(uic, cmReq.inData, ctx).then( result => {
								cb( uic, result );
							});
						}
					}
				});
			}
			else  {
				let  mod = this.findService( themePath, srvObj.intPath );
				if (mod)  {
					// prepare the execution context
					var  ctx = {
							host: this.siteInfo.host,
							basePath: modBasePath,
							themePath: themePath,
							clientType: srvObj.client,
							cookies: cmReq.cookies,
							caCode: this.siteInfo.caCode,
							sse: sse,
							bi: srvObj,
							_loc: mapLocaleToID(srvObj.locale)
						};

					if (cmReq.cookies && cmReq.cookies.token)
						ctx.token = cmReq.cookies.token;

					try  {
						mod.execute(ctx, cmReq.inData, (result) => {
							cb(null, result);
						});
					}
					catch (e)  {
						console.log( e.stack );
						cb( null, {errCode: -1, message: 'Faild to run model.', value: e.stack});
					}
				}
				else
					cb();
			}
		}
	}


	WebSite.prototype.runBlock = function(res, cmReq, renderQ, cb) {
		// 1. we need to know if this is a valid url.
		let  srvObj = this.verifyURI(cmReq);
		//console.log('srvObj:\n', JSON.stringify(srvObj, null, 4));

		if (srvObj.isValid)  {
			var  site = this;
			if (renderQ)
				renderQ.srvObj = srvObj;
			else  {
				renderQ = new RenderQ( this, srvObj );
				//renderQ.isExt = srvObj.postFix === 'html' || cmReq.inData._dev;
				renderQ.isExt = srvObj.isPage || cmReq.inData._dev;

				if (res)
					renderQ.setResponseObj( res );
			}

			// 2. process the block
			this.buildBlockModel( cmReq, renderQ, res, (uic, result) => {
				if (result)
					postModel(uic, renderQ, result, cb);
				else
					viewIt(uic, renderQ, {errCode: 0, message: 'No-op', value: cmReq.inData}, cb);
			});
		}
        else  {
        	var  rtnObj = {
        			body: srvObj.errMessage  ?  srvObj.errMessage : util.format('<div class="_xsError">Oops! The block [%s] is not found.</div>', cmReq.uri)
        		 };
        	
        	cb( false, rtnObj );
        }
	};


	WebSite.prototype.findService = function(rootPath, pathname)  {
		let  mod = this.modCache[pathname];

		if (mod === undefined)  {
			let  modPath = rootPath + '/blocks/modules' + pathname + '.js';

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
 * This funciton is invoked after a block module returned.
 * 
 * @param {*} uic 
 * @param {*} renderQ 
 * @param {*} result 
 * @param {*} cb 
 */
function  postModel(uic, renderQ, result, cb) {
	//if (ctx.token)
		// TODO: this may cause problem if the same user tried to login multiple times
		//engine.setToken(res, ctx.token);

	if (result._stream)
		cb( true, result._stream );
	else  if (result._httpCode)  {
		let  rtnObj = {
				statusCode: result._httpCode,
				headers: result._httpHeaders,
				body: result._data
			 };
		cb( false, rtnObj );
	}
	else  {
		if (result._httpHeaders)  {
			let  res = renderQ.getResponseObj();
			// the local module may want to change the http respose headers
			for (var key in result._httpHeaders)
				res.setHeader(key, result._httpHeaders[key]);
			result = result._data || {};
		}

		viewIt(uic, renderQ, result, cb);
	}
}


/**
 * if 'pathname' is recognized by this website, an URI object will be returned.
 */
function packRequestInfo(webSite, cmReq, uriList)  {
	let  siteInfo = webSite.siteInfo,
		 themePath = webSite.getRootPath(cmReq.client.category),
		 uriParts = cmReq.uri.split('/'),
		 po = getPostFix(uriParts),
		 id = uriParts.slice(-1)[0];	// the possible block ID
	po.needID = 'no';

	let  vpath = path.join(themePath, 'blocks/' + po.p),
		 postFix,
		 xsPath = vpath + '.xs';
	if (fs.existsSync(xsPath))
		postFix = 'xs';
	else  {
		let  mdPath = vpath + '.md';
		if (fs.existsSync(mdPath))
			postFix = 'md';
	}

	let	 srvObj = makeSrvObj(siteInfo, uriList, cmReq, po);
	if (!srvObj.isValid && postFix)  {
		// check if this is a XS block
		uriList[po.p] = {
			title: 'Unknown Block',
			id: "no"
		};

		srvObj = makeSrvObj(siteInfo, uriList, cmReq, po);
	}

	if (srvObj.isValid)  {
		if (postFix)
			srvObj.postFix = postFix;
		return  srvObj;
	}

	// if the url is still determined as not valid, it may include the 'id' part
	// remove the 'id' section and try the match again
	po = getPostFix(uriParts.slice(0, -1));
	po.needID = 'yes';

	let  idx = id.indexOf('.');
	if (idx > 0)  {
		po.postFix = id.substring(idx+1);
		id = id.substring(0, idx);
	}

	xsPath = path.join(themePath, 'blocks/' + po.p + '.xs');
	postFix = fs.existsSync(xsPath)  ?  'xs' : null;

	srvObj = makeSrvObj(siteInfo, uriList, cmReq, po);
	if (!srvObj.isValid && postFix)  {
		// check if this is a XS block (with the block id)
		uriList[po.p] = {
			title: 'Unknown Block',
			id: "yes"
		};

		srvObj = makeSrvObj(siteInfo, uriList, cmReq, po);
	}

	if (srvObj.isValid)  {
		if (postFix)
			srvObj.postFix = postFix;
		srvObj.id = id;
		cmReq.uri = po.p;
	}
	return  srvObj;
};


function  makeSrvObj(siteInfo, uriList, cmReq, po)  {
	let  srvObj,
		 postFix = po.postFix,
		 pathname = po.p,
		 pageInfo = uriList[pathname];
		 
	if (pageInfo)  {
		// if the postfix is ignored, the value will be set to 'html'
		if (pageInfo.ignorePostfix)
			postFix = 'html';

		// the change below is to allow coServ to ignore the postfix in an URL
		if (isFormatSupported(postFix) && (pageInfo.id === po.needID || pageInfo.id === 'maybe'))  {
			var  inData = cmReq.inData,
				 knownAs = inData._cs_knownAs;
			delete  inData._cs_knownAs;

			// ok, this is a valid path. return its attributes
			var  isPage = postFix === 'html',
				 isGuest = cmReq.cookies.token  ?  cmReq.cookies.token[0] === '!' : true;

			if (isGuest && (pageInfo.isProtected || (pageInfo.isProtected === undefined && siteInfo.isProtected)))  {
				// this is page or block is protected, access will be blocked.
				if (isPage)
					cmReq.uri = pathname = siteInfo.login || siteInfo.home || '/index';
				else
					srvObj = {
						errMessage: util.format('<div class="_xsError">Not authorized to access [%s]</div>', cmReq.uri),
						isValid: true
					};
			}
			
			if (!srvObj)
				srvObj = {
					uri: cmReq.uri, query: inData, cookies: cmReq.cookies, 'http-headers': cmReq.headers,
					intPath: pathname, postFix: postFix, service: pageInfo.service,
					client: cmReq.client, knownAs: knownAs,  isPage: isPage, 
					title: pageInfo.title, description: pageInfo.description,
					locale: cmReq.locale,
					txEncode: 'utf-8',		// TODO: should not be hard-coded
					isGuest: isGuest,
					//isXS: pageInfo.isXS,
					isValid: true
				};
		}
	}

	return  srvObj || {};
};


// run the page layout with the result
function viewIt(uic, renderQ, data, cb)  {
	let  srvObj = renderQ.srvObj,
		 pfix  = srvObj.postFix,
		 isPage = srvObj.isPage;
		 //isPage = pfix === 'html';

	if (isPage || pfix === 'hf' || pfix === 'xs')  {
		let  httpHeaders = srvObj['http-headers'],
			 blkID = httpHeaders['x-xs-blockid'] || srvObj.knownAs;
		if (blkID)
			renderQ.setCssID( blkID );

		renderQ.setSrcData( data );

		if (isPage)  {
			// preset title
			let  rtnValue = data.value,
				rtnTitle,
				rtnPageDescTx = srvObj.description;

			if (rtnValue)  {
				rtnTitle = rtnValue.title;
				if (rtnValue.summary)
					rtnPageDescTx = rtnValue.summary;
			}
			
			let  title = rtnTitle || srvObj.title || renderQ.getSite().siteInfo.title || srvObj.uri;
			renderQ.setPageTitle( title );
			renderQ.setPageDescription( rtnPageDescTx );
		}

		let  clientType = srvObj.client.category,
			 layoutMap = renderQ.webSite.getLayoutMap( clientType ),
			 opPath = srvObj.intPath,
			 rootPath = renderQ.webSite.getRootPath( clientType ),
			 viewPath =  (renderQ.parentQ || !renderQ.isExt)  ?
			 			 '/blocks/views' + opPath : '/layout/' + mapLayout(layoutMap, opPath);

		let  pathObj = {
             	rootPath: rootPath,
             	path: rootPath + viewPath,
             	opPath: opPath
             },
			 wView = new WebView( pathObj, renderQ );

		if (isPage)  {
			renderQ.uic = uic;
			wView.compose(null, pfix, cb);
		}
		else
			wView.compose(uic, pfix, cb);
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
	return  pf === 'html' || pf === 'hf' || pf === 'wsj' || pf === 'xs' || pf === 'json' || pf === 'txt' || pf === 'md';
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


function getPostFix(up)  {
	let  lastp = up.slice(-1)[0],
		 idx = lastp.indexOf('.'),
		 postFix = 'html';

	if (idx > 0)  {
		postFix = lastp.substring(idx+1);
		p = up.slice(0, -1).join('/') + '/' + lastp.substring(0, idx);
	}
	else
		p = up.join('/');

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
