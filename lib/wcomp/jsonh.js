/*!
 * jsonh: a JSON wrapper of HTML codes
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2018 Gocharm Inc.
 */
'use strict';

const  hasj = require('./hAsJs');

const  _ws = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ', '        '];

class JSONH {
    constructor(tag, attributes, children, isSingleton, css) {
        this.isSingleton = isSingleton;
        this.t = tag;
        this.uicList = [];
    
        if (attributes)
            this.a = attributes;
    
        if (children)  {
            if (!Array.isArray(children))
                children = [children];

            // build up the UIC component tree
            children.forEach( c => {
                if (c instanceof JSONH)  {
                    this.uicList.push( c );
                    c.parent = this;
                }
            });

            this.c = children;
        }

        if (css)
            this.css = css;
    }

    add(tag, attributes, children)  {
        if (tag instanceof JSONH)  {
            // this is a UIC module
            tag.parent = this;
            this.uicList.push( tag );
            this.pushChild( tag );
        }
        else  {
            let  node = {
                    isSingleton: hasj.isSingletonTag(tag),
                    t: tag
                 };

            if (attributes)
                node.a = attributes;
        
            if (children)  {
                if (!Array.isArray(children))
                    children = [children];
                node.c = children;
            }

            this.pushChild( node );
        }

        return  this;
    }

    addText(s)  {
        this.pushChild(s);
        return  this;
    }

    pushChild(c)  {
        if (this.c)
            this.c.push( c );
        else
            this.c = [c];
    }


    toHTML(space, cssID)  {
        space = space  ?  Math.min(Math.max(space, 0), 8) : 0;
        return  this.toHTMLString(this, '', space);
    }


    toCSS(space, prefix)  {
        let  cssStr = this.css  ?  hasj.toCSS(this.css, space, prefix) : '';
        space = space || 0;

        this.uicList.forEach( uic => {
            let  cssClass = '.' + uic.clazName,
                 pcss = prefix  ?  (prfix + ' ' + cssClass) : cssClass;
            cssStr += uic.toCSS( space, pcss );
        });

        return  cssStr;
    }


    toJS(parentID)  {
        let  cssID = this.id,
             js = this.src  ?  wrapJsCode(this.id, this.uicPath, parentID, this.src) : '';

        this.uicList.forEach( uic => {
            js += uic.toJS( cssID );
        });

        return  js;
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

        if (hsObj.uicPath)  {
            let  pre = '<div id="' + hsObj.id + '"';
            if (hsObj.clazName)
                pre += ' class="' + hsObj.clazName + '"';
            s = pre + '>' + s + '</div>'
        }
        
        return  s;
    }


    toAttributes(attr)  {
        let  s = '',
             keys = Object.getOwnPropertyNames(attr);
        keys.forEach( key => {
            let  value = attr[key];
            if (value.indexOf('ctrl.') === 0 && this.id)
                value = "__.getCtrl('" + this.id + "')" + value.substring(4);

            s += ' ' + key + '="' + value + '"';
        });
    
        return  s;
    }
}

module.exports = JSONH;


function  wrapJsCode(id, uicPath, parentID, jsData)  {
    let  js = "(function(exports, require)  {\n\tvar  ctrl = new _ctrl('#" + id + "', '" + uicPath + "');\n";
    if (parentID)
        js += "\tvar  _parent = '#" + parentID + "';\n\tctrl.getParent = function() {__.getCtrl(_parent);}\n";
    else
        js += "\tvar  _parent = null;\n\tctrl.getParent = function() {return null;}\n";
    js += jsData + "\nreturn ctrl;\n})({}, __.require);";

    return  js;
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