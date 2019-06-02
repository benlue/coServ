/*!
 * hAsJs: convert JSON to HTML
 * authors: Ben Lue
 * Copyright(c) 2018 Gocharm Inc.
 */
const  config = require('../server/config.js'),
       JSONH = require('./jsonh'),
       CheckIn = require('./CheckIn'),
       siteCache = require('../server/SiteCache.js');

const  _ws = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ', '        '];


exports.in = CheckIn;

exports.systemConfig = function()  {
    return  config;
}


exports.lookupSite = function(appCode)  {
    let  site = siteCache.lookupByCode(appCode);
    return  site  ?  site.siteInfo : null;
}


exports.isJSONH = function(obj)  {
    return  obj instanceof JSONH;
}


exports.root = function(tag, css)  {
    let  rootTag = 'div',
         argCount = arguments.length;

    if (argCount === 1)  {
        if (typeof tag === 'string')
            rootTag = tag;
        else
            css = tag;
    }
    else  if (argCount === 2)
        rootTag = tag;

    return  exports.uic(rootTag, null, null, css);
}


/**
 * Create the root tag of a UIC.
 * 
 * @param {*} tag 
 * @param {*} attributes 
 * @param {*} children 
 * @param {*} css 
 * @deprecated This is deprecated in favor of xs.root()
 */
exports.uic = function(tag, attributes, children, css) {
    let  isSingleton = JSONH.isSingletonTag(tag);

    if (!isSingleton && arguments.length == 2)  {
        if (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof JSONH)  {
            children = attributes;
            attributes = null;
        }
    }

    let  n = new JSONH(tag, attributes, children);
    if (css)
        n.css = css;
    n.isUIC = true;
    return  n;
}


exports.e = function(tag, attributes, children)  {
    let  isSingleton = JSONH.isSingletonTag(tag);

    if (!isSingleton && arguments.length == 2)  {
        if (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof JSONH)  {
            children = attributes;
            attributes = null;
        }
    }

    return  new JSONH(tag, attributes, children);
}


/**
 * Build a JSON representation of a HTML tag
 * @param {*} tag 
 * @param {*} attributes 
 * @param {*} children 
 * @deprecated This is deprecated in favor of xs.e()
 */
exports.html = function(tag, attributes, children) {
    let  isSingleton = JSONH.isSingletonTag(tag);

    if (!isSingleton && arguments.length == 2)  {
        if (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof JSONH)  {
            children = attributes;
            attributes = null;
        }
    }

    return  new JSONH(tag, attributes, children);
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


exports.reportError = function(etype, msg)  {
    let  err;

    if (etype === 'params')
        err = exports.uic('div', {class: '_xsErr'}, 'xs: ' + msg);
    else
        err = exports.html('div', {class: '_xsErr'}, 'xs: ' + msg);

    return  err;
}


exports.isString = function(s)  {
    return  CheckIn.isString(s);
}


exports.isInteger = function(i)  {
    return  CheckIn.isInteger(i);
}


exports.isNumber = function(n)  {
    return  CheckIn.isNumber(n);
}


/**
 * This is the 'check date' function exposed to UIC
 * @param {*} format 
 */
exports.isDate = function(format, d)  {
    return  CheckIn.isDate(format, d);
}


exports.isArray = function(func, a)  {
    return  CheckIn.isArray(func, a);
}