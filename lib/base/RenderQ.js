/*!
* coServ
* authors: Ben Lue
* license: MIT
* Copyright(c) 2014 ~ 2016 Gocharm Inc.
*/
var  path = require('path'),
	 jass = require('../css/jass'),
	 WebView = require('./WebView'),
	 Promise = require('bluebird');

var  RenderQ = (function()  {

	var  RenderQ = function RenderQ(webSite, srvObj, parentQ)  {
		this.webSite = webSite;

		if (parentQ)  {
			this.parentQ = parentQ;
			this.pCssID = parentQ.cssID;
		}
		else  {
			this.srvObj = srvObj;
			//this.isPage = srvObj.isPage;

			// initialize include lists
			this.incCSS = [];
			this.incJS = [];
		}

		var  queue = [];

		this.add = function(item)  {
			return  queue.push(item) - 1;
		};

		this.seal = function(cb)  {
			var  rq = this,
				 jsProg = '';

			for (var i in queue)  {
				var  item = queue[i];

				if (typeof item === 'string')
					jsProg += '\nhtml.push(hline[' + i + ']);';
				else  if (item.hasOwnProperty('code'))
					jsProg += item.code;
				else  if (item.value)
					jsProg += '\nhtml.push(' + item.value + ');';
			}
			//console.log(jsProg);

			(function(jsStr, hline) {
				var  srcData = rq.getSrcData(),
					 value = srcData.value || {},
					 errCode = srcData.errCode,
					 message = srcData.message || '',
					 ph = rq.phrases,
					 ctx = {id: rq.cssID || '', pCssID: rq.pCssID,
							title: rq.getPageTitle(), description: rq.getPageDescription(),
							locID: mapLocaleToID(rq.getLocale()), 
							caCode: rq.getSite().siteInfo.caCode , pageURI: rq.getPageURI()},
					 bi = rq.srvObj,
					 _params = rq.compParams,
					 html = [],
					 bindObj = {rq:rq, html: html},
					 block = blockFun.bind(bindObj),
					 wcomp = wcompFun.bind(bindObj),
					 includeCss = incCssFun.bind(bindObj),
					 includeJs = incJsFun.bind(bindObj),
					 css = cssFun.bind(bindObj),
					 js = jsFun.bind(bindObj),
					 $ = jass;
				//console.log('ctx\n' + JSON.stringify(ctx, null, 4));

				try  {
					eval( jsStr );
					
					Promise.all(html).then(function()  {
						//console.log('result:\n' + JSON.stringify(html, null, 4));
						var  htmlStr = '';
						for (var i in html)  {
							var  item = html[i];
							if (item)  {
								if (item.then)
									htmlStr += item.value();
								else  if (item.type && !rq.parentQ)  {
									var lines;

									switch (item.type)  {
										case 'css':
											lines = rq.cssStr || '';
											break;
										case 'js':
											lines = rq.jsStr || '';
											break;
										case 'incCss':
											if (rq.incCSS)  {
												lines = '';
												for (var i in rq.incCSS)
													lines += '<link rel="stylesheet" type="text/css" href="' + rq.incCSS[i] + '">\n';
											}
											break;
										case 'incJs':
											if (rq.incJS)  {
												lines = '';
												for (var i in rq.incJS)
													lines += '<script type="text/javascript" src="' + rq.incJS[i] + '"></script>\n';
												lines += '<script type="text/javascript" src="/wFront.js"></script>\n';
											}
											break;
									}
									htmlStr += lines;
								}
								else  if (typeof item === 'string')
									htmlStr += item;
								else  {
									
									htmlStr += JSON.stringify(item);
								}
							}
						}

						if (rq.parentQ)
							cb( false, {body: htmlStr} );
						else
							rq.doOutput( htmlStr, cb );
					});
				}
				catch (e)  {
					// TODO: do we have a better way to show error message?
					console.log('Block[%s] failed to evaluate its template: %s', bi.uri, e.message);
					var  htmlStr = e.message;
					Promise.all(queue).then(function()  {
						if (rq.parentQ)
							cb( false, {body: htmlStr} );
						else
							rq.doOutput( htmlStr, cb );
					});
				}
			})(jsProg, queue);
		};
	}


	RenderQ.prototype.evalStr = function evalStr(str, htmlList)  {
		var  rq = this;
		return  (function(htmlList) {
			var  value = rq.srcData.value || {},
				 errCode = rq.srcData.errCode,
				 message = rq.srcData.message || '',
				 ph = rq.phrases,
				 ctx = {
				 	id: rq.cssID || '', pCssID: rq.pCssID,
				 	title: rq.getPageTitle(), description: rq.getPageDescription(),
				 	locID: mapLocaleToID(rq.getLocale()),
					caCode: rq.getSite().siteInfo.caCode , pageURI: rq.getPageURI()
				 },
				 bi = rq.srvObj,
				 _params = rq.compParams,
				 $ = jass,
				 outputStr;
			//console.log('value is\n' + JSON.stringify(value, null, 4));

			try  {
				var  res = eval(str);
				outputStr = res  ?  res.toString() : '';
			}
			catch (e)  {
				// TODO: do we have a better way to show error message?
				console.log( e );
				outputStr = '';
			}
			return  outputStr;
		})(htmlList);
	};

	RenderQ.prototype.getSite = function()  {
		return  this.parentQ  ?  this.parentQ.getSite() : this.webSite;
	};

	RenderQ.prototype.setSrcData = function(d)  {
		this.srcData = d;
	};

	RenderQ.prototype.getSrcData = function()  {
		return  this.srcData || {};
	};

	RenderQ.prototype.setCssID = function(id)  {
		this.cssID = id;
	};

	RenderQ.prototype.getCssID = function()  {
		return  this.cssID;
	};

	RenderQ.prototype.setResponseObj = function(res)  {
		this.resObj = res;
	}


	RenderQ.prototype.getResponseObj = function()  {
		return  this.parentQ  ?  this.parentQ.getResponseObj() : this.resObj;
	}

	/**
	* With pCssID, a 'shared' region could know which block invoked the region.
	*
	* @param pCssID
	*/
	RenderQ.prototype.setParentCssID = function(pCssID)  {
		this.pCssID = pCssID;
	};

	RenderQ.prototype.getLocale = function()  {
		return  this.parentQ  ?  this.parentQ.getLocale() : this.srvObj.locale;
	};

	RenderQ.prototype.asPage = function()  {
		//return  this.parentQ  ?  false : this.isPage;
		return  this.srvObj.postFix === 'html';
	};

	RenderQ.prototype.getPageTitle = function()  {
		return  this.parentQ  ?  this.parentQ.getPageTitle() : this.pageTitle;
	};

	RenderQ.prototype.setPageTitle = function(title)  {
		if (!this.parentQ)
			this.pageTitle = title;
	};

	RenderQ.prototype.getPageDescription = function()  {
		return  this.parentQ  ?  this.parentQ.getPageDescription() : this.descTx;
	};

	RenderQ.prototype.setPageDescription = function(descTx)  {
		if (!this.parentQ)
			this.descTx = descTx;
	};

	RenderQ.prototype.setClazName = function(cname)  {
		this.clazName = cname;
	};

	RenderQ.prototype.getClazName = function(toCSS)  {
		if (toCSS)
			return  this.clazName  ?  '.' + this.clazName.replace(/\\/gi, '') : '';

		return  this.clazName;
	};

	RenderQ.prototype.addCSS = function addCSS(css, clazName)  {
		if (this.parentQ)
			this.parentQ.addCSS( css, clazName || this.getClazName(true) );
		else  {
			var  cssPrefix = this.getCssID()  ?  ('#' + this.getCssID()) : (clazName || '');

			if (cssPrefix)
				cssPrefix += ' ';

			css = removeCssComments(css);
			var  rules = css.split('}'),
				 cssText = '';

			for (var i = 0; i< rules.length-1; i++)  {
				var  cssRule = rules[i].trim();
				if (cssRule.length > 0) {
					if (cssRule.charAt(0) === '@') {
						// don't prefix block id to key-frame
						cssText += cssRule;
					}
					else  {
						var  idx = cssRule.indexOf('{'),
							 selectors = cssRule.substring(0, idx).split(',');

						if (selectors.length === 1)
							cssText += cssPrefix + cssRule;
						else  {
							// deal with selectors grouping
							for (var j in selectors)  {
								if (j > 0)
										cssText += ', ';
								cssText += cssPrefix + selectors[j];
							}
							cssText += cssRule.substring(idx);
						}
					}
					cssText += '}\n';
				} 
				else
					cssText += '}\n';
			}

			this.cssStr = (this.cssStr || '') + cssText;
		}
	};

	RenderQ.prototype.addJS = function addJS(js)  {
		//console.log('add js: ' + js);
		if (this.parentQ)
			this.parentQ.addJS( js );
		else
			// it's important to concact js strings in this order. so sub-blocks will be evaluated first
			this.jsStr = this.jsStr  ?  (js + '\n' + this.jsStr) : js;
	};

	RenderQ.prototype.addInc = function addInc(inc)  {
		if (this.parentQ)
			this.parentQ.addInc( inc );
		else  {
			var  lines = inc.split('\n');
			for (var i in lines)  {
				var  line = lines[i].trim(),
					 c = line.charAt(0),
					 fileType = null;

				if (c === '#' || line.length === 0)
					continue;

				if (c === '/' && line.charAt(1) !== '/')  {
					// prepend website code to the include path
					var  caCode = this.webSite.siteInfo.caCode;

					line = '/' + caCode + '/cont' + line;
				}
				else  {
					// deal with include files from 3rd party or CDN
					var  idx = line.lastIndexOf(',');
					if (idx > 0)  {
						fileType = line.substring(idx+1) === 'text/css'  ?  'css' : 'js';
						line = line.substring(0, idx);
					}
				}

				if (!fileType)  {
					var llen = line.length;

					if (line.indexOf('.css', llen - 4) !== -1)
						fileType = 'css';
					else  if (line.indexOf('.js', llen - 3) !== -1)  {
						// exclude 'wFront.js' from the include. will force to /lib/client/wFront.js
						if (line.indexOf('wFront.js', llen - 9) === -1)
							fileType = 'js';
					}
				}

				if (fileType === 'css')
					this.incCSS.push( line );
				else  if (fileType === 'js')
					this.incJS.push( line );
			}
		}
	};

	RenderQ.prototype.getPageURI = function getPageURI()  {
		//return  this.srvObj.intPath;
		return  this.parentQ  ?  this.parentQ.getPageURI() : this.srvObj.intPath;
	};

	RenderQ.prototype.doOutput = function doOutput(outData, cb)  {
		var  header,
			 txEncode = this.srvObj.txEncode;

		switch (this.srvObj.postFix)  {
			case  'html':
			case  'hf':
				header = 'text/html; charset=';
				break;
			case  'js':
				header = 'application/javascript; charset=';
				break;
			case  'css':
				header = 'text/css; charset=';
				break;
			case  'wsj':
				header = 'application/json; charset=';
				break;
			case  'json':
				header = 'application/json; charset=';
				break;
			case  'txt':
				header = 'text/plain; charset=';
				break;
		}

		var  rtnObj = {
				headers: {
					'Content-Type': header + txEncode
				},
				body: outData
			 };
		//console.log('rtnObj:\n' + JSON.stringify(rtnObj, null, 4));
		
		if (cb)
			// ModUtil may call webSite.viewIt which in turns will call RenderQ.doOutput()
			// in that case, the next() function will not be available.
			cb( false, rtnObj );
	};

	RenderQ.prototype.errorHandling = function errorHandling(err)  {
		// TODO: we'll need something more user-friendly
		doOutput( err.message );
	};

	return  RenderQ;
})();

module.exports = RenderQ;


function  incCssFun()  {
	var  rq = this.rq,
		 html = this.html;

	if (!rq.parentQ)
		html.push({type: 'incCss'});
}


function  incJsFun()  {
	var  rq = this.rq,
		 html = this.html;

	if (!rq.parentQ)
		html.push({type: 'incJs'});
}


function  cssFun()  {
	var  rq = this.rq,
		 html = this.html;

	if (!rq.parentQ)
		html.push({type: 'css'});
}


function  jsFun()  {
	var  rq = this.rq,
		 html = this.html;

	if (!rq.parentQ)
		html.push({type: 'js'});
}


/**
 * Possible invocation:
 * block(uri), block(uri, option), block(uri, param), block(id, uri)
 * block(id, uri, param), block(id, uri, option), block(uri, param, option)
 */
function  blockFun(id, srvURI, params, option)  {
	switch (arguments.length)  {
		case 1:
			srvURI = id;
			id = null;
			break;

		case 2:
			if (typeof srvURI !== 'string')  {
				params = srvURI;
				srvURI = id;
				id = null;

				if (params.hasOwnProperty('params') || params.hasOwnProperty('id') || params.hasOwnProperty('knownAs')) {
					option = params;
					params = option.params;
				}
			}
			break;

		case 3:
			 if (typeof srvURI !== 'string')  {
			 	option = params;
				params = srvURI;
				srvURI = id;
				id = null;
			}
			else  {
				if (params.hasOwnProperty('params') || params.hasOwnProperty('id') || params.hasOwnProperty('knownAs')) {
					option = params;
					params = option.params;
				}
			}
			break;
	}

	var  rq = this.rq,
		 dynaNode = rq.dynaNode,
		 webSite = rq.getSite(),
		 subRQ = new RenderQ( webSite, null, rq );

	srvURI = srvURI || '';
	option = option || {};
	id = id || option.knownAs;

	if (id)
		subRQ.setCssID( id );
	subRQ.setSrcData( rq.getSrcData() );

	if (srvURI === '')  {
		// this is the main block
		var  opURI = rq.getPageURI(),
			 vPath = path.join( dynaNode.rootPath, 'blocks/views' + opURI);

		subRQ.dynaNode = dynaNode;
		subRQ.srvObj = rq.srvObj;
		this.html.push( new Promise(function(resolve, reject) {
			new WebView( {rootPath: dynaNode.rootPath, path:vPath, opPath:opURI}, subRQ ).compose( function(isStream, result)  {
				resolve( result.body );
			} );
		}));
	}
	else  {
		// included block
		srvURI += option.hasOwnProperty('id')  ?  ('/' + option.id + '.hf') : '.hf';

		var  cmReq = {
				uri: srvURI,
				inData: params || {},
				cookies: rq.srvObj.cookies,
				//headers: subRQ.srvObj['http-headers'], 
				headers: rq.srvObj['http-headers'],
				client: rq.srvObj.client,
				locale: rq.srvObj.locale
			 },
			 resObj = rq.getResponseObj();

		cmReq.inData._loc = cmReq.inData._loc || rq.getLocale();
		//console.log('block parameters: \n%s', JSON.stringify(cmReq.inData, null, 4));

		// TODO: what if pathname is not valid? need to implement error handling
		this.html.push( new Promise(function(resolve, reject) {
			webSite.runBlock(resObj, cmReq, subRQ, function(isStream, result) {
				resolve( result.body );
			});
		}));
	}
}


function  wcompFun(id, srvURI, params, options)  {
	var  argCount = arguments.length;
	switch (argCount)  {
		case 1:
			srvURI = id;
			id = null;
			break;

		case 2:
			if (typeof srvURI !== 'string')  {
				params = srvURI;
				srvURI = id;
				id = null;
			}
			break;

		case 3:
			if (typeof srvURI !== 'string')  {
				options = params;
				params = srvURI;
				srvURI = id;
				id = null;
			}
			break;
	}
	options = options || {};

	if (!srvURI)
		return;

	var  rq = this.rq,
		 dynaNode = rq.dynaNode,
		 webSite = rq.getSite(),
		 subRQ = new RenderQ( webSite, null, rq );
	subRQ.srvObj = rq.srvObj;

	if (srvURI.charAt(0) === '/')
		srvURI = srvURI.substring(1);

	if (id)
		subRQ.setCssID( id );
	subRQ.setSrcData( rq.getSrcData() );

	var  opURI = srvURI,
		 wcompPath = webSite.standAlone  ?  '../../wcomp/' : '../shared/views/',
		 vPath = path.join( dynaNode.rootPath, wcompPath + srvURI);

	subRQ.dynaNode = dynaNode;
	subRQ.compParams = params || {};

	var  pathObj = {
		rootPath: dynaNode.rootPath,
		path: vPath,
		opPath: opURI,
		noWrap: options.noWrapper
	};

	this.html.push( new Promise(function(resolve, reject) {
		new WebView( pathObj, subRQ )
			.compose( function(isStream, result)  {
				resolve( result.body );
			} );
	}));
}


function  removeCssComments(css)  {
	var  result,
		idx = css.indexOf('/*');

	if (idx >= 0)  {
		var  idx2 = css.indexOf('*/', idx+2);
		if (idx2 >= 0)
			result = css.substring(0, idx) + removeCssComments( css.substring(idx2+2) );
		else
			result = css.substring(0, idx);
	}
	else
		result = css;

	return  result;
};

function  mapLocaleToID(loc)  {
	var  locID = 2;
	switch (loc)  {
	case 'en':
		locID = 1;
		break;
	}

	return  locID;
};
