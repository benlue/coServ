/**
 * New node file
 */
var  _wf = (function (_wf) {
	_wf.blkList = [];
	_wf.ctrlList = [];
	_wf.ctrlMap = {};

	_wf.register = function register(url)  {
		var  doIt;
		if ( doIt = ($.inArray( url, _wf.blkList ) < 0) )
			_wf.blkList.push( url );
		return  doIt;
	};

	_wf.addCtrl = function addCtrl(id, ctrl)  {
		_wf.ctrlMap[id] = ctrl;
		//console.log( _wf.ctrlMap );
	};

	_wf.getCtrl = function getCtrl(id)  {
		return  _wf.ctrlMap[id];
	};

	_wf.removeCtrl = function removeCtrl(id)  {
		delete _wf.ctrlMap[id];
	};

	_wf.addPageCtrl = function(c)  {
		_wf.ctrlList.push( c );
	};

	_wf.initPage = function()  {
		_wf.ctrlList.forEach( function(c) {
			c.init();
		});
		_wf.ctrlList.forEach( function(c) {
			c.startup();
		});
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
		this.dspTarget = target;
		this.evtMap = {};
		this.opURI = opURI;

		_wf.addPageCtrl( this );

		this.getTarget = function()  {
			return  this.dspTarget;
		};

		this.getJqTarget = function()  {
			return  this.jqDspTarget;
		};
	};

	_ctrl.prototype.init = function init()  {
		this.jqDspTarget = $(this.dspTarget);
		var  blockID = this.dspTarget.substring(1);

		if (blockID)
			_wf.addCtrl( blockID, this );
	};

	_ctrl.prototype.startup = function startup()  { / *empty */ };

	_ctrl.prototype.sel = function sel(s)  {
		return  this.jqDspTarget.find(s);
	};

	_ctrl.prototype.embed = function embed(div, srvURI, args, callback)  {
		if (!callback && args)  {
			if (!args.hasOwnProperty('id') && !args.hasOwnProperty('params'))  {
				callback = args;
				args = null;
			}
		}
		var  target = this.getJqTarget().find(div),
			 url = srvURI + '.hf',
			 pdata = null;

		if (args)  {
			if (args.id)
				url += '/' + args.id;
			if (args.params)
				pdata = args.params;
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
			//console.log('html: %s', htmlText);

			if (cssText.length > 0 && (isNew = _wf.register( srvURI )))  {
				var css = document.createElement('style');
				css.type = 'text/css';
				css.innerHTML = cssText;
				document.head.appendChild(css);
			}

			target.empty().append( htmlText );

			if (scriptText.length > 0)  {
				console.log('will new a conrtoller.');
				(function() {
				    var  ctrl = eval( scriptText );
				    ctrl.init();
				    ctrl.startup();
				    if (callback)
				    	callback( ctrl );
				 })();
			}
		}, 'html');
	};

	_ctrl.prototype.reload = function reload(url, args, target)  {
		if (url)  {
			if (typeof url !== 'string')  {
				url = this.opURI;
				args = url;
			}
		}
        else
            url = this.opURI;
		url += '.hf';

        var  newSrc = url !== this.opURI,
             pdata = null;

		if (args)  {
			if (args.id)
				url += '/' + args.id;
			if (args.params)
				pdata = args.params;
		}
		target = target || this.getJqTarget().parent();

		$.post(url, pdata, function(html) {
			var  blkID = $(target).children().first().attr('id'),
				 bkCtrl = __.getCtrl(blkID);

			// a bit of hacking. tried jQuery find, but not work.
			var  idx1 = html.indexOf('<script'),
				 idx2 = html.indexOf('</script>', idx1);

            if (newSrc)  {
                // loading a new block to the target area. should load the css and run the block script.
                var  cssIdx1 = html.indexOf('<style'),
                     cssIdx2 = idx1,
                     cssRules = $(html.substring(cssIdx1, cssIdx2));
                console.log('css rules: %s', html.substring(cssIdx1, cssIdx2));
                $('html > head').append( cssRules );

                var  jsIdx = html.indexOf('(function', idx1);
                if (jsIdx > 0)  {
                    var  jsCode = html.substring(jsIdx, idx2);
                    bkCtrl = eval( jsCode );
                }
            }

			idx1 = html.indexOf('<div', idx2 + 9);
			htmlText = html.substring(idx1);
			//console.log('html: %s', htmlText);

			target.empty().append( htmlText );

			if (bkCtrl)  {
                _wf.removeCtrl( blkID );

                // change the controller id
                var  newID = $(target).children().first().attr('id');
                bkCtrl.dspTarget = '#' + newID;

				bkCtrl.init();	// reloaded block should not init ctrl again
				bkCtrl.startup();
			}
			else
				console.log('Oops! Reloaded block controller is not found!');
		}, 'html');
	};

	_ctrl.prototype.addHandler = function(evtSource, handler)  {
		console.log("Adding to [" + evtSource + "] handler list: ");
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

		if (notYet)  {
			hlist.push( handler );
			console.log("Handler is added.");
		}
		else
			console.log("Handler not added.");
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
