/*!
 * coServ
 * authors: Ben Lue
 * Copyright(c) 2014 ~ 2019 Gocharm Inc.
 */

'use strict';

const  dd = require('../server/pp/DeviceDetector.js'),
	   fs = require('fs'),
	   path = require('path'),
	   util = require('util'),
       LRU = require('lru-cache'),
       BuildContext = require('../uic/BuildContext'),
       hasj = require('../uic/hAsJs'),
       render = require('./Render.js'),
       svProvider = require('../api/coimv2'),
       wtheme = require('./WebTheme');

class  WebSite  {

    constructor(siteInfo)  {
		console.log( JSON.stringify(siteInfo, null, 4) );
        this.siteInfo = siteInfo;
        this.locale = siteInfo.locale || 'en';
        this.supportMultiD = false;
        this._idCount = 0;

        this._themeMap = {};

        if (siteInfo.theme)  {
            if (typeof siteInfo.theme === 'string')
                this._themeMap.desktop = new wtheme(siteInfo, siteInfo.theme, 'desktop');
            else  {
                let  themeBag = {};
                for (let d in siteInfo.theme)  {
                    let  themeName = siteInfo.theme[d];

                    if (themeBag[themeName])
                        this._themeMap[d] = themeBag[themeName];
                    else
                        this._themeMap[d] = themeBag[themeName] = new wtheme(siteInfo, themeName, d);
                    this.supportMultiD = true;
                }
            }
        }

        if (!this._themeMap.desktop)
            this._themeMap.desktop = new wtheme(siteInfo, 'default', 'desktop');

        // check if this site is protected
		if (siteInfo.isProtected)  {
			if (siteInfo.authModule)
				this.authMethod = require( path.join(themeBase, '../' + siteInfo.authModule) ).isAuthorized;
			else
				this.authMethod = defaultAuthCheck;
		}

        this._moduleCache = LRU({
			max: 40		// allow 100 palets to be cached
		});
    }

    run(req, res, cb) {
		let  urlParts = req.parsedURL,
			 psURI = decodeURI( urlParts.pathname ),
			 inData = getInputData( req, urlParts ),
			 locale = req.cookies._xs_locale || inData._loc || this.locale;

		if (psURI.substring(0, 10) === '/_api/post')  {
			// do a relay to an API engine
			let  siteInfo = this.siteInfo,
				 appCode = inData.appCode || req.cookies.appCode || siteInfo.appCode || siteInfo.caCode,
				 postData = {
					appCode: appCode,
					appKey: siteInfo.appKeys[appCode],
					url: inData.url,
					post: inData.post,
					id: inData.id,
					locale: locale
				 };
			// console.log('API post data:\n' + JSON.stringify(postData, null, 4))

			svProvider.postToServer( postData, req, res, function(ctype, apiObj, isDone) {
				if (apiObj)  {
					// only json or text will go through this
					if (isDone)  {
						if (apiObj.token)
							setTokenAsCookie(res, apiObj.token);
							//engine.setToken( res, apiObj.token );

						var  rtnObj = {
								headers: {
									'Content-Type': 'application/json; charset=UTF-8'
								},
								body: JSON.stringify(apiObj)
							 };
						cb( rtnObj );
					}
				}
				else
					// simply do a proxy
					//cb( {_stream: ctype} );
					cb({
						stream: ctype,
						statusCode: ctype.statusCode,
						headers: ctype.headers
					});
			} );
		}
		else  {
			if (psURI === '/')
				// the default home or index page
				psURI = this.siteInfo.home || '/index';
			else  {
				// remove the trailing '/'
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

			this.runBlock(res, cmReq, cb);
		}
    }
    
    runBlock(res, cmReq, cb) {
		// check to see if this is a valid url.
        let  srvObj = this.verifyURI(cmReq);
		//console.log('srvObj:\n', JSON.stringify(srvObj, null, 4));

		if (srvObj.exception)  {
			// this page is not normal, will be handled differently
			let  result = {
					_httpCode: srvObj.exception.code,
					_httpHeaders: srvObj.exception.headers
				 };
			faceless( result, cb );
		}
		else  if (srvObj.isValid && srvObj.isAuthorized)  {
			let  bdCtx = new BuildContext(srvObj, this);

			this.buildBlockModel( cmReq, bdCtx, res, (err, uic, result) => {
				if (err)  {
					// something wrong with the palet source file
					let  err = hasj.reportError('url', '')
								   .add('div', util.format('Failed to build the model of palet [%s]', cmReq.uri))
								   .add('div', result);
					viewIt(null, bdCtx, err, cb);
				}
				else  {
					if (result)
						postModel(uic, bdCtx, result, res, cb);
					else
						viewIt(uic, bdCtx, {errCode: 0, message: 'No-op', value: cmReq.inData}, cb);
				}
			});
		}
        else  {
			let  bdCtx = new BuildContext(srvObj, this),
				 err = hasj.reportError('url', '')
							.add('div', util.format('Oops! The palet [%s] is not found.', cmReq.uri));
							
			// make up some data...
			srvObj.uri = cmReq.uri,
			srvObj.isPage = true;
			viewIt(null, bdCtx, err, cb);
        }
    }


    verifyURI(cmReq, skipIDTest) {
        if (this.authMethod)
            cmReq.isAuthorized = this.authMethod( cmReq.cookies.token );
            
        let  theme = this.theme(cmReq.client.category);
        return  theme.verifyThemeURI(cmReq, skipIDTest);
    }

    
    buildBlockModel(cmReq, bdCtx, res, cb) {
		let  srvObj = bdCtx.srvObj,
			 appCode = srvObj.cookies.appCode || this.siteInfo.appCode || this.siteInfo.caCode,
			 serviceURL;

		if (srvObj.service)  {
			if (typeof srvObj.service === 'string')
				serviceURL = srvObj.service;
			else  {
				serviceURL = srvObj.service.url;
				if (srvObj.service.appCode)
					appCode = srvObj.service.appCode;
			}
		}

		if (serviceURL)  {
			let  postData = {
					appCode: appCode,
					appKey: this.siteInfo.appKeys[appCode],
					url: serviceURL,
					post: srvObj.query,
					id: srvObj.id,
					locale: srvObj.locale
				 };

			svProvider.postToServer( postData, cmReq, res, function(ctype, apiObj, isDone) {
				if (apiObj)  {
					if (isDone)  {
						if (res && apiObj.token)
							// store token here
							setTokenAsCookie(res, apiObj.token);

						cb( null, null, apiObj );
					}
				}
				else
					cb( null, null, {
						_stream: ctype,
						_httpCode: ctype.statusCode,
						_httpHeaders: ctype.headers
					});
			});
		}
		else  {
            let  theme = this.theme( cmReq.client.category );
            theme.buildBlockModel(cmReq, bdCtx, cb);
		}
    }
    

    verfiyDeviceType(deviceType)  {
        if (this.supportMultiD)  {
            if (!deviceType || (deviceType !== 'mobile' && deviceType !== 'tablet'))
                deviceType = 'desktop';
        }
        else
            deviceType = 'desktop';

        return  deviceType;
    }


    theme(deviceType)  {
        deviceType = this.verfiyDeviceType(deviceType);
        return  this._themeMap[deviceType];
    }


    getUriList(deviceType)  {
        return  this.theme(deviceType).uriList;
    }


    getThemeRoot(deviceType)  {
        return  this.theme(deviceType).themeRoot;
    }


    readPageSource(deviceType, pathname)  {
        let  theme = this.theme(deviceType);
        return  theme.readPageSource( pathname );
    }


    readPaletSource(file, paRoot, deviceType)  {
        let  theme = this.theme(deviceType);
        return  theme.readPaletSource(file, paRoot);
    }
    

    readModuleSource(modPath)  {
		if (modPath.slice(-3) != '.js')
			modPath += '.js';

		let  mod = this._moduleCache.get( modPath );

		if (!mod)  {
			let  file = path.join(this.siteInfo.sitePath, modPath),
				 src = fs.readFileSync(file, {encoding: 'utf8'}),
				 stat = fs.statSync(file);
			mod = {
				src: src,
				srcTime: stat.mtime.getTime()
			};

			let  thisObj = {
					webSite : this,
					type: 'module.src',
					name: modPath
				 };
			fs.watchFile(file, fileMonitor.bind(thisObj));

			this._moduleCache.set( modPath, mod );
		}

		return  mod;
	}
	

	isStaticResource(req)  {
		let  psURI = decodeURI( req.parsedURL.pathname );
		if (psURI.slice(-1) === '/')
			// not allowed to read a directory
			return  null;

		if (psURI === '/xs.js')  {
			let  fpath = path.join(__dirname, '../client/xs.js')
			return  {
				noCaching: true,
				file: fpath
			}
		}
		else  {
			let  fpath = this.siteInfo.sitePath + '/assets' + psURI,
				 stat

			try  {
				stat = fs.statSync(fpath);

				if (stat.isDirectory())
					// not allowed to read a directory
					stat = null;
			}
			catch (err)  {
				stat = null;
			}
			return  stat  ?  {stat, file: fpath} : null
		}
	}
    

    paletIdCount()  {
		return  this._idCount++;
	}
}

module.exports = WebSite;


function  getInputData(req, psURI)  {
	let  inData;

	if (req.method === 'GET')
		inData = Object.getOwnPropertyNames(psURI.query).length  ?  psURI.query : {};

	else  if (req.method === 'POST')  {
		let  contentType = req.headers['content-type'].split(';')[0];
		//console.log('content type: ' + contentType);

		if (contentType === 'multipart/form-data')  {
			inData = req.body;
			inData.files = req.files;
		}
		else  {
			if (psURI.query)  {
				// accepting input from url
				inData = {};
				for (let k in psURI.query)
					inData[k] = psURI.query[k];
				for (let k in req.body)
					inData[k] = req.body[k];
			}
			else
				inData = req.body;
		}
	}

	return  inData || {};
}


function  faceless(result, cb)  {
	let  rtnObj = {
			statusCode: result._httpCode,
			headers: result._httpHeaders
		 };

	if (result._stream)
		rtnObj.stream = result._stream;
	else  {
		if (result._data)
			// this is to be compatible with ealier version (< 1.0)
			rtnObj.body = result._data;
	}
	cb( rtnObj );
}


/**
 * This funciton is invoked after a palet module returned.
 * 
 * @param {*} uic 
 * @param {*} bdCtx 
 * @param {*} result 
 * @param {*} cb 
 */
function  postModel(uic, bdCtx, result, res, cb) {
	if (result._stream || result._httpCode)
		faceless(result, cb);
	else  {
		if (result._httpHeaders)  {
			// the local module may want to change the http respose headers
			for (var key in result._httpHeaders)
				res.setHeader(key, result._httpHeaders[key]);

			if (result._data)
				// this is to be compatible with ealier version (< 1.0)
				result = result._data;
			else
				delete  result._httpHeaders;
		}

		viewIt(uic, bdCtx, result, cb);
	}
}


/**
 * run the page layout with the result
 * @param {*} uic 
 * @param {*} bdCtx 
 * @param {*} data 
 * @param {*} cb 
 */
function viewIt(uic, bdCtx, data, cb)  {
	let  srvObj = bdCtx.srvObj,
		 pfix  = srvObj.postFix,
		 isPage = srvObj.isPage;

	if (isPage || pfix === 'hf' || pfix === 'xs')  {
        if (uic)  {
			bdCtx.model = data;
			bdCtx.uicPath = srvObj.intPath;

			if (isPage || pfix === 'xs')  {
				let  deviceType = srvObj.client.category,
                     theme = bdCtx.webSite.theme(deviceType),
                     rootPath = theme.themeRoot;
                     
				bdCtx.srcPath = rootPath + getLayout(theme, bdCtx.uicPath);

				if (isPage)
					render.renderPage(uic, bdCtx, cb);
				else
					render.renderPreview(uic, bdCtx, cb);
			}
			else
				render.renderBlock(uic, bdCtx, cb);
		}
		else  {
			// handling errors
			let  webSite = bdCtx.webSite,
				 rootPath = webSite.getThemeRoot('desktop');
			bdCtx.srcPath = rootPath + '/layout/system.xs';
			bdCtx.blockRoot = rootPath + '/layout';
			bdCtx.uicPath = 'system';

			render.renderError(bdCtx, data, cb);
		}
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
				headers: {'Content-Type': header + txEncode},
				body: body
			 };

		cb( rtnObj );
	}
}


function  getLayout(theme, pathname)  {
	let  urlPath = pathname,
		 layoutName = null,
		 layoutMap = theme.layoutMap;

	while (urlPath)  {
		if (layoutName = layoutMap[urlPath])
			break;
		
		let  idx = urlPath.lastIndexOf('/');
		urlPath = idx > 0  ?  urlPath.substring(0, idx) : null;
	}
	//console.log('layout is ' + layoutName);

	return  '/layout/' + (layoutName || 'default') + '.xs';
};


/**
 * 
 * @param {*} res 
 * @param {*} token if null will delete the token cookie
 */
function setTokenAsCookie(res, tknInfo)  {
	let  token = tknInfo.token,
		 validTo = tknInfo.validTo || (new Date().getTime() + 5184000000);	// token default to be expired after 60 days.

	if (token)  {
		if (tknInfo.isGuest)
			token = '!' + token;
			
		res.setHeader( 'Set-Cookie', 'token=' + token + '; Path=/; expires=' + new Date( validTo ).toUTCString());
	}
	else
		res.setHeader( 'Set-Cookie', 'token=; Path=/; Max-Age=0; expires=' + new Date().toUTCString());
}


function  fileMonitor(curr)  {
	if (this.type === 'module.src')  {
		let  cache = this.webSite._moduleCache,
			 mod = cache.get( this.name );
		if (mod && mod.srcTime <= curr.mtime.getTime())
			cache.del( this.name );
    }
}


/**
 * return true for authorized accesses
 * @param {*} token 
 */
function  defaultAuthCheck(token)  {
	return  token  ?  token[0] !== '!' : false;
}