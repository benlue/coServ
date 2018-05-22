/*!
 * jsonh: a JSON wrapper of HTML codes
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2018 Gocharm Inc.
 */
'use strict';

const  hasj = require('./hAsJs');

const  _ws = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ', '        '];

var  _idCount = 1;

class JSONH {
    constructor(tag, attributes, children, isSingleton, css) {
        this.isSingleton = isSingleton;
        this.t = tag;
        this.isUIC = false;
    
        if (attributes)
            this.a = hasj.clone(attributes);
    
        if (children)  {
            if (!Array.isArray(children))
                children = [children];

            for (let i in children)
                this.pushChild( children[i] );
        }

        if (css)
            this.css = css;
    }

    on(evName, handler)  {
        this.events = this.events || {};
        let  hArray = this.events[evName] || [];

        if (Array.isArray(handler))
            handler.forEach( h => {
                hArray.push( {handler: h} );
            });
        else
            hArray.push({handler: handler});

        this.events[evName] = hArray;

        // this element is registering events AFTER it has been added to the block tree
        if (this.parent)
            bubbleEvents(this.parent, this);

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
                node.a = hasj.clone(attributes);
        
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

    setAttribute(key, value)  {
        this.a = this.a || {};
        this.a[key] = value;
    }

    pushChild(c)  {
        if (this.c)
            this.c.push( c );
        else
            this.c = [c];

        if (c instanceof JSONH)
            c.parent = this;

        bubbleEvents(this, c);
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

        if (this.uicList)
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

        // this.uicList may be undefined which can be caused by syntax errors of child UICs
        if (this.uicList)
            this.uicList.forEach( uic => {
                jsCode += '\tlet  _' + uic.id + '=__._' + uic.id + ' = ' + uic.toJS(isReload) + '\n';   // so tag-events can be hooked up
                if (!isReload)
                    jsCode += '\tuic.addChild("' + uic.id + '", _' + uic.id + ');\n';

                if (uic.events)
                    regCode += registerChildHandler(uic);
            });

        if (this.events)
            regCode += registerTagHandler(this);

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
                /*
                if (node.id)  {
                    if (value.indexOf('ctrl.') === 0)
                        value = "__.getCtrl('" + node.id + "')" + value.substring(4);
                    else  if (value.indexOf('_me.') === 0)
                        value = "__._" + node.id + value.substring(3);
                }
                */

                if (typeof(value) == typeof(true))  {
                    if (value)
                        s+= ' ' + key;
                }
                else
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
        let  evtList = uic.events[evName];
        evtList.forEach( evt => {
            if (!evt.selector)
                jsCode += "\t_" + uic.id + ".on('" + evName + "', " + evt.handler + ");\n";
        });
    });
    
    return  jsCode;
}


function  registerTagHandler(uic)  {
    // register event handler on the child
    let  jsCode = '\n';
    Object.getOwnPropertyNames(uic.events).forEach( evName => {
        let  evtList = uic.events[evName];
        evtList.forEach( evt => {
            if (evt.selector)
                jsCode += "\tthis.find('" + evt.selector + "').on('" + evName + "', " + evt.handler + ");\n";
        });
    });
    
    return  jsCode;
}


function  bubbleEvents(parent, c)  {
    // bubble up event registration up to the UIC root
    if (!c.isUIC && !c.then && c.events)  {
        parent.events = parent.events || {};

        c.a = c.a || {};
        
        for (let evName in c.events)  {
            let  dstList = parent.events[evName] || [],
                 srclist = c.events[evName];

            srclist.forEach( e => {
                if (!e.selector)  {
                    if (!c.a.id)
                        c.a.id = '_xs_' + c.t + _idCount++;
                    e.selector = '#' + c.a.id;
                }
                dstList.push( e );
            });
            parent.events[evName] = dstList;
        }

        c.events = null;
    }

    if (!parent.isUIC && parent.parent)
        bubbleEvents(parent.parent, parent);
}


function  replacer(key, value)  {
    let  rtn = undefined;

    if (!(value instanceof JSONH))
        rtn = value;

    return  rtn;
}