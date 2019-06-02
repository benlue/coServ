/*!
 * WebTheme.js
 * authors: Ben Lue
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */

'use strict';

const  fs = require('fs'),
	   path = require('path'),
	   util = require('util'),
	   LRU = require('lru-cache'),
	   PaletCache = require('./PaletCache'),
	   sse = require('../server/sse/SSEManager.js'),
	   JSONH = require('../uic/jsonh'),
	   emulator = require('../uic/EmulateUIC');

class  WebTheme  {

	constructor(siteInfo, themeName, deviceType)  {

		this.siteInfo = siteInfo;
		this.deviceType = deviceType;

		// local caches
		this._layoutCache = LRU({
			max: 10		// allow 10 layouts to be cached
		});
		this._paletCache = new PaletCache(deviceType, 100 );		// allow 100 palets to be cached

		let  themePath = path.join(siteInfo.sitePath, './themes/');
		this._themeRoot = path.join(themePath, themeName);
		//console.log('theme path: ' + themePath);
	}

	get uriList() {
		let  ulist = this._uriList;
		if (ulist === undefined)  {
			try  {
				let  fdata = fs.readFileSync( this.themeRoot + '/siteURI.json' );
				ulist = JSON.parse( fdata );
			}
			catch (e) {
				console.log( e.stack );
				ulist = [];
			}
			this._uriList = ulist;
		}
		return  ulist;
	}

	get layoutMap()  {
		let  lm = this._layoutMap;
		if (lm === undefined)  {
			try  {
				let  fdata = fs.readFileSync( this.themeRoot + '/layoutMap.json', {encoding:'utf-8'} );
				lm = JSON.parse( fdata );
			}
			catch (e)  {
				// allow 'layoutMap.json' to be missing
				lm = {};
			}
			this._layoutMap = lm;
		}
		return  lm;
	}

    get themeRoot()  {
		return  this._themeRoot;
	}
		
	get layoutCache()  {
		return  this._layoutCache;
	}

	get paletCache()  {
		return  this._paletCache;
	}

	readPageSource(pathname)  {
		let  urlPath = pathname,
			 layoutName = 'default',
			 layoutMap = this.layoutMap;

		while (urlPath)  {
			if (layoutMap[urlPath])  {
				layoutName = layoutMap[urlPath];
				break;
			}
			
			let  idx = urlPath.lastIndexOf('/');
			urlPath = idx > 0  ?  urlPath.substring(0, idx) : null;
		}

		let  page = this.layoutCache.get( layoutName ),
			 theme = this,
			 //rootPath = this.themeRoot,
			 fpath = this.themeRoot + '/layout/' + layoutName,
			 cssFile = fpath + '.css';

		if (page)  {
			// the layout may initially missing the css part
			if (!page.cssTime && fs.existsSync(cssFile))  {
				page.css = fs.readFileSync( cssFile, {encoding: 'utf8'} );
				page.cssTime = fs.statSync(cssFile).mtime.getTime();

				fs.watchFile(cssFile, fileMonitor.bind({
					theme : theme,
					type: 'layout.css',
					name: layoutName
				}));
			}
		}
		else  {
			let  file = fpath + '.xs'

			let  src = fs.readFileSync(file, {encoding: 'utf8'}),
				 stat = fs.statSync(file);
			page = {
				html: src,
				htmlTime: stat.mtime.getTime()
			};

			fs.watchFile(file, fileMonitor.bind({
				theme : theme,
				type: 'layout.html',
				name: layoutName
			}));

			if (fs.existsSync(cssFile))  {
				page.css = fs.readFileSync( cssFile, {encoding: 'utf8'} );
				page.cssTime = fs.statSync(cssFile).mtime.getTime();

				fs.watchFile(cssFile, fileMonitor.bind({
					theme : theme,
					type: 'layout.css',
					name: layoutName
				}));
			}

			this.layoutCache.set( layoutName, page );
		}

		return  page;
	}


	/**
	 * 
	 * @param {*} file full path of a local file, OR the path name of a remote palet/UIC
	 * @param {*} paRoot the root path of a palet/UIC, OR the server specification like palet@coServ
	 */
	readPaletSource(file, paRoot)  {
		if (paRoot.slice(-1) == '/')
			paRoot = paRoot.slice(0, -1);

		return  this.paletCache.readSource( file, paRoot );
	}


	/**
	 * Check if an UIC URI is valid.
	 * 
	 * @param {*} cmReq 
	 * @param {*} cb 
	 */
	verifyThemeURI(cmReq, skipIDTest) {
		let  siteInfo = this.siteInfo,
			 uriParts = cmReq.uri.split('/'),
			 po = getPostFix(uriParts),
			 id = uriParts.slice(-1)[0];	// the possible palet ID
		po.needID = 'no';

		let  uriList = this.uriList,
			 vpath = path.join(this.themeRoot, 'palets/' + po.p),
			 pageInfo = uriList[po.p],
			 srvObj = {};

		if (!pageInfo)  {
			if (fs.existsSync(vpath + '.xs'))  {
				// palet exist. just not pre-specified!
				pageInfo = uriList[po.p] = {
					title: 'Unknown Palet',
					id: 'no'
				};
			}
			else  if (fs.existsSync(vpath + '.html'))
				// allow static HTML files
				pageInfo = uriList[po.p] = {
					id: 'no'
				};
			else  if (fs.existsSync(vpath + '.md'))
				// allow static markdown files
				pageInfo = uriList[po.p] = {
					id: 'no'
				};
		}

		if (pageInfo)  {
			srvObj = makeSrvObj(siteInfo, pageInfo, cmReq, po, skipIDTest);
			if (srvObj.isValid)
				return  srvObj;
		}

		// if the url is still determined as not valid, it may include the 'id' part
		// remove the 'id' section and try the match again
		if (uriParts.length > 1)  {
			po = getPostFix(uriParts.slice(0, -1));
			po.needID = 'yes';

			let  idx = id.indexOf('.');
			if (idx > 0)  {
				po.postFix = id.substring(idx+1);
				id = id.substring(0, idx);
			}

			pageInfo = uriList[po.p];
			if (!pageInfo)  {
				let  xsPath = path.join(this.themeRoot, 'palets/' + po.p + '.xs');
				if (fs.existsSync(xsPath))  {
					// palet exist. just not pre-specified!
					pageInfo = uriList[po.p] = {
						title: 'Unknown Palet',
						id: "yes"
					};
				}
			}

			if (pageInfo)
				srvObj = makeSrvObj(siteInfo, pageInfo, cmReq, po, skipIDTest);

			if (srvObj.isValid)  {
				srvObj.id = id;
				cmReq.uri = po.p;
			}
		}
		return  srvObj;
	}


	/**
	 * Build the palet data model
	 * @param {*} cmReq 
	 * @param {*} bdCtx 
	 * @param {*} res this is only used to set the token cookie. It's optional.
	 * @param {*} cb return an object of 'uic' and 'result'
	 */
	buildBlockModel(cmReq, bdCtx, cb) {
		let  blockRoot = this.themeRoot + '/palets',
			 //xsPath = blockRoot + bdCtx.srvObj.intPath + '.xs',
			 psPath = blockRoot + bdCtx.srvObj.intPath,
			 source = this.readPaletSource(psPath, blockRoot);

		bdCtx.blockRoot = blockRoot;
		bdCtx.srcPath = psPath + '.xs';

		if (source.then)
			source.then( src => {
				runPaletModel(src.html, cmReq, bdCtx, cb);
			});
		else
			runPaletModel(source.html, cmReq, bdCtx, cb);
	}

}

module.exports = WebTheme;


function  runPaletModel(src, cmReq, bdCtx, cb)  {
	let  srvObj = bdCtx.srvObj;

	emulator.interpretXS(src, bdCtx).then( uic => {
		if (uic.err)
			cb(new Error('syntax error'), null, (uic.err instanceof JSONH)  ?  uic.err.toHTML() : uic.err);
		else  {
			// program does not have syntax errors, continue
			if (uic.checkIn && uic.checkIn._id)  {
				let  theme = bdCtx.webSite.theme(cmReq.client.category),
					 uriList = theme.uriList,
					 pageInfo = uriList[srvObj.intPath];
				if (pageInfo)
					pageInfo.id = uic.checkIn._id['@required']  ?  'yes' : 'no';
			}

			let  message;
			if (uic.checkIn && (message = emulator.checkInput( bdCtx.endpID, uic.checkIn, cmReq.inData )))  {
				// input error
				if (message instanceof JSONH)
					message = message.toHTML();

				cb(new Error('input error'), null, message);
			}
			else  {
				let  webSite = bdCtx.webSite,
					 cssID = cmReq.headers['x-xs-blockid'],
					 ctx = bdCtx.createCtx(cssID);

				emulator.buildModel(webSite, uic, cmReq.inData, ctx).then( result => {
					if (result.token)
						// store token here
						setTokenAsCookie(res, result.token);

					if (ctx.title)
						srvObj.title = ctx.title;
					if (ctx.description)
						srvObj.description = ctx.description;

					// preserve the original input
					bdCtx.input = cmReq.inData;

					cb( null, uic, result );
				});
			}
		}
	})
	.catch(err => {
		console.log( err.stack );
		cb(err, null, '<div class="_xsError">Oops! The palet [' + srvObj.intPath + '] failed to be compiled.</div>');
	});
}


function  makeSrvObj(siteInfo, pageInfo, cmReq, po, skipIDTest)  {
	let  srvObj,
		 postFix = po.postFix,
		 pathname = po.p;

	if (pageInfo.exception)  {
		srvObj = {
			isValid: true,
			exception: pageInfo.exception
		};
		return  srvObj;
	}
		 
	// if the postfix is ignored, the value will be set to 'html'
	if (pageInfo.ignorePostfix)
		postFix = 'html';

	// defulat id to 'not required'
	pageInfo.id = pageInfo.id || 'no';

	// the change below is to allow coServ to ignore the postfix in an URL
	if (isFormatSupported(postFix) && (skipIDTest || pageInfo.id === po.needID || pageInfo.id === 'maybe'))  {
		let  inData = cmReq.inData;

		// ok, this is a valid path. return its attributes
		let  isPage = postFix === 'html',
			 isGuest = !cmReq.isAuthorized;

		if (isGuest && (pageInfo.protected || (pageInfo.protected === undefined && siteInfo.isProtected)))  {
			// this is page or palet is protected, access will be blocked.
			if (isPage)
				cmReq.uri = pathname = siteInfo.login || siteInfo.home || '/index';
			else
				srvObj = {
					errMessage: util.format('<div class="_xsError">Not authorized to access [%s]</div>', cmReq.uri),
					isAuthorized: false,
					isValid: true
				};
		}
		
		if (!srvObj)
			srvObj = {
				uri: cmReq.uri, query: inData, cookies: cmReq.cookies, 'http-headers': cmReq.headers,
				intPath: pathname, postFix: postFix, service: pageInfo.service,
				client: cmReq.client, isPage: isPage, 
				title: pageInfo.title || siteInfo.title,
				description: pageInfo.description,
				locale: cmReq.locale,
				txEncode: 'utf-8',		// TODO: should not be hard-coded
				isAuthorized: true,
				isValid: true
			};
	}

	return  srvObj || {};
}


function  isFormatSupported(pf)  {
	return  pf === 'html' || pf === 'hf' || pf === 'wsj' || pf === 'xs' || pf === 'json' || pf === 'txt' || pf === 'md';
}


function getPostFix(up)  {
	let  lastp = up.slice(-1)[0],
		 idx = lastp.indexOf('.'),
		 postFix = 'html',
		 p;

	if (idx > 0)  {
		postFix = lastp.substring(idx+1);
		p = up.slice(0, -1).join('/') + '/' + lastp.substring(0, idx);
	}
	else
		p = up.join('/');

	return  {p: p, postFix: postFix};
};


function  fileMonitor(curr)  {
	if (this.type === 'layout.html')  {
		let  layoutCache = this.theme.layoutCache,
			 page = layoutCache.get( this.name );

		if (page && page.htmlTime <= curr.mtime.getTime())
			layoutCache.del( this.name );
	}
	else  if (this.type === 'layout.css')  {
		let  layoutCache = this.theme.layoutCache,
			 page = layoutCache.get( this.name );

		if (page && page.cssTime <= curr.mtime.getTime())
			layoutCache.del( this.name );
	}
}


/**
 * 
 * @param {*} res 
 * @param {*} token if null will delete the token cookie
 */
function setTokenAsCookie(res, tknInfo)  {
	//console.log( JSON.stringify(tknInfo, null, 4) );
	
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