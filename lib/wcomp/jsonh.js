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
        this.isUIC = false;
    
        if (attributes)
            this.a = attributes;
    
        if (children)  {
            if (!Array.isArray(children))
                children = [children];

            // build up the UIC component tree
            children.forEach( c => {
                if (c instanceof JSONH)  {
                    //this.uicList.push( c );
                    c.parent = this;
                }
            });

            this.c = children;
        }

        if (css)
            this.css = css;
    }

    setAsUIC()  {
        this.isUIC = true;
        makeUICTree(this);
    }

    on(evName, handler)  {
        this.events = this.events || {};
        this.events[evName] = handler;
        return  this;
    }

    add(tag, attributes, children)  {
        if (tag instanceof JSONH)  {
            tag.parent = this;      // this is needed so the parent-chain won't be broken.
            /*
            if (tag.isUIC)  {
                if (this.isUIC)
                    this.uicList.push( tag );
                else  {
                    let  uic = this;
                    do  {
                        uic = uic.parent;
                    }
                    while (uic && !uic.isUIC);

                    if (uic)
                        uic.uicList.push( tag );
                }
            }
            */
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

    nest(tag, attr)  {
        let  elm = hasj.childHtml(tag, attr);
        this.add( elm );

        return  elm;
    }

    parent()  {
        return  this.parent;
    }

    pushChild(c)  {
        if (this.c)
            this.c.push( c );
        else
            this.c = [c];
    }


    toHTML(space)  {
        space = space  ?  Math.min(Math.max(space, 0), 8) : 0;
        return  this.toHTMLString(this, '', space);
    }


    toCSS(space, prefix)  {
        if (!this.isUIC)
            return  '';

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
        if (!this.isUIC)
            return  '';

        let  cssID = this.id,
             js = '',
             regCode = '';

        this.uicList.forEach( uic => {
            js += uic.toJS( cssID );

            if (uic.events)
                regCode += registerChildHandler(uic);
        });

        if (this.src)  {
            let  jsCode = this.src + '\nif (exports.makeCtrl)  {\n';
            if (this.params)  {
                jsCode += '\tlet params=' + JSON.stringify(this.params, replacer) +
                          ';\n\texports.makeCtrl(params);}\n';
            }
            else
                jsCode += '\texports.makeCtrl({});}\n';
            jsCode += regCode;

            js += wrapJsCode(this.id, this.uicPath, parentID, jsCode);
        }
        else  if (regCode)
            js += wrapJsCode(this.id, this.uicPath, parentID, regCode);

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
                        s += (child instanceof JSONH && child.isUIC)  ? child.toHTML(space) : this.toHTMLString(child, ws, space);
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


/**
 * A recursive fucntion to rebuild the UIC tree
 * 
 * @param {*} uic 
 */
function  makeUICTree(uic)  {
    if (uic.isUIC)
        uic.uicList = [];

    if (uic.c)
        uic.c.forEach( c => {
            if (c instanceof JSONH)  {
                if (c.isUIC)
                    uic.uicList.push( c );
                makeUICTree( c );
            }
        });
}


function  wrapJsCode(id, uicPath, parentID, jsData)  {
    let  js = "(function(exports, require, importUIC)  {\n\tvar  ctrl = new _ctrl('#" + id + "', '" + uicPath + "');\n";
    if (parentID)
        js += "\tvar  _parent = '#" + parentID + "';\n\tctrl.getParent = function() {__.getCtrl(_parent);}\n";
    else
        js += "\tvar  _parent = null;\n\tctrl.getParent = function() {return null;}\n";
    js += jsData + "\nreturn ctrl;\n})({}, __.dummy, __.dummy);\n";

    return  js;
}


function  registerChildHandler(uic)  {
    // register event handler on the child
    let  jsCode = '\n';
    Object.getOwnPropertyNames(uic.events).forEach( evName => {
        jsCode += "__.getCtrl('" + uic.id + "').on('" + evName + "', " + uic.events[evName] + ");\n";
    });
    
    return  jsCode;
}


function  replacer(key, value)  {
    let  rtn = undefined;

    if (!(value instanceof JSONH))
        rtn = value;

    return  rtn;
}