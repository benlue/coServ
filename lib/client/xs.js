/*!
 * coServ front-end controller
 * authors: Ben Lue
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */
var  _wf = (function (_wf) {

	let  _PL_SER = 1,
		 _PL_MAP = {}

	_wf.main = function()  {
		return  this._xs_page;
	}
	
	_wf.initPage = function()  {
		let  initList = this.initList;

        if (initList)  {
			let  len = initList.length - 1,
				 main = this[initList[len]];

			main.init();

			for (let i=0; i < len; i++)
				this[initList[i]].init();
				
			this.initList = null;
		}
	};

	_wf.addToInit = function(blkID)  {
		this.initList = this.initList || [];
		this.initList.push( '_' + blkID );
	}

	_wf.api = function(req, callback)  {
		$.post('/_api/post', req, function(data) {
			callback(data);
		});
	}

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

	_wf.setCookie = function(key, value, path, duration)  {
		path = path || '/';
		document.cookie = key + '=' + value + '; path=' + path + '; expires=' + new Date(new Date().getTime()+duration).toUTCString();
	}

	_wf.getPalet = function(serialID)  {
		return  _PL_MAP[serialID]
	}

	_wf._uic = (function() {
		var  _xsbk = function(id, url)  {
			this._id = id
			this._url = url
			this._c = {}
			this._dspTarget = '#' + id
			this.evtMap = {}

			this._serial = _PL_SER++
			this._ts = Date.now()
		};

		_xsbk.prototype._init = function()  {	
			if (!_PL_MAP[this._serial])		
				_PL_MAP[this._serial] = this

			for (var name in this._c)  {
				let  child = this._c[name];
				if (child.init)
					child.init();
				else
					child._init();
			}

			if (this.startup)
				this.startup();
		}

		_xsbk.prototype.getSerialID = function()  {
			return  this._serial
		}

		_xsbk.prototype.addChild = function(name, child)  {
			this._c[name] = child;
		}

		_xsbk.prototype.find = function(s)  {
			if (typeof s === 'string')
				return  s  ?  $(this._dspTarget + ' ' + s) : $(this._dspTarget);
			else  {
				let  e = $(this._dspTarget);
				return  s  ?  e.find(s) : e;
			}
		}

		_xsbk.prototype.getContext = function()  {
			return  this._ctx;
		}

		_xsbk.prototype.reload = function(params, cb)  {
			let  url = this._url,
				 endpID = this._ctx.endpID;

			if (endpID != undefined && endpID != null)
				url = url.split('/').slice(0, -1).join('/')

			if (params && params.hasOwnProperty('_id'))
				url += '/' + params._id;
			else  if (endpID != undefined && endpID != null)
				url += '/' + this._ctx.endpID;

			if (url.slice(-3) != '.hf')
				url += '.hf';

			// console.log('this.url: ' + this._url);
			// console.log('url: ' + url);
			// console.log('endpID: %s, isSameBlock: %s', this._ctx.endpID, isSameBlk);

			let  blk = this,
				 headers = {
					 'x-xs-reload': true,
					 'x-xs-blockid': this._id
				 };

			__.postHTML(url, params, headers, function(html)  {
				let  dom = $(html);

				blk._url = url
				blk.find().replaceWith( dom.filter('div')[0] );

				let  scriptTag = dom.filter('script')[0],
					 scriptText = scriptTag  ?  scriptTag.text : null;
				if (scriptText)
					try {
						Function(scriptText)();
					}
					catch (e)  {
						console.log( scriptText );
						console.log(e.stack);
					}

				if (blk.init)
					blk.init();
				else
					blk._init();

				if (cb)
					cb();
			});
		}

		_xsbk.prototype.embed = function(target, id, url, params, cb)  {
			if (url.slice(-3) != '.hf')
				url += '.hf';

			let  headers = {
					'x-xs-blockid': id
				 },
				 blk = __['_' + id];
			
			if (blk && blk._url != url)  {
				// this is a different palet, clean up the old
				delete  _PL_MAP[blk._serial]
				delete  __['_' + id];
				delete  this._c[id];
				blk._destroy();
				blk = null;
			}

			__.postHTML(url, params, headers, function(html)  {
				let  dom = $(html),
					 cssTag = dom.filter('style')[0];

				if (cssTag)  {
					let  cssText = cssTag.text || cssTag.textContent || cssTag.innerHTML;
					setCSS( cssText );
				}
				
				if (typeof target === 'string')
					target = $('#' + target);
				target.html( dom.filter('div')[0] );

				let  scriptTag = dom.filter('script')[0],
					 scriptText = scriptTag  ?  scriptTag.text : null;

				if (scriptText)
					try {
						let  nblk = Function(scriptText)();
						if (!blk)
							blk = nblk;
					}
					catch (e)  {
						console.log( scriptText );
						console.log(e.stack);
					}

				if (blk)  {
					blk._url = url
					if (blk.init)
						blk.init();
					else
						blk._init();
				}

				if (cb)
					cb(blk);
			});
		}

		_xsbk.prototype.setupSwitch = function(target, options)  {
			if (typeof target === 'string')
				target = $('#' + target);
			this._stackTarget = target;

			let  stack = this._paletStack = this._paletStack || {};
			options.forEach( function(cfg) {
				stack[cfg.id] = cfg;
			});
		}

		_xsbk.prototype.switch = function(id, params, cb)  {
			let  paletInfo = this._paletStack[id];
			if (paletInfo)
				this.embed(this._stackTarget, id, paletInfo.url, params, cb);
		}

		_xsbk.prototype._destroy = function()  {
			let  children = this._c;

			Object.getOwnPropertyNames(children).forEach( function(name) {
				children[name]._destroy();
				delete  __['_' + name];
			});

			this._c = {};
		}

		_xsbk.prototype.on = function(evtSource, handler)  {
			let  elist = this.evtMap[evtSource];
			if (!elist)  {
				elist = [];
				this.evtMap[evtSource] = elist;
			}

			let  matchIdx = -1,
				 handSrc = handler.toString();

			for (let i = 0, len = elist.length; i < len; i++)  {
				if (elist[i].toString() == handSrc)  {
					matchIdx = i;
					break;
				}
			}

			if (matchIdx >= 0)
				elist.splice(matchIdx, 1);
			elist.push( handler );
		}
	
		_xsbk.prototype.notify = function(evtSource)  {
			let  elist = this.evtMap[evtSource];
			if (elist)  {
				let  args = Array.prototype.slice.call(arguments, 1);;

				elist.forEach( function(handler) {
					//console.log('notifying [' + evtSource + ']...\n' + handler.toString());
					handler.apply(null, args);
				});
			}
		}

		return  _xsbk;
	})();

	function  setCSS(cssText)  {
		if (cssText)  {
			let css = document.createElement('style');
			css.type = 'text/css';
			css.innerHTML = cssText;
			document.head.appendChild(css);
		}
	}

	return _wf;
}(_wf || {}));

var  __ = _wf;
var  xs = _wf;