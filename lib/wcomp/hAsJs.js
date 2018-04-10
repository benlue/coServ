/*!
 * hAsJs: convert JSON to HTML
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */

const  _ws = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ', '        '];

/**
 * Build a JSON representation of a HTML tag
 * @param {*} tag 
 * @param {*} attributes 
 * @param {*} children 
 */
exports.html = function(tag, attributes, children) {
    let  isSingleton = isSingletonTag(tag),
         elm = {t: tag};

    if (isSingleton)
        elm.isSingleton = true;
    else  if (arguments.length == 2)  {
        children = attributes;
        attributes = null;
    }

    if (attributes)
        elm.a = attributes;

    if (children)  {
        if (!Array.isArray(children))
            children = [children];
        elm.c = children;
    }

    return  elm;
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


exports.toCSS = function(rules, space)  {
    let  keys = Object.getOwnPropertyNames(rules),
         s = '';

    keys.forEach( key => {
        s += key + ' {';
        if (space)
            s += '\n';
        s += exports.toCSSProperties( rules[key], space ) + '}';
        if (space)
            s += '\n';
    });

    return  s;
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
    //var  classAttr = renderQ.getClazName()  ?  ' class="' + renderQ.getClazName() + '"' : '';
    let  s = '<div id="' + id + '" ' + classAttr + '>' + html + '</div>';
    return  exports.html('p', 'Hello World!');
}


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


function  isSingletonTag(tag)  {
    return  tag === 'hr' || tag === 'br' || tag === 'img' || tag === 'input' || tag === 'base' || 
            tag === 'embed' || tag === 'meta';
}