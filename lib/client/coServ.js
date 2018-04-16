(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.xs = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
 * blockUtil: block utilities
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */

exports.pathToClazName = function(blkPath)  {
    // deal with windows
    blkPath = blkPath.replace(/\\/gi, '');

    let  clazName = '',
         paths = blkPath.split('/');

    paths.forEach( p => clazName += capitalize(p) );
    //console.log('path vs class-name: %s, %s', blkPath, clazName);
    return  clazName;
}


function  capitalize(s) {
    return s.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};
},{}],2:[function(require,module,exports){
/*!
 * hAsJs: convert JSON to HTML
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */
'use strict';


class BlockCtrl {
    constructor(cssTarget, endpoint)  {
        this.target = cssTarget;
        this.opURI = endpoint;
    }

    startup()  {

    }
}

module.exports = BlockCtrl;
},{}],3:[function(require,module,exports){
/*!
 * hAsJs: convert JSON to HTML
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */
const  blkUtil = require('../util/blockUtil'),
       BlockCtrl = require('./BlockCtrl'),
       jsonH = require('./jsonh');

const  _ws = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ', '        '];

exports.createCtrl = function(cssTarget, endpoint)  {
    return  new BlockCtrl(cssTarget, endpoint);
}


/**
 * Build a JSON representation of a HTML tag
 * @param {*} tag 
 * @param {*} attributes 
 * @param {*} children 
 */
exports.html = function(tag, attributes, children) {
    let  isSingleton = exports.isSingletonTag(tag);

    if (!isSingleton && arguments.length == 2)  {
        children = attributes;
        attributes = null;
    }

    return  new jsonH(tag, attributes, children, isSingleton);
}


/**
 * convert the JSON representation to a HTML string.
 * @param {*} hsObj 
 * @param {*} space 
 */
exports.toHTML = function(hsObj, space)  {
    space = space  ?  Math.min(Math.max(space, 0), 8) : 0;
    return  toHTMLString(hsObj, '', space);
}


exports.toCSS = function(rules, space, prefix)  {
    let  s = '';

    if (rules)  {
        let  keys = Object.getOwnPropertyNames(rules);

        keys.forEach( key => {
            let  selector = prefix  ?  prefixSelector(prefix, key) : key;

            s += selector + ' {';
            if (space)
                s += '\n';
            s += exports.toCSSProperties( rules[key], space ) + '}';
            if (space)
                s += '\n';
        });
    }

    return  s;
}


function  prefixSelector(prefix, key)  {
    let  sel = '',
         selectors = key.split(',');
    prefix += ' ';

    selectors.forEach( (s, idx) => {
        if (idx)
            sel += ', ';
        sel += prefix + (s == '.'  ?  '' : s);
    });

    return  sel;
}


exports.toCSSProperties = function(cssp, space)  {
    let  keys = Object.getOwnPropertyNames(cssp),
         s = '';

    space = space  ?  Math.min(Math.max(0, space), 8) : 0;
    let  ws = _ws[space];

    keys.forEach( key => {
        s += ws + key + ': ' + cssp[key] + ';';
        if (space)
            s += '\n';
    });

    return  s;
}


exports.block = function(id, url, params, options)  {
    /*
    let  blkRoot = '../../www/admin/themes/admin/blocks/hajs',
         clazName = blkUtil.pathToClazName(url),
         bkOp = require(blkRoot + url),
         elm = bkOp.html;
    */
    let  blkRoot = '../../www/admin/themes/admin/blocks/hajs',
         clazName = blkUtil.pathToClazName(url),
         //bkOp = require(blkRoot + url),
         elm = html('p', 'Hello World!');

    let  attrs = {
             id: id,
             class: clazName
         },
         bk = exports.html('div', attrs, elm);
    return  bk;
}


/*
function  toHTMLString(hsObj, leading, space)  {
    let  tag = hsObj.t,
         s = leading + '<' + tag;

    if (hsObj.a)
        s += toAttributes( hsObj.a );
    s += '>';

    if (!hsObj.isSingleton)  {
        if (hsObj.c)  {
            let  ws = leading + _ws[space];

            hsObj.c.forEach( (child, idx) => {
                if (typeof child === 'string')
                    s += child;
                else  {
                    if (idx == 0 && space)
                        s += '\n';
                    s += toHTMLString(child, ws, space);
                    if (space)
                        s += '\n';
                }
            });
        }

        s += '</' + tag + '>';
    }
    
    return  s;
}


function  toAttributes(attr)  {
    let  s = '',
         keys = Object.getOwnPropertyNames(attr);
    keys.forEach( key => {
        s += ' ' + key + '="' + attr[key] + '"';
    });

    return  s;
}
*/


exports.isSingletonTag = function(tag)  {
    return  tag === 'hr' || tag === 'br' || tag === 'img' || tag === 'input' || tag === 'base' || 
            tag === 'embed' || tag === 'meta';
}
},{"../util/blockUtil":1,"./BlockCtrl":2,"./jsonh":4}],4:[function(require,module,exports){
/*!
 * hAsJs: convert JSON to HTML
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */
'use strict';

const  hasj = require('./hAsJs');

const  _ws = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ', '        '];

class JSONH {
    constructor(tag, attributes, children, isSingleton) {
        this.isSingleton = isSingleton;
        this.t = tag;
    
        if (isSingleton)
            this.isSingleton = true;
    
        if (attributes)
            this.a = attributes;
    
        if (children)  {
            if (!Array.isArray(children))
                children = [children];
            this.c = children;
        }
    }

    add(tag, attributes, children)  {
        let  isSingleton = hasj.isSingletonTag(tag),
             elm = hasj.html(tag, attributes, children, isSingleton);

        if (this.c)
            this.c.push( elm );
        else
            this.c = [elm];

        return  this;
    }

    addText(s)  {
        if (this.c)
            this.c.push( s );
        else
            this.c = [s];

        return  this;
    }

    toHTML(space, cssID)  {
        if (cssID)
            this.cssID = cssID;

        space = space  ?  Math.min(Math.max(space, 0), 8) : 0;
        return  this.toHTMLString(this, '', space);
    }


    toHTMLString(hsObj, leading, space)  {
        let  tag = hsObj.t,
             s = leading + '<' + tag;
    
        if (hsObj.a)
            s += this.toAttributes( hsObj.a );
        s += '>';
    
        if (!hsObj.isSingleton)  {
            if (hsObj.c)  {
                let  ws = leading + _ws[space];
    
                hsObj.c.forEach( (child, idx) => {
                    if (typeof child === 'string')
                        s += child;
                    else  {
                        if (idx == 0 && space)
                            s += '\n';
                        s += this.toHTMLString(child, ws, space);
                        if (space)
                            s += '\n';
                    }
                });
            }
    
            s += '</' + tag + '>';
        }
        
        return  s;
    }


    toAttributes(attr)  {
        let  s = '',
             keys = Object.getOwnPropertyNames(attr);
        keys.forEach( key => {
            let  value = attr[key];
            if (value.indexOf('ctrl.') === 0)
                value = "__.getCtrl('" + this.cssID + "')" + value.substring(4);

            s += ' ' + key + '="' + value + '"';
        });
    
        return  s;
    }
}

module.exports = JSONH;


/*
function  toHTMLString(hsObj, leading, space)  {
    let  tag = hsObj.t,
         s = leading + '<' + tag;

    if (hsObj.a)
        s += toAttributes( hsObj.a );
    s += '>';

    if (!hsObj.isSingleton)  {
        if (hsObj.c)  {
            let  ws = leading + _ws[space];

            hsObj.c.forEach( (child, idx) => {
                if (typeof child === 'string')
                    s += child;
                else  {
                    if (idx == 0 && space)
                        s += '\n';
                    s += toHTMLString(child, ws, space);
                    if (space)
                        s += '\n';
                }
            });
        }

        s += '</' + tag + '>';
    }
    
    return  s;
}


function  toAttributes(attr)  {
    let  s = '',
         keys = Object.getOwnPropertyNames(attr);
    keys.forEach( key => {
        s += ' ' + key + '="' + attr[key] + '"';
    });

    return  s;
}
*/
},{"./hAsJs":3}]},{},[3])(3)
});
