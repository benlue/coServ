/*!
 * coServ front-end controller
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2016 Gocharm Inc.
 */
var  _wf = (function (_wf) {

	_wf.ctrlMap = {};

	_wf.addCtrl = function addCtrl(id, ctrl)  {
		_wf.ctrlMap[id] = ctrl;
	};

	_wf.getCtrl = function getCtrl(id)  {
		return  _wf.ctrlMap[id];
	};

	_wf.removeCtrl = function removeCtrl(id)  {
		delete _wf.ctrlMap[id];
	};

	_wf.addPageCtrl = function(c)  {
        var  bkID = c.dspTarget.substring(1);
        _wf.ctrlMap[bkID] = c;
	};

	_wf.setCSS = function(cssText)  {
		if (cssText)  {
			var css = document.createElement('style');
			css.type = 'text/css';
			css.innerHTML = cssText;
			document.head.appendChild(css);
		}
	}

	_wf.initPage = function()  {
        for (var k in _wf.ctrlMap)  {
        	var  c = _wf.ctrlMap[k];
        	if (!c._init)  {
				c._init = true;
				/*
				if (c._xsbk.init)  {
					c._xsbk.init.bind( c._xsbk );
					c._xsbk.init();
				}
				*/
        		c.startup();
        	}
		}
		
		if (_mainBlk.init)  {
			//_mainBlk.evtMap = {};
			_mainBlk.init();
		}
	};

	_wf.api = function(req, callback)  {
		$.post('/_api/post', req, function(data) {
			callback(data);
		});
	};

	_wf.postHTML = function(url, pdata, headers, cb)  {
		let  option = {
				url: url,
				contentType: 'application/json',
				data: JSON.stringify(pdata || {}),
				processData: false,
				dataType: 'html',
				type: 'POST'
			 };

		if (headers)
			 option.headers = headers;
			 
		$.ajax(option).done( cb );
	}

	_wf.dummy = function()  {
		// this is a dummy
	}

	_wf._uic = (function() {
		var  _xsbk = function(id, url)  {
			this._id = id;
			this._url = url;
			this._c = {};
			this._ctx = {};
			this.evtMap = {};

			this._ctrl = new __._ctrl('#' + id, url);
			this._ctrl._xsbk = this;
		};

		_xsbk.prototype._init = function()  {
			this.evtMap = {};

			for (var name in this._c)  {
				let  child = this._c[name];
				if (child.init)
					child.init();
			}
		}

		_xsbk.prototype.setContext = function(ctx)  {
			this._ctx = ctx;
		}

		_xsbk.prototype.pack = function(dummy)  {
			let  uic = this;
			Object.getOwnPropertyNames(dummy).forEach( function(key) {
				uic[key] = dummy[key].bind(uic);
				/*
				//uic._ctrl[key] = dummy[key].bind(uic);

				uic[key] = (function(funName) {
					return  function() {
						//return  uic._ctrl[funName].apply(uic, arguments);
						return  dummy[funName].apply(uic, arguments);
					};
				})(key);
				*/
			});
		}

		_xsbk.prototype.setParentID = function(pid)  {
			this._parentID = pid;
		}

		_xsbk.prototype.addChild = function(name, child)  {
			this._c[name] = child;
		}

		_xsbk.prototype.find = function(s)  {
			return  s  ?  this._ctrl.sel(s) : this._ctrl.getJqTarget();
		}

		_xsbk.prototype.reload = function(url, params, cb)  {
			if (!this._url)
				throw "This is not a block. It can't be reloaded.";

			let  argCount = arguments.length;
			if (argCount === 0)
				url = this._url;
			else  if (argCount == 2)  {
				if (typeof params === 'function')  {
					cb = params;
					params = null;
				}
			}

			let  isSameBlk = false;
			if (this._ctx.endpID)
				isSameBlk = url.split('/').slice(0, -1).join('/') == this._url.split('/').slice(0, -1).join('/');
			else
				isSameBlk = url.split('/').join('/') == this._url.split('/').join('/');

			//console.log('this.url: ' + this._url);
			//console.log('url: ' + url);
			//console.log('endpID: %s, isSameBlock: %s', this._ctx.endpID, isSameBlk);

			let  blk = this,
				 bkCtrl = this._ctrl,
				 headers = {},
				 containerTag = bkCtrl.getJqTarget().parent().empty();
			url += '.hf';

			if (isSameBlk)  {
				headers['x-xs-reload'] = true;
				headers['x-xs-blockid'] = this._id;
			}

			__.postHTML(url, params, headers, function(html)  {
				if (isSameBlk)  {
					let  dom = $(html);
					//bkCtrl.jqDspTarget = null;		// clean up cached tag
					containerTag.append( dom.filter('div')[0] );

					let  scriptText = dom.filter('script')[0].text;
					if (scriptText)
						try {
							eval( scriptText );
						}
						catch (e)  {
							console.log(e.stack);
						}

					blk.init();

					if (cb)
						cb( bkCtrl );
				}
				else
					displayReload(bkCtrl, false, html, function(nctrl) {
						if (nctrl)  {
							nctrl.opURI = url;

							blk._ctrl._xsbk = null;
							blk._ctrl = nctrl;
							nctrl._xsbk = blk;
						}
						if (cb)
							cb(nctrl);
					});
			});
		}


		_xsbk.prototype.embed = function(target, url, params, cb)  {
			this._ctrl.embed( target, url, params, cb);
		}

		_xsbk.prototype.on = function(evtSource, handler)  {
			let  elist = this.evtMap[evtSource];
			if (!elist)  {
				elist = [];
				this.evtMap[evtSource] = elist;
			}

			if (elist.indexOf(handler) < 0)
				elist.push( handler );
		}
	
		_xsbk.prototype.notify = function(evtSource, args)  {
			let  elist = this.evtMap[evtSource];
			if (elist)  {
				elist.forEach( function(handler) {
					handler( args );
				});
			}
		}

		return  _xsbk;
	})();

	_wf._ctrl = (function()  {
		var  _ctrl = function _ctrl(target, opURI)  {
			this.evtMap = {};
			this.opURI = opURI;
			this.dspTarget = target;
			this._init = false;
	
			_wf.addPageCtrl( this );
	
			this.getTarget = function()  {
				return  this.dspTarget;
			};
	
			this.getJqTarget = function()  {
				return  $(this.dspTarget);
				//this.jqDspTarget = this.jqDspTarget  || $(this.dspTarget);
				//return  this.jqDspTarget;
			};
	
			this.getBlockID = function()  {
				return  this.getJqTarget().attr('id');
			};
		};
	
		_ctrl.prototype.setID = function(id)  {
			var  oldID = this.getBlockID();
			_wf.removeCtrl( oldID );
			_wf.addCtrl( id, this );
	
			this.getJqTarget().attr('id', id);
		};
	
		_ctrl.prototype.startup = function startup()  { /* empty */ };
	
		_ctrl.prototype.sel = function sel(s)  {
			return  this.getJqTarget().find(s);
		};
	
		_ctrl.prototype.find = _ctrl.prototype.sel;
	
		_ctrl.prototype.embed = function embed(div, srvURI, args, callback)  {
			if (arguments.length === 3)  {
				if (typeof args === 'function')  {
					callback = args;
					args = null;
				}
			}
			
			var  target = this.getJqTarget().find(div),
				 url = srvURI + '.hf',
				 pdata = {};
	
			if (args)  {
				if (args.id || args.params || args.knownAs)  {
					if (args.hasOwnProperty('id'))
						url += '/' + args.id;
					if (args.params)
						pdata = args.params;
					if (args.knownAs)
						pdata._cs_knownAs = args.knownAs;
				}
				else
					pdata = args;
			}
	
			var  paCtrl = this;
			_wf.postHTML(url, pdata, null, function(html)  {
				displayEmbed(paCtrl, target, html, callback);
			});
		}
	
	
		function  displayEmbed(paCtrl, target, html, callback)  {
			var  dom = $(html);
			var  cssTag = dom.filter('style')[0];
	
			if (cssTag)  {
				var  cssText = cssTag.text || cssTag.textContent || cssTag.innerHTML;
				__.setCSS( cssText );
			}
	
			target.empty().append( dom.filter('div')[0] );
			//target.replaceWith( dom.filter('div')[0] );
	
			var  scriptTag = dom.filter('script')[0],
				 scriptText = scriptTag  ?  scriptTag.text : null;
	
			if (scriptText)  {
				(function() {
					try {
						var  ctrl = eval( scriptText );
							 
						__.initPage();
	
						if (callback)
							callback( ctrl );
					}
					catch (e)  {
						console.log(e);
					}
				 })();
			}
			else  if (callback)
				callback();
		}
	
	
		_ctrl.prototype.reload = function(url, args, cb)  {
			switch (arguments.length)  {
				case  0:
					url = this.opURI;
					break;
	
				case  1:
					if (typeof url === 'function')  {
						cb = url;
						url = this.opURI;
					}
					else  if (typeof url !== 'string')  {
						args = url;
						url = this.opURI;
					}
					break;
	
				case  2:
					if (typeof args === 'function')  {
						cb = args;
						if (typeof url === 'string')
							args = null;
						else  {
							args = url;
							url = this.opURI;
						}
					}
					break;
			}
	
			let  newSrc = url !== this.opURI,
				 pdata = null;
			url += '.hf';
	
			if (args)  {
				if (args.hasOwnProperty('id'))
					url += '/' + args.id;
	
				if (args.hasOwnProperty('isSameBlk'))
					newsrc = !args.isSameBlk;
	
				if (args.params)
					pdata = args.params;
				else  if (!args.params && !args.id)
					pdata = args;
			}
	
			// reuse the original block ID
			pdata = pdata || {};
			pdata._cs_knownAs = blkID;
	
			let  blkID = this.getBlockID(),
				 bkCtrl = this;
				
			_wf.postHTML(url, pdata, null, function(html)  {
				displayReload(bkCtrl, newSrc, html, function(nctrl) {
					nctrl.opURI = url;
					if (cb)
						cb( nctrl );
				});
			});
		}
	
		/*
		function  displayReload(bkCtrl, newSrc, html, cb)  {
			var  dom = $(html);
			if (newSrc)  {
				let  cssTag = dom.filter('style')[0];
					 cssText = cssTag.text || cssTag.textContent || cssTag.innerHTML;
				if (cssText)  {
					let css = document.createElement('style');
					css.type = 'text/css';
					css.innerHTML = cssText;
					document.head.appendChild(css);
				}
			}
	
			bkCtrl.getJqTarget().parent().empty().append( dom.filter('div')[0] );
	
			var  scriptTag = dom.filter('script')[0],
				 scriptText = scriptTag.text;
	
			if (scriptText)  {
				(function() {
					try {
						var  ctrl = eval( scriptText );
	
						// copy event handlers
						var  hlist = bkCtrl.evtMap;
						if (hlist)  {
							ctrl.evtMap = {};
							for (var p in hlist)
								ctrl.evtMap[p] = hlist[p];
						}
						bkCtrl = ctrl;
					}
					catch (e)  {
						console.log(e);
					}
				 })();
			}
	
			bkCtrl.jqDspTarget = null;
	
			__.initPage();
	
			if (cb)
				cb( bkCtrl );
		}
		*/
	
		_ctrl.prototype.api = function(req, callback)  {
			$.post('/_api/post', req, function(data) {
				callback(data);
			});
		};
	
		_ctrl.prototype.notify = function(evtSource, handler)  {
			this._xsbk.notify( evtSource, handler );
		};
	
		_ctrl.prototype.on = function(evtSource, args)  {
			this._xsbk.on( evtSource, args );
		};
	
		_ctrl.prototype.addHandler = function(evtSource, handler)  {
			let  elist = this.evtMap[evtSource];
			if (!elist)  {
				elist = [];
				this.evtMap[evtSource] = elist;
			}
	
			if (elist.indexOf(handler) < 0)
			elist.push( handler );
		};
	
		_ctrl.prototype.callHandler = function(evtSource, args)  {
			let  elist = this.evtMap[evtSource];
			if (elist)  {
				elist.forEach( function(handler) {
					handler( args );
				});
			}
		};
	
		//_ctrl.prototype.on = _ctrl.prototype.callHandler;
	
		return  _ctrl;
	})();

	return _wf;
}(_wf || {}));

var  __ = _wf;

function  displayReload(bkCtrl, newSrc, html, cb)  {
	let  dom = $(html);
	if (newSrc)  {
		let  cssTag = dom.filter('style')[0];
			 cssText = cssTag.text || cssTag.textContent || cssTag.innerHTML;
		if (cssText)  {
			let css = document.createElement('style');
			css.type = 'text/css';
			css.innerHTML = cssText;
			document.head.appendChild(css);
		}
	}

	bkCtrl.getJqTarget().parent().empty().append( dom.filter('div')[0] );

	var  scriptText = dom.filter('script')[0].text;

	if (scriptText)
		try {
			var  ctrl = eval( scriptText );

			// copy event handlers
			var  hlist = bkCtrl.evtMap;
			if (hlist)  {
				ctrl.evtMap = {};
				for (var p in hlist)
					ctrl.evtMap[p] = hlist[p];
			}
			bkCtrl = ctrl;
		}
		catch (e)  {
			console.log(e.stack);
		}

	bkCtrl.jqDspTarget = null;

	__.initPage();

	if (cb)
		cb( bkCtrl );
}

/*
var  _ctrl = (function()  {
	var  _ctrl = function _ctrl(target, opURI)  {
		this.evtMap = {};
		this.opURI = opURI;
		this.dspTarget = target;
		//this.jqDspTarget = $(target);
		this._init = false;

		_wf.addPageCtrl( this );

		this.getTarget = function()  {
			return  this.dspTarget;
		};

		this.getJqTarget = function()  {
			this.jqDspTarget = this.jqDspTarget  || $(this.dspTarget);
			return  this.jqDspTarget;
		};

		this.getBlockID = function()  {
			return  this.getJqTarget().attr('id');
		};
	};

	_ctrl.prototype.setID = function(id)  {
		var  oldID = this.getBlockID();
		_wf.removeCtrl( oldID );
		_wf.addCtrl( id, this );

		this.getJqTarget().attr('id', id);
	};

	_ctrl.prototype.startup = function startup()  {};

	_ctrl.prototype.sel = function sel(s)  {
		return  this.getJqTarget().find(s);
	};

	_ctrl.prototype.find = _ctrl.prototype.sel;

	_ctrl.prototype.embed = function embed(div, srvURI, args, callback)  {
		if (arguments.length === 3)  {
			if (typeof args === 'function')  {
				callback = args;
				args = null;
			}
		}
		
		var  target = this.getJqTarget().find(div),
			 url = srvURI + '.hf',
			 pdata = {};

		if (args)  {
			if (args.id || args.params || args.knownAs)  {
				if (args.hasOwnProperty('id'))
					url += '/' + args.id;
				if (args.params)
					pdata = args.params;
				if (args.knownAs)
					pdata._cs_knownAs = args.knownAs;
			}
			else
				pdata = args;
		}

		var  paCtrl = this;
		__.postHTMLI(url, pdata, function(html)  {
			displayEmbed(paCtrl, target, html, callback);
		});
	}


	function  displayEmbed(paCtrl, target, html, callback)  {
		var  dom = $(html);
		var  cssTag = dom.filter('style')[0];

		if (cssTag)  {
			var  cssText = cssTag.text || cssTag.textContent || cssTag.innerHTML;
			__.setCSS( cssText );
		}

		target.empty().append( dom.filter('div')[0] );
		//target.replaceWith( dom.filter('div')[0] );

		var  scriptTag = dom.filter('script')[0],
			 scriptText = scriptTag  ?  scriptTag.text : null;

		if (scriptText)  {
			(function() {
				try {
					var  ctrl = eval( scriptText );
						 
					__.initPage();

					if (callback)
						callback( ctrl );
				}
				catch (e)  {
					console.log(e);
				}
			 })();
		}
		else  if (callback)
			callback();
	}


	_ctrl.prototype.reload = function(url, args, cb)  {
		switch (arguments.length)  {
			case  0:
				url = this.opURI;
				break;

			case  1:
				if (typeof url === 'function')  {
					cb = url;
					url = this.opURI;
				}
				else  if (typeof url !== 'string')  {
					args = url;
					url = this.opURI;
				}
				break;

			case  2:
				if (typeof args === 'function')  {
					cb = args;
					if (typeof url === 'string')
						args = null;
					else  {
						args = url;
						url = this.opURI;
					}
				}
				break;
		}

        let  newSrc = url !== this.opURI,
             pdata = null;
		url += '.hf';

		if (args)  {
			if (args.hasOwnProperty('id'))
				url += '/' + args.id;

			if (args.hasOwnProperty('isSameBlk'))
				newsrc = !args.isSameBlk;

			if (args.params)
				pdata = args.params;
			else  if (!args.params && !args.id)
				pdata = args;
		}

		// reuse the original block ID
		pdata = pdata || {};
		pdata._cs_knownAs = blkID;

		let  blkID = this.getBlockID(),
			 bkCtrl = this;
			
		__.postHTMLI(url, pdata, function(html)  {
			displayReload(bkCtrl, newSrc, html, function(nctrl) {
				nctrl.opURI = url;
				if (cb)
					cb( nctrl );
			});
		});
	}


	function  displayReload(bkCtrl, newSrc, html, cb)  {
		var  dom = $(html);
		if (newSrc)  {
			let  cssTag = dom.filter('style')[0];
				 cssText = cssTag.text || cssTag.textContent || cssTag.innerHTML;
			if (cssText)  {
				let css = document.createElement('style');
				css.type = 'text/css';
				css.innerHTML = cssText;
				document.head.appendChild(css);
			}
		}

		bkCtrl.getJqTarget().parent().empty().append( dom.filter('div')[0] );

		var  scriptTag = dom.filter('script')[0],
			 scriptText = scriptTag.text;

		if (scriptText)  {
			(function() {
				try {
					var  ctrl = eval( scriptText );

					// copy event handlers
					var  hlist = bkCtrl.evtMap;
					if (hlist)  {
						ctrl.evtMap = {};
						for (var p in hlist)
							ctrl.evtMap[p] = hlist[p];
					}
					bkCtrl = ctrl;
				}
				catch (e)  {
					console.log(e);
				}
			 })();
		}

		bkCtrl.jqDspTarget = null;

		__.initPage();

		if (cb)
			cb( bkCtrl );
	}

	_ctrl.prototype.api = function(req, callback)  {
		$.post('/_api/post', req, function(data) {
			callback(data);
		});
	};

	_ctrl.prototype.notify = function(evtSource, handler)  {
		this._xsbk.notify( evtSource, handler );
	};

	_ctrl.prototype.on = function(evtSource, args)  {
		this._xsbk.on( evtSource, args );
	};

	_ctrl.prototype.addHandler = function(evtSource, handler)  {
		let  elist = this.evtMap[evtSource];
		if (!elist)  {
			elist = [];
			this.evtMap[evtSource] = elist;
		}

		if (elist.indexOf(handler) < 0)
		elist.push( handler );
	};

	_ctrl.prototype.callHandler = function(evtSource, args)  {
		let  elist = this.evtMap[evtSource];
		if (elist)  {
			elist.forEach( function(handler) {
				handler( args );
			});
		}
	};

	//_ctrl.prototype.on = _ctrl.prototype.callHandler;

	return  _ctrl;
})();
*/