/*!
* coServ
* authors: Ben Lue
* license: MIT
* Copyright(c) 2014 Gocharm Inc.
*/
var  path = require('path'),
	 jass = require('../css/jass'),
	 WebView = require('./WebView'),
	 Promise = require('bluebird');

var  RenderItem = (function()  {
	var  RenderItem = function RenderItem(renderQ)  {
		this.renderQ = renderQ;
		//this.isPending = pending === undefined  ?  false : pending;
	};

	RenderItem.prototype.setIndex = function  setIndex(i)  {
		this.idx = i;
	};

	return  RenderItem;
})();


var  RenderQ = (function()  {

	var  RenderQ = function RenderQ(webSite, srvObj, parentQ)  {
		this.webSite = webSite;

		if (parentQ)  {
			this.parentQ = parentQ;
			// if we don't do the assignment here, we could be caught up in situations where
			// srvObj is needed but not yet set up.
			// also, it's harmless to do this assignment
			this.srvObj = parentQ.srvObj;
		}
		else  {
			this.srvObj = srvObj;
			this.isPage = srvObj.isPage;

			// initialize include lists
			this.incCSS = [];
			this.incJS = [];
		}

		var  queue = [];
			//pendingCount = 0;

		this.add = function(item)  {
			return  queue.push(item) - 1;
		};

		this.getQueue = function()  {
			return  queue;
		};

		this.seal = function(cb)  {
			//console.log('sealing...[%s]', this.srvObj.intPath);
			var  jsProg = '';
			for (var i in queue)  {
				var  item = queue[i];

				if (item.hasOwnProperty('code'))  {
					var  prog = item.code,
						 idx2 = prog.lastIndexOf(')');

					if (idx2 > 0)  {
						if (prog.indexOf('block(') === 0 || prog.indexOf('region(') === 0)
							jsProg += "\nsetIdx(" + i + ");";
					}

					jsProg += '\n' + prog;
				}
			}
			//console.log( "jsProg:\n%s\n-------------", jsProg );

			if (jsProg)  {
				(function(rq, jsStr) {
					var  srcData = rq.getSrcData(),
						 value = srcData.value || {},
						 errCode = srcData.errCode,
						 message = srcData.message || '',
						 ph = rq.phrases,
						 ctx = {locID: mapLocaleToID(rq.getLocale()), pCssID: rq.pCssID,
								title: rq.getPageTitle(), description: rq.getPageDescription(),
								caCode: rq.getSite().siteInfo.caCode , pageURI: rq.getPageURI()},
						 bi = rq.srvObj,
						 _params = rq.compParams,
						 setIdx = setIdxFun.bind(rq),
						 block = blockFun.bind(rq),
						 region = regionFun.bind(rq),
						 $ = jass,
						 outputStr;
					//console.log('RenderQ otions: %s', JSON.stringify(options));
					try  {
						eval( jsStr );
					}
					catch (e)  {
						// TODO: do we have a better way to show error message?
						console.log( e.stack );
						//outputStr = e.message;
					}
				})(this, jsProg);
			}

			var  rq = this;
			Promise.all(queue).then(function()  {
				if (!rq.parentQ)  {
					if (rq.incCssItem)  {
						var  lines = '';
						if (rq.incCSS)
							for (var i in rq.incCSS)
								lines += '<link rel="stylesheet" type="text/css" href="' + rq.incCSS[i] + '">\n';
						queue[rq.incCssItem.idx] = lines;
					}
					if (rq.incJsItem)  {
						var  lines = '';
						if (rq.incJS)
							for (var i in rq.incJS)
								lines += '<script type="text/javascript" src="' + rq.incJS[i] + '"></script>\n';
						queue[rq.incJsItem.idx] = lines;
					}
					if (rq.cssItem)
						queue[rq.cssItem.idx] = rq.css || '';
					if (rq.jsItem)
						queue[rq.jsItem.idx] = rq.js || '';
				}

				var  jsProg = 'var  html=\'\';';
				for (var i in queue)  {
					var  item = queue[i];

					if (item.then)  {
						queue[i] = item.value();
						jsProg += '\nhtml+=hline[' + i + '];';
					}
					else  if (typeof item === 'string')
						jsProg += '\nhtml+=hline[' + i + '];';
					else  if (item.hasOwnProperty('code'))
						jsProg += item.code;
					else  if (item.value)
						jsProg += '\nhtml+=' + item.value + ';';
				}

				(function(jsStr, hline) {
					//console.log( jsStr );
					//console.log('hline:\n%s', JSON.stringify(hline, null, 4));
					
					var  srcData = rq.getSrcData(),
						 value = srcData.value || {},
						 errCode = srcData.errCode,
						 message = srcData.message || '',
						 ph = rq.phrases,
						 ctx = {locID: mapLocaleToID(rq.getLocale()), pCssID: rq.pCssID,
								title: rq.getPageTitle(),
								description: rq.getPageDescription(),
								caCode: rq.getSite().siteInfo.caCode , pageURI: rq.getPageURI()},
						 bi = rq.srvObj,
						 _params = rq.compParams,
						 $ = jass,
						 htmlStr;
					//console.log('RenderQ otions: %s', JSON.stringify(options));
					try  {
						//outputStr = eval( jsStr ).toString();
						htmlStr = eval( jsStr );
					}
					catch (e)  {
						// TODO: do we have a better way to show error message?
						console.log( e.stack );
						htmlStr = e.message;
					}

					// each block/region will resolve itself before merging into its parent region
					//console.log('block result:\n' + htmlStr);
					if (rq.parentQ)
						cb( false, {body: htmlStr} );
					else
						rq.doOutput( htmlStr, cb );
				})(jsProg, queue);
			});
		};
	};

	RenderQ.prototype.evalStr = function evalStr(str, htmlList)  {
		var  rq = this;
		return  (function(htmlList) {
				var  value = rq.srcData.value || {},
					 errCode = rq.srcData.errCode,
					 message = rq.srcData.message || '',
					 ph = rq.phrases,
					 ctx = {locID: mapLocaleToID(rq.getLocale()), pCssID: rq.pCssID,
						   caCode: rq.getSite().siteInfo.caCode , pageURI: rq.getPageURI()},
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

	RenderQ.prototype.getLocale = function getLocale()  {
		return  this.srvObj.locale || (this.parentQ  ?  this.parentQ.getLocale() : this.getSite().locale);
	};

	RenderQ.prototype.asPage = function asPage()  {
		//return  this.parentQ  ?  this.parentQ.asPage() : this.isPage;
		return  this.parentQ  ?  false : this.isPage;
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
	RenderQ.prototype.getItem = function getItem()  {
		var  item = new RenderItem( this ),
			 idx = this.add( item );
		item.setIndex( idx );

		return  item;
	};

	RenderQ.prototype.getJsItem = function getJsItem()  {
		return  this.jsItem = this.getItem();
	};

	RenderQ.prototype.getCssItem = function getCssItem()  {
		return  this.cssItem = this.getItem();
	};

	RenderQ.prototype.getIncJsItem = function getIncJsItem()  {
		return  this.incJsItem = this.getItem();
	};

	RenderQ.prototype.getIncCssItem = function getIncCssItem()  {
		return  this.incCssItem = this.getItem();
	};

	RenderQ.prototype.addCSS = function addCSS(css, clazName)  {
		if (this.parentQ)
			this.parentQ.addCSS( css, clazName || this.getClazName() );
		else  {
			var  cssPrefix;
			if (this.getCssID())
				cssPrefix = '#' + this.getCssID();
			else
				cssPrefix = clazName || '';

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

			this.css = this.css  ?  this.css + cssText : cssText;
		}
	};

	RenderQ.prototype.addJS = function addJS(js)  {
		//console.log('add js: ' + js);
		if (this.parentQ)
			this.parentQ.addJS( js );
		else
			this.js = this.js  ?  (this.js + '\n' + js) : js;
	};

	RenderQ.prototype.addInc = function addInc(inc)  {
		if (this.parentQ)
			this.parentQ.addInc( inc );
		else  {
			var  lines = inc.split('\n');
			for (var i in lines)  {
				var  line = lines[i].trim();
				if (line.indexOf('.css', line.length - 4) !== -1)  {
					this.incCSS.push( line );
				}
				else  if (line.indexOf('.js', line.length - 3) !== -1)  {
					this.incJS.push( line );
				}
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

function  setIdxFun(qIdx)  {
	this.qIdx = qIdx;
};


function  blockFun(id, srvURI, option)  {
	if (arguments.length === 1)  {
		srvURI = id;
		id = option = null;
	}
	else  if (arguments.length === 2)  {
		if (typeof srvURI !== 'string')  {
			option = srvURI;
			srvURI = id;
			id = null;
		}
	}

	var  dynaNode = this.dynaNode,
		 webSite = this.getSite(),
		 subRQ = new RenderQ( webSite, null, this ),
		 qIdx = this.qIdx;

	srvURI = srvURI || '';
	option = option || {};
	id = id || option.knownAs;

	if (id)
		subRQ.setCssID( id );
	subRQ.setSrcData( this.getSrcData() );

	if (srvURI === '')  {
		// this is the main block
		var  opURI = this.getPageURI(),
			 vPath = path.join( dynaNode.rootPath, 'blocks/views' + opURI);

		subRQ.dynaNode = dynaNode;
		this.getQueue()[qIdx] = new Promise(function(resolve, reject) {
			new WebView( {rootPath: dynaNode.rootPath, path:vPath, opPath:opURI}, subRQ ).compose( true, function(isStream, result)  {
				resolve( result.body );
			} );
		});
	}
	else  if (isWebComp(srvURI))  {
		// this is component view
		var  opURI = srvURI,
			 vPath = path.join( dynaNode.rootPath, '../shared/views/' + srvURI);

		subRQ.dynaNode = dynaNode;
		subRQ.compParams = option.params;

		this.getQueue()[qIdx] = new Promise(function(resolve, reject) {
			new WebView( {rootPath: dynaNode.rootPath, path:vPath, opPath:opURI}, subRQ ).compose( false, function(isStream, result)  {
				resolve( result.body );
			} );
		});
	}
	else  {
		// included block
		srvURI += option.hasOwnProperty('id')  ?  ('.hf/' + option.id) : '.hf';

		var  cmReq = {
				pathname: srvURI,
				inData: option.params || {},
				cookies: this.srvObj.cookies,
				//headers: subRQ.srvObj['http-headers'], 
				headers: this.srvObj['http-headers'],
				client: this.srvObj.client
			 },
			 resObj = this.getResponseObj();

		cmReq.inData._loc = cmReq.inData._loc || this.getLocale();
		//console.log('block parameters: \n%s', JSON.stringify(cmReq.inData, null, 4));

		// TODO: what if pathname is not valid? need to implement error handling
		this.getQueue()[qIdx] = new Promise(function(resolve, reject) {
			webSite.runBlock(resObj, cmReq, subRQ, function(isStream, result) {
				resolve( result.body );
			});
		});
	}
}


function  isWebComp(compPath)  {
	var  c = compPath[0];
	return  c != '/' && c != '.';
}


function  regionFun(rgn, options)  {
	var  dynaNode = this.dynaNode,
		 opPath,		// opPath is used to generate block css class name, not a real path
		 qIdx = this.qIdx;

	if (rgn[0] === '.')  {
		vpath = path.join(dynaNode.viewPath, rgn);
		var  theme = this.getSite().siteInfo.theme || this.getSite().siteInfo.caCode ,
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
	if (options && options.hasOwnProperty('values'))  {
		// we'll add 'values' to the original return value
		var  values = {},
			 myValue = options.values;
		if (srcData.value)  {
			var  origValues = srcData.value;
			for (var k in origValues)
				values[k] = origValues[k];
		}

		for (var k in myValue)
			values[k] = myValue[k];

		srcData.value = values;
	}

	var	 subRQ = new RenderQ( this.getSite(), null, this );
	subRQ.setParentCssID( dynaNode.cssID );
	subRQ.setSrcData( this.getSrcData() );
	// TODO: need to do error-handling when the viewpath does not exist

	var  pathObj = {rootPath: dynaNode.rootPath, path:vpath, opPath:opPath};
	pathObj.noCssWrap = options && options.noCssWrap;

	this.getQueue()[qIdx] = new Promise(function(resolve, reject) {
		new WebView(  pathObj, subRQ  ).compose( false, function(isStream, result)  {
			resolve( result.body );
		} );
	});
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
