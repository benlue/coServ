/*!
 * coServ front-end controller
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2016 Gocharm Inc.
 */
var  _wf = (function (_wf) {
	_wf.blkList = [];
	_wf.ctrlMap = {};

	_wf.register = function register(url)  {
		var  doIt;
		if ( doIt = ($.inArray( url, _wf.blkList ) < 0) )
			_wf.blkList.push( url );
		return  doIt;
	};

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

		$.post(url, pdata, function(html) {
			// a bit of hacking. tried jQuery find, but not work.
			var  idx1 = html.indexOf('text/css">'),
				 idx2 = html.indexOf('</style>'),
				 cssText = html.substring(idx1 + 10, idx2).trim();

			idx1 = html.indexOf('javascript', idx2);
			idx2 = html.indexOf('</script>', idx1);
			scriptText = html.substring(idx1+12, idx2).trim();

			idx1 = html.indexOf('<div', idx2 + 9);
			htmlText = html.substring(idx1);

			if (cssText.length > 0 && (isNew = _wf.register( srvURI )))  {
				var css = document.createElement('style');
				css.type = 'text/css';
				css.innerHTML = cssText;
				document.head.appendChild(css);
			}

			target.empty().append( htmlText );

			if (scriptText.length > 0)  {
				(function() {
					try {
						var  ctrl = eval( scriptText );
							 
						//ctrl.init();
						//ctrl.startup();
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
		}, 'html');
	};

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
		}

		var  blkID = this.getBlockID(),
			 bkCtrl = this;
			 
		// reuse the original block ID
		pdata = pdata || {};
		pdata._cs_knownAs = blkID;
		
		$.post(url, pdata, function(html) {
			// a bit of hacking. tried jQuery find, but not work.
			var  idx1 = html.indexOf('<script'),
				 idx2 = html.indexOf('</script>', idx1);

            if (newSrc)  {
                // loading a new block to the target area. should load the css and run the block script.
                var  cssIdx1 = html.indexOf('<style'),
                     cssIdx2 = idx1,
                     cssRules = $(html.substring(cssIdx1, cssIdx2));
                $('html > head').append( cssRules );

                var  jsIdx = html.indexOf('(function', idx1);
                if (jsIdx > 0)  {
                    var  jsCode = html.substring(jsIdx, idx2);

					__.removeCtrl( blkID );

                    //eval( jsCode );
					//var  newBkCtrl = __.getCtrl( blkID );
                    var  newBkCtrl = eval( jsCode );

					// copy event handlers
					var  hlist = this.evtMap;
					if (hlist)  {
						newBkCtrl.evtMap = [];
						for (var p in hlist)
							newBkCtrl.evtMap[p] = hlist[p];
					}

					bkCtrl = newBkCtrl;
				}
            }
            else  {
            	bkCtrl.jqDspTarget = null;
            	bkCtrl._init = false;
            }

			// replace the HTML source
			idx1 = html.indexOf('<div', idx2 + 9);
			htmlText = html.substring(idx1);
			bkCtrl.getJqTarget().parent().empty().append( htmlText );
			// clean up jqTarget again
			bkCtrl.jqDspTarget = null;

			__.initPage();

			if (cb)
				cb( bkCtrl );

		}, 'html');
	};

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
