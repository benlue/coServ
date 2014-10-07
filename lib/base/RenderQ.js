/*!
* coServ
* authors: Ben Lue
* license: MIT
* Copyright(c) 2014 Gocharm Inc.
*/
var  path = require('path'),
	 jass = require('../css/jass'),
	 WebView = require('./WebView');

var  RenderItem = (function()  {
	var  RenderItem = function RenderItem(renderQ, pending)  {
		this.renderQ = renderQ;
		this.isPending = pending === undefined  ?  false : pending;
	};

	RenderItem.prototype.setIndex = function  setIndex(i)  {
		this.idx = i;
	};

	RenderItem.prototype.receiver = function(err, html, varName)  {
		// TODO: how to deal with error?
		if (varName)
			this.renderQ.setDone(this, {value: html, varName: varName});
		else
			this.renderQ.setDone(this, html);
	};

	return  RenderItem;
})();


var  RenderQ = (function()  {

	var  RenderQ = function RenderQ(webSite, res, srvObj)  {
		this.webSite = webSite;

		if (srvObj)  {
			this.res = res;
			this.srvObj = srvObj;
			this.isPage = srvObj.isPage;
		}
		else  {
			q = res;
			this.isPending = true;
			this.idx = q.add( this );
			this.parentQ = q;
			this.srvObj = q.srvObj;
		}

		var  queue = [],
			pendingCount = 0;

		this.add = function(item)  {
			if (item.isPending)
				pendingCount++;

			return  queue.push(item) - 1;
		};

		this.setDone = function(item, result)  {
			queue[item.idx] = result;

			if (item.isPending)  {
				--pendingCount;
				this.seal();
			}
		};

		this.seal = function()  {
			//console.log('sealing... pending count: %d, total items: %d', pendingCount, queue.length);
			if (pendingCount === 0)  {
				if (this.incCssItem)  {
					var  lines = '';
					if (this.incCSS)
						for (var i in this.incCSS)
							lines += '<link rel="stylesheet" type="text/css" href="' + this.incCSS[i] + '">\n';
					this.incCssItem.receiver( null, lines );
				}
				if (this.incJsItem)  {
					var  lines = '';
					if (this.incJS)
						for (var i in this.incJS)
							lines += '<script type="text/javascript" src="' + this.incJS[i] + '"></script>\n';
					this.incJsItem.receiver( null, lines );
				}
				if (this.cssItem)
					this.cssItem.receiver( null, this.css  ?  this.css : '');
				if (this.jsItem)
					this.jsItem.receiver( null, this.js  ?  this.js : '' );

				//var  jsStr = queue.join('');
				var  jsStr = 'html=\'\';';
				for (var i in queue)  {
					if (typeof queue[i] === 'string')
						jsStr += '\nhtml += hline[' + i + '];';
					else  {
						var  item = queue[i];
						if (item.hasOwnProperty('code'))
							jsStr += item.code;
						else  {
							try  {
								jsStr += '\nhtml += ' + item.value + ';';
							}
							catch (e)  {
								// simply ignore undefined variable
							}
						}
					}
				}
				//console.log( jsStr );

				var  rq = this;
				(function(hline) {
					var  value = rq.srcData.value,
						 errCode = rq.srcData.errCode,
						 message = rq.srcData.message,
						 ph = rq.phrases,
						 ctx = {locID: mapLocaleToID(rq.getLocale()), pCssID: rq.pCssID,
								title: rq.getPageTitle(), description: rq.getPageDescription(),
								caCode: rq.getSite().siteName},
						 bi = rq.srvObj,
						 block = blockFun.bind(rq),
						 region = regionFun.bind(rq),
						 $ = jass,
						 outputStr;
					//console.log('RenderQ otions: %s', JSON.stringify(options));
					try  {
						outputStr = eval( jsStr ).toString();
					}
					catch (e)  {
						// TODO: do we have a better way to show error message?
						console.log( e );
						outputStr = e.message;
					}

					// each block/region will resolve itself before merging into its parent region
					if (rq.parentQ)
						rq.parentQ.setDone(rq, outputStr);
					else
						rq.doOutput( outputStr );
				})(queue);
			};
		};
	};

	RenderQ.prototype.evalStr = function evalStr(str, htmlList)  {
		var  rq = this;
		return  (function(htmlList) {
				var  value = rq.srcData.value,
					errCode = rq.srcData.errCode,
								message = rq.srcData.message,
					ph = rq.phrases,
					//ctx = {locID: mapLocaleToID(rq.getSite().locale), pCssID: rq.pCssID, caCode: rq.getSite().siteName},
					ctx = {locID: mapLocaleToID(rq.getLocale()), pCssID: rq.pCssID, caCode: rq.getSite().siteName},
					bi = rq.srvObj,
					block = blockFun.bind(rq),
					region = regionFun.bind(rq),
					$ = jass,
					outputStr;

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
		return  this.srcData;
	};

	RenderQ.prototype.setCssID = function(id)  {
		this.cssID = id;
	};

	RenderQ.prototype.getCssID = function()  {
		return  this.cssID;
	};

	/**
	* With pCssID, a 'shared' region could know which block invoked the region.
	*
	* @param pCssID
	*/
	RenderQ.prototype.setParentCssID = function(pCssID)  {
		this.pCssID = pCssID;
	};

	RenderQ.prototype.getLocale = function getLocale()  {
		return  this.srvObj.locale || (this.parentQ  ?  this.parentQ.getLocale() : this.getSite().locale);
	};

	RenderQ.prototype.asPage = function asPage()  {
		return  this.parentQ  ?  this.parentQ.asPage() : this.isPage;
	};

	RenderQ.prototype.getPageTitle = function getPageTitle()  {
		return  this.parentQ  ?  this.parentQ.getPageTitle() : this.pageTitle;
	};

	RenderQ.prototype.setPageTitle = function setPageTitle(title)  {
		if (!this.parentQ)
			this.pageTitle = title;
	};

	RenderQ.prototype.getPageDescription = function getPageDescription()  {
		return  this.parentQ  ?  this.parentQ.getPageDescription() : this.descTx;
	};

	RenderQ.prototype.setPageDescription = function setPageDescription(descTx)  {
		if (!this.parentQ)
			this.descTx = descTx;
	};

	RenderQ.prototype.setClazName = function setClazName(cname)  {
		this.clazName = cname  ?  '.' + cname : '';
	};

	RenderQ.prototype.getClazName = function getClazName()  {
		this.clazName = this.clazName.replace(/\\/gi, '');
		return  this.clazName;
	};

	// create and return a render item.
	RenderQ.prototype.getItem = function getItem(noPending)  {
		var  item = new RenderItem( this, !noPending ),
			idx = this.add( item );
		item.setIndex( idx );

		return  item;
	};

	RenderQ.prototype.getJsItem = function getJsItem()  {
		return  this.jsItem = this.getItem(true);
	};

	RenderQ.prototype.getCssItem = function getCssItem()  {
		return  this.cssItem = this.getItem(true);
	};

	RenderQ.prototype.getIncJsItem = function getIncJsItem()  {
		return  this.incJsItem = this.getItem(true);
	};

	RenderQ.prototype.getIncCssItem = function getIncCssItem()  {
		return  this.incCssItem = this.getItem(true);
	};

	RenderQ.prototype.addCSS = function addCSS(css, clazName)  {
		if (this.parentQ)
			this.parentQ.addCSS( css, clazName || this.getClazName() );
		else  {
			if (clazName)
					clazName += ' ';
			else
					clazName = '';

			css = removeCssComments(css);
			var  rules = css.split('}'),
				cssText = '';

			for (var i = 0; i< rules.length-1; i++)  {
					var  cssRule = rules[i].trim();
					if (cssRule.length > 0) {
							if (cssRule.charAt(0) === '@') {
									// don't prefix block id to key-frame
									cssText += cssRule;
							} else  {
									var  idx = cssRule.indexOf('{'),
											selectors = cssRule.substring(0, idx).split(',');

									if (selectors.length === 1)
											cssText += clazName + cssRule;
									else  {
											// deal with selectors grouping
											for (var j in selectors)  {
													if (j > 0)
															cssText += ', ';
													cssText += clazName + selectors[j];
											}
											cssText += cssRule.substring(idx);
									}
							}
							cssText += '}\n';
					} else {
							cssText += '}\n';
					}
			}

			this.css = this.css  ?  this.css + cssText : cssText;
		}
	};

	RenderQ.prototype.addJS = function addJS(js)  {
		if (this.parentQ)
			this.parentQ.addJS( js );
		else
						this.js = this.js  ?  this.js + js : js;
	};

	RenderQ.prototype.addInc = function addInc(inc)  {
		if (this.parentQ)
			this.parentQ.addInc( inc );
		else  {
			var  lines = inc.split('\n');
						for (var i in lines)  {
				var  line = lines[i];
				if (line.indexOf('.css', line.length - 4) !== -1)  {
					if (!this.incCSS)
						this.incCSS = [];
					this.incCSS.push( line );
				}
				else  if (line.indexOf('.js', line.length - 3) !== -1)  {
					if (!this.incJS)
						this.incJS = [];
					this.incJS.push( line );
				}
			}
		}
	};

	RenderQ.prototype.getPageURI = function getPageURI()  {
		return  this.srvObj.intPath;
	};

	RenderQ.prototype.doOutput = function doOutput(outData)  {
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

		if (this.mod && this.mod.removeAllListeners)
			this.mod.removeAllListeners();

		this.res.setHeader( 'Content-Type', header + txEncode);
		this.res.end( outData );
	};

	RenderQ.prototype.errorHandling = function errorHandling(err)  {
		// TODO: we'll need something more user-friendly
		doOutput( err.message );
	};

	return  RenderQ;
})();

module.exports = RenderQ;

function  blockFun(srvURI, option)  {
	var  dynaNode = this.dynaNode,
		 subRQ = new RenderQ( this.getSite(), this );
	subRQ.setSrcData( this.getSrcData() );

	if (!srvURI)
		srvURI = '';

	if (option && option.knownAs)
		subRQ.setCssID( option.knownAs );

	if (srvURI === '')  {
		// this is the main block
		var  opURI = this.getPageURI(),
			 vPath = path.join( dynaNode.rootPath, 'blocks/views' + opURI);

		subRQ.dynaNode = dynaNode;
		new WebView( {rootPath: dynaNode.rootPath, path:vPath, opPath:opURI}, subRQ ).compose( true );
	}
	else  {
		// included block
		if (option)
			srvURI += option.hasOwnProperty('id')  ?  ('.hf/' + option.id) : '.hf';
		else
			srvURI += '.hf';
		var  cmReq = {pathname: srvURI, cookies: this.srvObj.cookies};

		if (option && option.hasOwnProperty('params'))
			cmReq.inData = option.params;
		else
			cmReq.inData = {};

		cmReq.inData._loc = cmReq.inData._loc || this.getLocale();

		// TODO: what if pathname is not valid? need to implement error handling
		this.getSite().runBlock(subRQ, cmReq);
	}
};


function  regionFun(rgn, options)  {
	var  dynaNode = this.dynaNode,
		 opPath;		// opPath is used to generate block css class name, not a real path

	if (rgn[0] === '.')  {
		vpath = path.join(dynaNode.viewPath, rgn);
		var  theme = this.getSite().siteInfo.theme || this.getSite().siteName,
			 anchor = theme + path.sep + 'layout' + path.sep,
			 idx = vpath.lastIndexOf( anchor ) + anchor.length;
		opPath = 'rgn' + vpath.substring(idx, idx+1).toUpperCase() + vpath.substring(idx+1);
	}
	else  {
		// similar to 'require', local path should start with './'.
		// otherwise the default path (share) will be used.
		vpath = path.join(dynaNode.rootPath, '../shared/views/' + rgn);
		opPath = 'rgn/' + rgn;
	}

	// srcData is the execution result
	var  srcData = this.getSrcData();
	if (options && options.hasOwnProperty('params'))  {
		// we'll add 'params' to the srcData
		var  mySrcData = options.params;
		for (var k in srcData)
				mySrcData[k] = srcData[k];
		srcData = mySrcData;
	}

	var	 subRQ = new RenderQ( this.getSite(), this );
	subRQ.setParentCssID( dynaNode.cssID );
	subRQ.setSrcData( this.getSrcData() );
	// TODO: need to do error-handling when the viewpath does not exist

	var  pathObj = {rootPath: dynaNode.rootPath, path:vpath, opPath:opPath};
	pathObj.noCssWrap = options && options.noCssWrap;
	new WebView( pathObj, subRQ ).compose();
};


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
