/*!
 * hAsJs: convert JSON to HTML
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2018 Gocharm Inc.
 */
const  jsonH = require('./jsonh');

const  _ws = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ', '        '];


exports.in = require('./CheckIn');


/**
 * Create the root tag of a UIC.
 * 
 * @param {*} tag 
 * @param {*} attributes 
 * @param {*} children 
 * @param {*} css 
 */
exports.uic = function(tag, attributes, children, css) {
    let  isSingleton = exports.isSingletonTag(tag);

    if (!isSingleton && arguments.length == 2)  {
        if (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof jsonH)  {
            children = attributes;
            attributes = null;
        }
    }

    let  n = new jsonH(tag, attributes, children, isSingleton, css);
    n.isUIC = true;
    return  n;
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
        if (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof jsonH)  {
            children = attributes;
            attributes = null;
        }
    }

    return  new jsonH(tag, attributes, children, isSingleton, null);
}


exports.childHtml = function(tag, attributes) {
    return  new jsonH(tag, attributes, null, false, null, false);
}


exports.on = function(node, evName, fun)  {
    if (node.then)  {
        // could be on multiple events, so let's queue them in an array
        if (node.events)
            node.events.push({evName: evName, fun: fun});    
        else  {
            node.events = [];
            node.events.push({evName: evName, fun: fun});

            node.then( n => {
                node.events.forEach( ev => {
                    n.on(ev.evName, ev.fun);
                });
            });
        }

        return  node;
    }
    else
        return  node.on(evName, fun);
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
        err = exports.uic('div', {class: '_xsErr'}, 'xs: ' + msg);
    else
        err = exports.uic('div', {class: '_xsErr'}, 'xs: ' + msg);

    return  err;
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


exports.isSingletonTag = function(tag)  {
    return  tag === 'hr' || tag === 'br' || tag === 'img' || tag === 'input' || tag === 'base' || 
            tag === 'embed' || tag === 'meta';
}