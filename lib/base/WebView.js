/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  fs = require('fs'),
	 url = require('url'),
	 path = require('path'),
	 xml2js = require('xml2js'),
	 RenderQ = require('./RenderQ.js');

var  _viewAutoID = 1;

var  WebView = (function()  {

	var  WebView = function WebView(pathObj, renderQ)  {
		this.rootPath = pathObj.rootPath;
		this.viewPath = pathObj.path + '/';
		this.renderQ = renderQ;

		this.clazName = '';
		if (renderQ.parentQ || !renderQ.srvObj.isPage)  {
			//var  paths = pathObj.opPath.split(path.sep);
			var  paths = pathObj.opPath.split('/');
			for (var i = 0, len = paths.length; i < len; i++)
				this.clazName += capitalize(paths[i]);
			renderQ.setClazName( this.clazName );
		}

		// isMain: the main block of a page
		this.compose = function compose(isMain)  {
			var  rootPath = this.rootPath,
				 viewPath = this.viewPath,
				 renderQ = this.renderQ,
				 webView = this;

			fs.readdir( viewPath, function(err, files) {
				if (err === null)  {
					var  dynaNode = prepareDynaNode( rootPath, viewPath, files );
					dynaNode.isMain = isMain;
					dynaNode.locale = renderQ.getLocale();	//renderQ.getSite().locale;

					webView.composeView( dynaNode );
					renderQ.seal();
				}
				else
					renderQ.add( err.message );
			});

			return  this;
		};
	};

	WebView.prototype.composeView = function composeView(dynaNode)  {
		var  renderQ = this.renderQ;
		dynaNode.html = fs.readFileSync( dynaNode.html, {encoding: 'utf-8'} );
		var  cssID = renderQ.getCssID() || genAutoID();
		dynaNode.cssID = cssID;

		if (!renderQ.asPage())
			// not the whole page, make it a web component (like)
			dynaNode.html = '<style type="text/css">\n<% css(); %>\n</style>\n' +
							'<script type="text/javascript">\n<% js(); %>\n</script>\n' +
							'<div id="' + cssID + '" class="' + this.clazName + '">' + dynaNode.html + '</div>';
		else  if (dynaNode.isMain)
			// this is an embedded block, also the main block of a page
			dynaNode.html = '<div id="_mainC">\n<div id="' + cssID + '" class="' + this.clazName + '">' + dynaNode.html + '</div>\n</div>';
		else  if (renderQ.parentQ)
			// this is an embedded block.
			dynaNode.html = '<div id="' + cssID + '" class="' + this.clazName + '">' + dynaNode.html + '</div>';

		if (dynaNode.lang)  {
			// dealing with multi-lingual issues
			var  xmlData = fs.readFileSync( dynaNode.lang, {encoding: 'UTF-8'} ),
				 parser = new xml2js.Parser(),
				 locale = dynaNode.locale;

			parser.parseString( xmlData, function(err, result) {
				if (!err)  {
					var  phrase = result.phrases.ph,
						 phrases = {};
					if (phrase)  {
						for (var i = 0, len = phrase.length; i < len; i++)
							phrases[phrase[i]['$'].id] = phrase[i][locale][0];
					}

					renderQ.phrases = dynaNode.phrases = phrases;
				}
			});
		}

		if (dynaNode.inc)
			try  {
				renderQ.addInc( fs.readFileSync( dynaNode.inc, {encoding: 'UTF-8'}) );
			}
			catch (e) {}

		if (dynaNode.jsF)
			try  {
				var  opURL = getRsOpPath(this.viewPath),
					 js = '(function()  {\n\tvar  ctrl = new _ctrl(\'#' + cssID + '\', \'' + opURL + '\');\n' +
						  fs.readFileSync( dynaNode.jsF, {encoding: 'UTF-8'}) +
						  '\nreturn ctrl;\n})();';
				js = fillInAux( js, dynaNode, renderQ );
				renderQ.addJS( js );
			}
			catch (e) {}

		if (dynaNode.cssF)
			try  {
				var  css = fs.readFileSync( dynaNode.cssF, {encoding: 'UTF-8'}),
                     cssClaz = this.clazName.length > 0  ?  '.' + this.clazName : '';

				css = fillInAux(css, dynaNode, renderQ);
				renderQ.addCSS( css, cssClaz );
			}
			catch (e) {}

		renderQ.dynaNode = dynaNode;
		fillInHTML(dynaNode, renderQ);
	};

	return  WebView;
})();

module.exports = WebView;


function  prepareDynaNode(rootPath, viewPath, files)  {
	var  dynaNode = {rootPath: rootPath, viewPath: viewPath};

	for (var i = 0, len = files.length; i < len; i++)  {
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
				var  varName = exeCode.substring(1).trim();
                str += 'html += ' + varName + ';';
			}
			else
				str += exeCode;
		}
	}
	return  str  ?  renderQ.evalStr(str, vars) : '';
};


function  fillInHTML(dynaNode, renderQ) {
	var  s = dynaNode.html,
		 viewPath = dynaNode.viewPath;

	while (s.length > 0)  {
		var  tuple = getTuple( s );
		s = tuple.s;
		renderQ.add( tuple.html );

		if (tuple.exeCode)  {
			var  exeCode = tuple.exeCode;
			if (exeCode[0] === '=')  {
				var  varName = exeCode.substring(1).trim();
				if (varName === 'ctrl')
					renderQ.add('_wf.getCtrl(\'' + dynaNode.cssID + '\')');
				else
					renderQ.add( {value: varName} );
			}
			else  {
				if (exeCode.indexOf('block(') === 0)
					renderQ.evalStr(exeCode);
				else  if (exeCode.indexOf('region(') === 0)
					renderQ.evalStr(exeCode);
				else  if (exeCode.indexOf('includeJs(') === 0)
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


function  getRsOpPath(vpath)  {
	if (path.sep === '\\')
		vpath = vpath.replace(/\\/g, '/');

	var  len = vpath.length,
		 idx = vpath.lastIndexOf('/', len-2);		// WebView.viewPath has a trailing '/'
	idx = vpath.lastIndexOf('/', idx-1);
	return  vpath.substring(idx, len-1);
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
