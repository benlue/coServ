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

	_wf.initPage = function()  {
        for (var k in _wf.ctrlMap)  {
        	var  c = _wf.ctrlMap[k];
        	if (!c._init)  {
        		c._init = true;
        		//c.init();
        		c.startup();
        	}
        }
	};

	_wf.api = function(req, callback)  {
		$.post('/_api/post', req, function(data) {
			callback(data);
		});
	};

	return _wf;
}(_wf || {}));

var  __ = _wf;

var  _ctrl = (function()  {
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
			this.jqDspTarget = this.jqDspTarget  || $(this.dspTarget);
			return  this.jqDspTarget;
		};

		this.getBlockID = function()  {
			return  this.getJqTarget().attr('id');
		};
	};

	/*
	_ctrl.prototype.init = function init(ption)  {
		//console.log('[%s] is initialized...', this.opURI);
		this.jqDspTarget = $(this.dspTarget);
		this._init = true;
	};
	*/

	_ctrl.prototype.setID = function(id)  {
		var  oldID = this.getBlockID();
		_wf.removeCtrl( oldID );
		_wf.addCtrl( id, this );

		this.getJqTarget().attr('id', id);
	};

	_ctrl.prototype.startup = function startup()  { / *empty */ };

	_ctrl.prototype.sel = function sel(s)  {
		return  this.getJqTarget().find(s);
	};

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
			if (args.id)
				url += '/' + args.id;
			if (args.params)
				pdata = args.params;
			if (args.knownAs)
				pdata._cs_knownAs = args.knownAs;
		}

		var  paCtrl = this;
		$.ajax({
			url: url,
			contentType: 'application/json',
			data: JSON.stringify(pdata),
			processData: false,
			dataType: 'html',
			type: 'POST'
		})
		.done(function(html)  {
			displayEmbed(paCtrl, target, html, callback);
		});
	}


	function  displayEmbed(paCtrl, target, html, callback)  {
		var  dom = $(html);
		var  cssTag = dom.filter('style')[0];
			 cssText = cssTag.text || cssTag.textContent || cssTag.innerHTML;
		if (cssText.length > 0)  {
			var css = document.createElement('style');
			css.type = 'text/css';
			css.innerHTML = cssText;
			document.head.appendChild(css);
		}

		target.empty().append( dom.filter('div')[0] );

		var  scriptTag = dom.filter('script')[0],
			 scriptText = scriptTag.text;

		if (scriptText)  {
			(function() {
				try {
					var  ctrl = eval( scriptText );
					ctrl._parent = paCtrl.getBlockID();
						 
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


	_ctrl.prototype.reload = function reload(url, args, cb)  {
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

        var  newSrc = url !== this.opURI,
             pdata = null;
		url += '.hf';

		if (args)  {
			if (args.id)
				url += '/' + args.id;
			if (args.params)
				pdata = args.params;
			else  if (!args.params && !args.id)
				pdata = args;
		}

		var  blkID = this.getBlockID(),
			 bkCtrl = this;
			 
		// reuse the original block ID
		pdata = pdata || {};
		pdata._cs_knownAs = blkID;
		
		$.ajax({
			url: url,
			contentType: 'application/json',
			data: JSON.stringify(pdata),
			processData: false,
			dataType: 'html',
			type: 'POST'
		})
		.done(function(html)  {
			displayReload(bkCtrl, newSrc, html, cb)
		});
	}


	function  displayReload(bkCtrl, newSrc, html, cb)  {
		var  dom = $(html);
		if (newSrc)  {
			var  cssTag = dom.filter('style')[0];
				 cssText = cssTag.text || cssTag.textContent || cssTag.innerHTML;
			if (cssText)  {
				var css = document.createElement('style');
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
					ctrl._parent = bkCtrl.getBlockID();

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

	_ctrl.prototype.addHandler = function(evtSource, handler)  {
		//console.log("Adding to [" + evtSource + "] handler list: ");
		var  hlist = this.evtMap[evtSource];
		if (!hlist)  {
			hlist = [];
			this.evtMap[evtSource] = hlist;
		}

		var  notYet = true;
		for (var p in hlist)  {
			if (hlist[p] === handler)  {
				notYet = false;
				break;
			}
		}

		if (notYet)
			hlist.push( handler );
	};

	_ctrl.prototype.callHandler = function(evtSource, args)  {
		var  hlist = this.evtMap[evtSource];
		if (hlist)  {
			$.each(hlist, function(i, handler) {
				handler( args );
			});
		}
	};

	return  _ctrl;
})();
