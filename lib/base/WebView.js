/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  async = require('async'),
     fs = require('fs'),
	 path = require('path'),
     /*sass = require('node-sass'),*/
     url = require('url'),
     util = require('util'),
	 xml2js = require('xml2js'),
	 RenderQ = require('./RenderQ.js');

try {
    var sass = require("node-sass");
}
catch(e) {
    console.error(e.message);
}

var  _viewAutoID = 1;

var  WebView = (function()  {

	var  WebView = function WebView(pathObj, renderQ)  {
		this.rootPath = pathObj.rootPath;
		this.viewPath = pathObj.path + '/';
        this.opPath = pathObj.opPath.replace('\\', '/');

        // tell SASS where to find @import files
        this.sassBase = [path.join(this.rootPath, './sass'), path.join( this.rootPath, '../../cont/shared/sass')];

        this.renderQ = renderQ;
        
        // if the block has been assigned with an ID, need not auto-generate a class name
        if (!renderQ.getCssID())  {
            this.clazName = '';
            if (!pathObj.noCssWrap && (renderQ.parentQ || !renderQ.srvObj.isPage))  {
                //var  paths = path.sep === '\\'  ?  pathObj.opPath.split('\\') : pathObj.opPath.split('/');
                var  paths = pathObj.opPath.split('/');
                /* MS Windows */
                if (pathObj.opPath.match(/\\/gi))
                    paths = pathObj.opPath.split('\\');

                for (var i in paths)
                    this.clazName += capitalize(paths[i]);
            }
            renderQ.setClazName( this.clazName );
        }

		// isMain: the main block of a page
		this.compose = function compose(isMain, cb)  {
			var  webView = this;

            //console.log('view path: ' + webView.viewPath);
			fs.readdir( webView.viewPath, function(err, files) {
                if (err)  {
                    var  rtnObj = {
                            body: util.format('<div class="_xsError">Missing the block view directory for the %s block.</div>', webView.opPath)
                         };
                    cb( false, rtnObj );
                }
				else  {
					var  renderQ = webView.renderQ,
                         dynaNode = prepareDynaNode( webView.rootPath, webView.viewPath, files );
					dynaNode.isMain = isMain;
					dynaNode.locale = renderQ.getLocale();

					webView.composeView( dynaNode, function() {
                        renderQ.seal(cb);
                    });
				}
			});
		};
	};

	WebView.prototype.composeView = function composeView(dynaNode, cb)  {
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
                                 locale = dynaNode.locale;

                            parser.parseString( xmlData, function(err, result) {
                                if (!err)  {
                                    var  phrase = result.phrases.ph,
                                         phrases = {};
                                    if (phrase)  {
                                        for (var i in phrase)
                                            phrases[phrase[i]['$'].id] = phrase[i][locale][0];
                                    }

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
            renderQ.dynaNode = dynaNode;
            fillInHTML(dynaNode, renderQ);

            if (err && err.stack)
                console.log( err.stack );
            cb();
        });
	};

	return  WebView;
})();

module.exports = WebView;


function  loadDynaNode(webView, dynaNode, cb)  {
    //console.log('loading dynaNode...[%s]', webView.viewPath);
    var cssID = dynaNode.cssID,
        renderQ = webView.renderQ;

    async.parallel([
        function loadHTML(callback)  {
            if (!dynaNode.html)  {
                dynaNode.html = '<div class="_xsError">Can not find the HTML template.</div>';
                return  callback( 'Can not find the HTML template.' );
            }

            fs.readFile( dynaNode.html, {encoding: 'utf8'}, function(err, html)  {
                if (html)  {
                    var  classAttr = webView.clazName  ?  ' class="' + webView.clazName + '"' : '';
                    if (renderQ.parentQ)  {
                        if (dynaNode.isMain)
                            dynaNode.html = '<div id="_mainC">\n<div id="' + cssID + '" ' + classAttr + '>' + html + '</div>\n</div>';
                        else
                            dynaNode.html = '<div id="' + cssID + '" ' + classAttr + '>' + html + '</div>';
                    }
                    else  {
                        if (renderQ.asPage())
                            dynaNode.html = html;
                        else
                            dynaNode.html = '<style type="text/css">\n<% css(); %></style>\n' +
                                            '<script type="text/javascript">\n<% js(); %></script>\n' +
                                            '<div id="' + cssID + '" ' + classAttr + '>' + html + '</div>';
                                            //'<div id="' + cssID + '" class="' + webView.clazName + '">' + html + '</div>';
                    }
                }
                callback(err);
            });
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
        },

        function loadJs(callback)  {
            if (dynaNode.jsF)  {
                fs.readFile( dynaNode.jsF, {encoding: 'UTF-8'}, function(err, jsData) {
                    if (jsData)  {
                        var  opURL = webView.opPath,
                             js = '(function()  {\n\tvar  ctrl = new _ctrl(\'#' + cssID + '\', \'' + opURL + '\');\n' +
                                  jsData + '\nreturn ctrl;\n})();';
                        js = fillInAux( js, dynaNode, renderQ );
                        renderQ.addJS( js );
                    }
                    callback( err );
                });
            }
            else
                callback();
        },

        function loadCss(callback)  {
            if (dynaNode.cssF)  {
                fs.readFile( dynaNode.cssF, {encoding: 'UTF-8'}, function(err, cssData) {
                    if (cssData)  {
                        var  cssClaz = webView.clazName  ?  '.' + webView.clazName : '';

                        cssData = fillInAux(cssData, dynaNode, renderQ);
                        renderQ.addCSS( cssData, cssClaz );
                    }
                    callback( err );
                });
            }
            else  if (dynaNode.sass)  {
                if (!sass)
                    throw new Error('SASS module is not installed.');

                fs.readFile( dynaNode.sass, {encoding: 'UTF-8'}, function(err, sassData) {
                    if (sassData)  {
                        sassData = fillInAux(sassData, dynaNode, renderQ);
                        sass.render( {
                            data: sassData,
                            includePaths: webView.sassBase,
                            success: function(css) {
                                var  cssClaz = webView.clazName  ?  '.' + webView.clazName : '';
                                if (typeof css !== 'string')
                                    css = css.css;
                                renderQ.addCSS( css, cssClaz );
                                callback();
                            },
                            error: function(err)  {
                                callback( err );
                            }
                            // includePath, outputStyle: 'compressed'
                        });
                    }
                    else
                        callback( err );
                });
            }
            else
                callback();
        }
    ], cb);
};


function  prepareDynaNode(rootPath, viewPath, files)  {
	var  dynaNode = {rootPath: rootPath, viewPath: viewPath};

    for (var i in files)  {
		var  fname = files[i],
			 idx = fname.indexOf('.'),
			 suffix = fname.substring(idx+1);
		//console.log('dyna file name: %s, suffix: %s', fname, suffix);

		switch (suffix)  {
			case  'html':
				dynaNode.html = viewPath + fname;
				break;
			case  'js':
				dynaNode.jsF = viewPath + fname;
				break;
			case  'css':
				dynaNode.cssF = viewPath + fname;
				break;
            case  'scss':
                dynaNode.sass = viewPath + fname;
                break;
			case  'inc':
				dynaNode.inc = viewPath + fname;
				break;
			case  'lang':
				dynaNode.lang = viewPath + fname;
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
			else  {
				if (exeCode.indexOf('includeJs(') === 0)
					renderQ.getIncJsItem();
				else  if (exeCode.indexOf('includeCss(') === 0)
					renderQ.getIncCssItem();
				else  if (exeCode.indexOf('js(') === 0)
					renderQ.getJsItem();
				else  if (exeCode.indexOf('css(') === 0)
					renderQ.getCssItem();
				else
					renderQ.add( {code: exeCode} );
				//	renderQ.addToLast( '\';' + exeCode );
			}
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
	//else
	//	tuple.html = html.replace(/'/g, "\\'").replace(/(\n|\r|\r\n)/g, "' + '\\n' + '");

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


// shallow clone is ok; no need for deep clone
function  cloneObj(obj)  {
	var  copy = {};
	for (var key in obj)
		if (obj.hasOwnProperty(key))
			copy[key] = obj[key];
	return  copy;
}


function  capitalize(s) {
    return s.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};
