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


    /**
     * 
     * @param {*} isPage if we're generating the JS code for the whole page or just for a fragment
     */
    toJS(isReload)  {
        if (!this.isUIC)
            return  '';

        let  id = this.id,
             endpoint = this.endpoint;

        let  js = "(function(exports, require, importUIC)  {\n";

        if (isReload)
            js += "\let  uic = __._" + id + ';\n';
        else
            js += "\let  uic = new __._uic('" + id + "', '" + endpoint + "');\n";
    
        js += this.genJsCode(isReload) + "\nreturn uic;\n})({}, __.dummy, __.dummy);\n";
    
        return  js;
    }


    genJsCode(isReload)  {
        let  cssID = this.id,
             regCode = '',
             jsCode = '';      // declare child-UICs as variables

        this.uicList.forEach( uic => {
            jsCode += '\tlet  _' + uic.id + '=__._' + uic.id + ' = ' + uic.toJS(isReload) + '\n';   // so tag-events can be hooked up
            if (!isReload)
                jsCode += '\tuic.addChild("' + uic.id + '", _' + uic.id + ');\n';

            //if (!isReload && uic.events)
            if (uic.events)
                regCode += registerChildHandler(uic);
        });

        if (this.src)  {
            let  makeCtrl = isReload  ?  'uic.makeCtrl' : 'exports.makeCtrl';

            if (isReload)
                jsCode += '\nif (uic.makeCtrl) {\n';
            else
                jsCode += this.src + '\n\nif (exports.makeCtrl)  {\n';
                

            if (this.srcLength > 1 && this.params)  {
                // the makeCtrl() function is expecting parameters...
                jsCode += '\tlet params=' + JSON.stringify(this.params, replacer) + ',\n' +
                          '\t    pctrl={};\n' +
                          '\t' + makeCtrl + '(pctrl, params);\n';
            }
            else
                jsCode += '\tlet pctrl={};\n\t' + makeCtrl + '(pctrl);\n';
            if (!isReload)
                jsCode += '\tuic.makeCtrl=exports.makeCtrl;\n';
            jsCode += '\tuic.pack(pctrl);\n}\n';
        }

        if (this.ctx)
            jsCode += '\nuic.setContext(' + JSON.stringify(this.ctx) + ');\n';

        /*
        if (isReload)
            jsCode += '\nuic.init = undefined;';
        else  if (regCode)
        */
            jsCode += '\nuic.init = function() {\n\tthis._init();\n' + regCode + '}';
        return  jsCode;
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

        if (hsObj.endpoint)  {
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
                if (node.id)  {
                    if (value.indexOf('ctrl.') === 0)
                        value = "__.getCtrl('" + node.id + "')" + value.substring(4);
                    else  if (value.indexOf('_me.') === 0)
                        value = "__._" + node.id + value.substring(3);
                }

                s += ' ' + key + '="' + value + '"';
            }
        });
    
        return  s;
    }
}

module.exports = JSONH;


function  registerChildHandler(uic)  {
    // register event handler on the child
    let  jsCode = '\n';
    Object.getOwnPropertyNames(uic.events).forEach( evName => {
        jsCode += "\t_" + uic.id + ".on('" + evName + "', " + uic.events[evName] + ");\n";
    });
    
    return  jsCode;
}


function  replacer(key, value)  {
    let  rtn = undefined;

    if (!(value instanceof JSONH))
        rtn = value;

    return  rtn;
}