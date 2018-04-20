/*!
 * hAsJs: convert JSON to HTML
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */
const  blkUtil = require('../util/blockUtil'),
       jsonH = require('./jsonh');

const  _ws = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ', '        '];


/**
 * Build a JSON representation of a HTML tag
 * @param {*} tag 
 * @param {*} attributes 
 * @param {*} children 
 */
exports.html = function(tag, attributes, children, css) {
    let  isSingleton = exports.isSingletonTag(tag);

    if (!isSingleton && arguments.length == 2)  {
        children = attributes;
        attributes = null;
    }

    return  new jsonH(tag, attributes, children, isSingleton, css, true);
}


exports.childHtml = function(tag, attributes) {
    return  new jsonH(tag, attributes, null, false, null, false);
}


exports.clone = function(obj)  {
    let  no = {};
    Object.getOwnPropertyNames(obj).forEach( key => {
        no[key] = obj[key];
    });
    return  no;
}


exports.reportError = function(etype, msg)  {
    let  err;
    if (etype === 'params')
        err = exports.html('div', {class: '_xsErr'}, 'xs: ' + msg);
    else
        err = exports.html('div', {class: '_xsErr'}, 'xs: ' + msg);

    return  err;
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
            if (selector === '.')
                selector = '';

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