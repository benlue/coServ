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

            this.c = children;
        }

        if (css)
            this.css = css;
    }

    on(evName, handler)  {
        this.events = this.events || {};
        this.events[evName] = handler;
        return  this;
    }

    add(tag, attributes, children)  {
        if (arguments.length == 2)  {
            if (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof JSONH)  {
                children = attributes;
                attributes = null;
            }
        }
        
        if (tag instanceof JSONH || tag.then)  {
            if (!tag.then && tag.isUIC)
                throw "Each UIC should have only one root.";

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
        if (tag.then)
            throw  'Do not nest on an UIC. Try add().';

        let  elm = hasj.childHtml(tag, attr);
        this.add( elm );

        return  elm;
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
                 pcss = prefix  ?  (prefix + ' ' + cssClass) : cssClass;
            cssStr += uic.toCSS( space, pcss );
        });

        return  cssStr;
    }


    toJS(parentID)  {
        if (!this.isUIC)
            return  '';

        let  cssID = this.id,
             js = '',
             regCode = '',
             jsCode = '';      // declare child-UICs as variables

        this.uicList.forEach( uic => {
            jsCode += '\tlet  _' + uic.id + '=' + uic.toJS(cssID) + '\n';
            //varCode += '\t' + uic.toJS(cssID) + '\n';

            if (uic.events)
                regCode += registerChildHandler(uic);
        });

        if (regCode)
            regCode = '\nuic.init = function() {' + regCode + '}';

        if (this.src)  {
            jsCode += this.src + '\n\nif (exports.makeCtrl)  {\n';

            if (this.params)  {
                jsCode += '\tlet params=' + JSON.stringify(this.params, replacer) + ',\n' +
                          '\t    pctrl={};\n' +
                          '\texports.makeCtrl(pctrl, params);\n';
            }
            else
                jsCode += '\tlet pctrl={};\n\texports.makeCtrl({pctrl});\n';
            jsCode += '\tuic.pack(pctrl);\n}\n';
        }

        jsCode += regCode;
        js += wrapJsCode(this.id, this.uicPath, parentID, jsCode);

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
                let  ws = leading + _ws[space],
                     node = this;
    
                hsObj.c.forEach( (child, idx) => {
                    if (typeof child === 'string')
                        s += child;
                    else  {
                        if (idx == 0 && space)
                            s += '\n';
                        s += (child instanceof JSONH && child.isUIC)  ?  child.toHTML(space) : node.toHTMLString(child, ws, space);
                        if (space)
                            s += '\n';
                    }
                });
            }
    
            s += '</' + tag + '>';
        }

        if (hsObj.uicPath)  {
            let  pre = leading + '<div id="' + hsObj.id + '"';
            if (hsObj.clazName)
                pre += ' class="' + hsObj.clazName + '"';
            s = pre + '>' + s + '</div>'
            if (space)
                s += '\n';
        }
        
        return  s;
    }


    toAttributes(attr)  {
        let  s = '',
             keys = Object.getOwnPropertyNames(attr),
             node = this;

        keys.forEach( key => {
            let  value = attr[key];

            if (value === null || value === undefined)
                // a tag attribute can be without a value
                s += ' ' + key;
            else  {
                if (value.indexOf('ctrl.') === 0 && node.id)
                    value = "__.getCtrl('" + node.id + "')" + value.substring(4);

                s += ' ' + key + '="' + value + '"';
            }
        });
    
        return  s;
    }
}

module.exports = JSONH;


function  wrapJsCode(id, uicPath, parentID, jsData)  {
    let  js = "(function(exports, require, importUIC)  {\n\tvar  uic = new __._uic('#" + id + "', '" + uicPath + "');\n";
    js += '\tuic.setParentID(' + (parentID ? "'" + parentID + "'" : 'null') + ');\n\n';
    /*
    if (parentID)
        js += "\tvar  _parent = '#" + parentID + "';\n\tctrl.getParent = function() {__.getCtrl(_parent);}\n\n";
    else
        js += "\tvar  _parent = null;\n\tctrl.getParent = function() {return null;}\n\n";
    */
    js += jsData + "\nreturn uic;\n})({}, __.dummy, __.dummy);\n";
    /*
    let  js = "(function(exports, require, importUIC)  {\n\tvar  ctrl = new _ctrl('#" + id + "', '" + uicPath + "');\n";
    if (parentID)
        js += "\tvar  _parent = '#" + parentID + "';\n\tctrl.getParent = function() {__.getCtrl(_parent);}\n";
    else
        js += "\tvar  _parent = null;\n\tctrl.getParent = function() {return null;}\n";
    js += jsData + "\nreturn ctrl;\n})({}, __.dummy, __.dummy);\n";
    */

    return  js;
}


function  registerChildHandler(uic)  {
    // register event handler on the child
    let  jsCode = '\n';
    Object.getOwnPropertyNames(uic.events).forEach( evName => {
        jsCode += "\t_" + uic.id + ".on('" + evName + "', " + uic.events[evName] + ");\n";
    });
    /*
    Object.getOwnPropertyNames(uic.events).forEach( evName => {
        jsCode += "\t__.getCtrl('" + uic.id + "').on('" + evName + "', " + uic.events[evName] + ");\n";
    });
    */
    
    return  jsCode;
}


function  replacer(key, value)  {
    let  rtn = undefined;

    if (!(value instanceof JSONH))
        rtn = value;

    return  rtn;
}