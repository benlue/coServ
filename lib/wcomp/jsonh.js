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
        if (arguments.length === 1 && (typeof tag === 'object'))  {
            // this is a UIC module
            this.pushChild( tag );
        }
        else  {
            let  isSingleton = hasj.isSingletonTag(tag),
                elm = hasj.html(tag, attributes, children, isSingleton);

            this.pushChild( elm );
        }
        
        return  this;
    }

    addText(s)  {
        this.pushChild(s);
        return  this;
    }

    pushChild(c)  {
        if (this.c)
            this.c.push( s );
        else
            this.c = [s];
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