/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */
const  async = require('async'),
       md = require('markdown-it')(),
       emulator = require('../uic/EmulateUIC'),
       hasj = require('../uic/hAsJs'),
       fs = require('fs'),
	   path = require('path'),
       url = require('url'),
       util = require('util'),
	   xml2js = require('xml2js'),
       RenderQ = require('./RenderQ.js'),
       blkUtil = require('../util/blockUtil.js');

try {
    var sass = require("node-sass");
}
catch(e) {
    console.error(e.message);
}

var  _viewAutoID = 1;

var  WebView = (function()  {

	var  WebView = function(renderOpt, renderQ)  {
        renderOpt.path += '/';
        renderOpt.opPath = renderOpt.opPath.replace(/\\/g, '/');
        this.renderOption = renderOpt;
        this.renderQ = renderQ;
        renderQ.setRootPath( renderOpt.rootPath );

        // tell SASS where to find @import files
        this.sassBase = [path.join(renderOpt.rootPath, './sass'), path.join( renderOpt.rootPath, '../../cont/sass')];
        
        // if the block has been assigned with an ID, do not auto-generate the class name
        //if (renderQ.parentQ && !renderQ.getCssID())
        if (!renderQ.getCssID())
            renderQ.setClazName( autoGenClazName(this, renderOpt) );

		this.compose = function(pfix, cb)  {
            let  blockRoot = this.getRootPath() + '/blocks/views',
                 uicPath = this.getOpPath(),
                 blkView = this.getViewPath().slice(0, -1) + '.xs',
                 webView = this;
            //console.log('block view file: ' + blkView);
            
            fs.stat(blkView, (err, stats) => {
                if (stats && stats.isFile())  {
                    let  cssID = renderQ.getCssID() || genAutoID();

                    emulator.runXS(cssID, uicPath, blockRoot, renderQ).then( xsElm => {
                        //let  cssPrefix = renderQ.getClazName(true);
                        let  cssPrefix = '.' + blkUtil.pathToClazName(renderOpt.opPath);
                        if (renderQ.parentQ)  {
                            if (!webView.renderOption.noWrap)
                                renderQ.add( xsElm.toHTML() );
                        }
                        else  {
                            if (!renderQ.asPage() && !renderQ.isExt)  {
                                // generates a HTML-fragment
                                let  clazName = renderQ.getClazName(),
                                     classAttr = clazName  ?  ' class="' + clazName + '"' : '',
                                     dynaNodeMock = {html: wrapHTMLFrag(cssID, classAttr, xsElm.toHTML())};
                                
                                fillInHTML(dynaNodeMock, renderQ);  // this will inherintly call renderQ.add()
                            }
                        }

                        renderQ.addCSS( xsElm.toCSS(), cssPrefix );
                        renderQ.addJS( xsElm.toJS() );

                        renderQ.seal(cb);
                    });
                }
                else
                    // old-styled blocks
                    handleBlockFiles( webView, cb );
            });
		};
    };
    

    function  handleBlockFiles(webView, cb)  {
        fs.readdir( webView.getViewPath(), function(err, files) {
            if (err)  {
                var  rtnObj = {
                        body: util.format('<div class="_xsError">Block [%s] missing the view directory.</div>', webView.getOpPath())
                    };
                cb( false, rtnObj );
            }
            else  {
                var  dynaNode = prepareDynaNode( webView, files );

                webView.composeView( dynaNode, function() {
                    webView.renderQ.seal(cb);
                });
            }
        });
    }


	WebView.prototype.composeView = function(dynaNode, cb)  {
		var  webView = this,
             renderQ = this.renderQ;
		dynaNode.cssID = renderQ.getCssID() || genAutoID();
        //console.log('dynaNode is\n%s', JSON.stringify(dynaNode, null, 4));

        async.series([
            function loadLang(callback)  {
                if (dynaNode.lang)  {
                    // dealing with multi-lingual issues
                    fs.readFile( dynaNode.lang, {encoding: 'UTF-8'}, function(err, xmlData) {
                        if (xmlData)  {
                            var  parser = new xml2js.Parser(),
                                 locale = renderQ.getLocale() || 'en';

                            parser.parseString( xmlData, function(err, result) {
                                if (!err)  {
                                    var  phrase = result.phrases.ph,
                                         phrases = {},
                                         localeError = false;

                                    if (phrase)  {
                                        for (var i in phrase)  {
                                            if (phrase[i][locale])
                                                phrases[phrase[i]['$'].id] = phrase[i][locale][0];
                                            else  {
                                                phrases[phrase[i]['$'].id] = '';
                                                localeError = true;
                                            }
                                        }
                                    }

                                    if (localeError)
                                        console.error('The locale[%s] is not supported in %s', locale, dynaNode.lang);
                                    
                                    renderQ.phrases = dynaNode.phrases = phrases;
                                }
                                callback( err );
                            });
                        }
                        else
                            callback( err );
                    });
                }
                else
                    callback();
            },

            function composing(callback)  {
            	loadDynaNode(webView, dynaNode, callback);
            }
        ],
        function(err, results) {
            if (err && err.stack)
                console.log( err.stack );
            else
                fillInHTML(dynaNode, renderQ);
            cb();
        });
	};

    WebView.prototype.getRootPath = function()  {
        return  this.renderOption.rootPath;
    };

    WebView.prototype.getViewPath = function()  {
        return  this.renderOption.path;
    };

    WebView.prototype.getOpPath = function()  {
        return  this.renderOption.opPath;
    };

	return  WebView;
})();

module.exports = WebView;


function  loadDynaNode(webView, dynaNode, cb)  {
    var cssID = dynaNode.cssID,
        renderQ = webView.renderQ,
        clazName = renderQ.getClazName();

    async.parallel([
        function loadHTML(cb)  {
            if (!dynaNode.html && !dynaNode.md)  {
                if (dynaNode.xs)
                    return  cb();
                else  {
                    dynaNode.html = '<div class="_xsError">Can not find the HTML template.</div>';
                    return  cb( 'Can not find the HTML template.' );
                }
            }

            if (renderQ.isExt && !renderQ.asPage())
                // block fragment development mode
                dynaNode.html = path.join(__dirname, '../client/layout/page.html');
            //console.log('loading dynaNode...\n' + JSON.stringify(dynaNode, null, 4));

            fs.readFile( dynaNode.html || dynaNode.md, {encoding: 'utf8'}, function(err, html)  {
                if (html)  {
                    if (dynaNode.md)
                        // this is actually a markdown file. convert it to HTML first
                        html = md.render(html);
                    dynaNode.html = html;

                    let  classAttr = clazName  ?  ' class="' + clazName + '"' : '';

                    if (renderQ.parentQ)  {
                        if (!webView.renderOption.noWrap)     
                            dynaNode.html = '<div id="' + cssID + '" ' + classAttr + '>' + html + '</div>';
                    }
                    else  {
                        if (!renderQ.asPage() && !renderQ.isExt)
                            // generates a HTML-fragment
                            dynaNode.html = wrapHTMLFrag(cssID, classAttr, html);
                    }
                }
                cb(err);
            });
        },

        function loadJs(cb)  {
            if (dynaNode.jsF)  {
                var  parentID = renderQ.pCssID  ?  '"' + renderQ.pCssID + '"' : 'null';

                fs.readFile( dynaNode.jsF, {encoding: 'UTF-8'}, function(err, jsData) {
                    if (err)  return  cb(err);

                    let  js = wrapJsCode(cssID, webView.getOpPath(), parentID, jsData || '');
                    renderQ.addJS( fillInAux( js, dynaNode, renderQ ) );
                    cb();
                });
            }
            else  {
                // even if a block does not specify a controoler, we'll create an empty controller.
                // that's because we use __.getCtrl() to find a block.
                // without a controller a block cannot be found.
                if (!renderQ.asPage() && !dynaNode.xs)  {
                    let  js = wrapJsCode(cssID, webView.getOpPath(), parentID, '');
                    renderQ.addJS( fillInAux( js, dynaNode, renderQ ) );
                }
                cb();
            }
        },

        function loadCss(cb)  {
            if (dynaNode.cssF)  {
                fs.readFile( dynaNode.cssF, {encoding: 'UTF-8'}, function(err, cssData) {
                    if (cssData)  {
                        let  cssClaz = renderQ.getClazName(true);
                        
                        cssData = fillInAux(cssData, dynaNode, renderQ);
                        renderQ.addCSS( cssData, cssClaz );
                    }
                    cb( err );
                });
            }
            else  if (dynaNode.sass)  {
                if (!sass)
                    throw new Error('The node-sass module is not installed.');

                fs.readFile( dynaNode.sass, {encoding: 'UTF-8'}, function(err, sassData) {
                    if (sassData)  {
                        sassData = fillInAux(sassData, dynaNode, renderQ);
                        sass.render( {
                            data: sassData,
                            includePaths: webView.sassBase,
                            success: function(css) {
                                var  cssClaz = renderQ.getClazName(true);

                                if (typeof css !== 'string')
                                    css = css.css;
                                renderQ.addCSS( css, cssClaz );
                                cb();
                            },
                            error: function(err)  {
                                cb( err );
                            }
                            // includePath, outputStyle: 'compressed'
                        });
                    }
                    else
                        cb( err );
                });
            }
            else
                cb();
        },

        function loadInc(callback)  {
            if (dynaNode.inc)  {
                fs.readFile( dynaNode.inc, {encoding: 'UTF-8'}, function(err, incData) {
                    if (incData)
                        renderQ.addInc( incData );
                    callback( err);
                });
            }
            else
                callback();
        }
    ], cb);
}


function  wrapHTMLFrag(cssID, classAttr, html)  {
    let  htmlFG = '<style type="text/css">\n<% css(); %></style>\n' +
                  '<script type="text/javascript">\n<% js(); %></script>\n' +
                  '<div id="' + cssID + '" ' + classAttr + '>' + html + '</div>';
    return  htmlFG;
}


function  wrapJsCode(cssID, opURL, parentID, jsData)  {
    let  js = util.format("(function()  {\n\tvar  ctrl = new _ctrl('#%s', '%s');\n", cssID, opURL);
    js += util.format("\tvar  _parent = %s;\n\tctrl.getParent = function() {return _parent  ?  __.getCtrl(_parent) : null;}\n%s\nreturn ctrl;\n})();", parentID, jsData);

    return  js;
}


function  prepareDynaNode(webView, files)  {
	var  viewPath = webView.getViewPath(),
         dynaNode = {
            rootPath: webView.getRootPath(),
            viewPath: viewPath
         };

    for (var i in files)  {
        var  fname = files[i],
             filePath = viewPath + fname,
			 idx = fname.indexOf('.'),
			 suffix = fname.substring(idx+1);
		//console.log('dyna file name: %s, suffix: %s', fname, suffix);

		switch (suffix)  {
            case  'html':
            case  'md':
            case  'xs':
            case  'inc':
            case  'lang':
				dynaNode[suffix] = filePath;
                break;

			case  'js':
				dynaNode.jsF = filePath;
                break;
                
			case  'css':
				dynaNode.cssF = filePath;
                break;
                
            case  'scss':
                dynaNode.sass = filePath;
                break;
		}
	}

	return  dynaNode;
};


function  fillInAux(s, dynaNode, renderQ)  {
	var  str = null,
		 vars = [];

	while (s.length > 0)  {
		var  tuple = getTuple( s );
		s = tuple.s;
		vars.push( tuple.html );

		if (str)
			str += 'html += htmlList[' + (vars.length-1) + '];';
		else
			str = 'html = htmlList[' + (vars.length-1) + '];';

		if (tuple.exeCode)  {
			var  exeCode = tuple.exeCode;

			if (exeCode[0] === '=')  {
				var  varName = exeCode.substring(1); //.trim();
                str += 'html += ' + varName + ';';
			}
			else  {
                if (exeCode.indexOf('import(') === 0)  {
                    var  idx0 = exeCode.indexOf('\'', 7)+1,
                         idx1 = exeCode.indexOf('\'', idx0);
                    if (idx0 && idx1)
                        try  {
                            var  impFile = exeCode.substring(idx0, idx1);
                            impFile = path.join(impFile[0] === '.'  ?  dynaNode.viewPath : dynaNode.rootPath, impFile);

                            var  imStr = fs.readFileSync( impFile ).toString();
                            vars.push( fillInAux(imStr, dynaNode, renderQ) );
                            str += 'html += htmlList[' + (vars.length-1) + '];';
                        }
                        catch (e)  {
                            console.log( e.stack );
                        }
                    else
                        str += exeCode;
                }
                else
				    str += exeCode;
            }
		}
    }
    
	return  str  ?  renderQ.evalStr(str, vars) : '';
};


function  fillInHTML(dynaNode, renderQ) {
	var  s = dynaNode.html;

	while (s.length > 0)  {
		var  tuple = getTuple( s );
		s = tuple.s;
        if (tuple.html)
		  renderQ.add( tuple.html );

		if (tuple.exeCode)  {
			var  exeCode = tuple.exeCode;
			if (exeCode[0] === '=')  {
				var  varName = exeCode.substring(1).trim();
				if (varName === 'ctrl')
					renderQ.add('_wf.getCtrl(\'' + dynaNode.cssID + '\')');
				else  {
					renderQ.add( {value: varName} );
                }
			}
            else
                renderQ.add( {code: exeCode} );
		}
	}
};


function  getTuple(s)  {
	var  tuple = {s: ''},
		 html = s;
		 idx = s.indexOf('<%');

	if (idx >= 0)  {
		html = s.substring(0, idx);
		s = s.substring( idx+2 );

		idx = s.indexOf('%>');
		if (idx >= 0)  {
			tuple.exeCode = s.substring(0, idx).trim();
			tuple.s = s.substring( idx + 2 );
		}
	}

	tuple.html = html;

	return  tuple;
};


/**
 * Generate CSS selector ID for each block or region.
 *
 * @returns {String}
 */
function  genAutoID()  {
	return  'c' + _viewAutoID++;
};


function  autoGenClazName(webView, renderOpt)  {
    var  clazName = '',
         renderQ = webView.renderQ;

    //if (!renderOpt.noWrap && (renderQ.parentQ || !renderQ.srvObj.isPage))  {
    if (!renderOpt.noWrap && !renderQ.srvObj.isPage)
        clazName = blkUtil.pathToClazName(renderOpt.opPath);

    return  clazName;
}


// shallow clone is ok; no need for deep clone
function  cloneObj(obj)  {
	var  copy = {};
	for (var key in obj)
		if (obj.hasOwnProperty(key))
			copy[key] = obj[key];
	return  copy;
}


/*
function  capitalize(s) {
    return s.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};
*/
