/*!
 * jsonh: a JSON wrapper of HTML codes
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2018 ~ 2019 Gocharm Inc.
 */
'use strict';

const  _ = require('lodash'),
       xpath = require('./xpath');

const  _wsStr = '                                ';

var  _idCount = 1;

class JHArray extends Array {

    constructor(a)  {
        super();

        for (let i = 0, len = a.length; i < len; i++)
            this.push( a[i] );
    }

    add(tag, attributes, children)  {
        if (arguments.length == 2)  {
            if (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof JSONH)  {
                children = attributes;
                attributes = null;
            }
        }

        for (let i = 0, len = this.length; i < len; i++)
            this[i].add( tag, attributes, children );

        return  this;
    }

    prepend(tag, attributes, children)  {
        if (arguments.length == 2)  {
            if (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof JSONH)  {
                children = attributes;
                attributes = null;
            }
        }

        for (let i = 0, len = this.length; i < len; i++)
            this[i].prepend( tag, attributes, children );

        return  this;
    }

    attr(key, value)  {
        let  len = this.length;

        if (arguments.length === 1)  {
            // this is to read attributes
            if (len === 1)
                return  this[0].attr(key);
            else  {
                let  values = new Array(len);
                for (let i = 0; i < len; i++)
                    values.push( this[i].attr(key) );
                return  values;
            }
        }

        if (arguments.length === 2)  {
            // this is to set attributes
            for (let i = 0; i < len; i++)
                this[i].attr(key, value);
        }
        return  this;
    }

    find(selector)  {
        let  found = [];
        for (let i = 0, len = this.length; i < len; i++)
            found = found.concat( this[i].find(selector) );

        return  new JHArray(found);
    }

    on(evName, handler)  {
        for (let i = 0, len = this.length; i < len; i++)
            this[i].on( evName, handler );
        return  this;
    }

    addClass(claz)  {
        for (let i = 0, len = this.length; i < len; i++)
            this[i].addClass(claz);
        return  this;
    }

    removeClass(claz)  {
        for (let i = 0, len = this.length; i < len; i++)
            this[i].removeClass(claz);
        return  this;
    }
}


class JSONH {

    constructor(tag, attributes, children) {
        let  isSingleton = isTagSingleton(tag);

        this.isSingleton = isSingleton;
        this.t = tag;
        this.isUIC = false;
    
        if (attributes)  {
            if (typeof attributes === 'string')
                this.a = stringToAttr(attributes);
            else
                this.a = clone(attributes);
        }

        if (children && !isSingleton)  {
            children = normalizeChildren(children);

            for (let i = 0, len = children.length; i < len; i++)  {
                let  c = children[i];
                // children[i] could be null, if there are syntax errors in .xs file
                if (c)  {
                    if (Array.isArray(c))
                        c = makeAChild(c);

                    this.pushChild( c );
                }
            }
        }
    }

    static  isSingletonTag(tag)  {
        return  isTagSingleton(tag);
    }

    add(tag, attributes, children)  {
        if (this.isSingleton || (arguments.length == 1 && !tag))
            // nothing to do!
            return  this;

        if (arguments.length == 2)  {
            if (!isTagSingleton(tag) && 
                (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof JSONH))  {
                children = attributes;
                attributes = null;
            }
        }
        
        this.addChild(tag, attributes, children, true);
        return  this;
    }

    prepend(tag, attributes, children)  {
        if (arguments.length == 1 && !tag)
            // nothing to do!
            return  this;

        if (arguments.length == 2)  {
            if (!isTagSingleton(tag) && 
                (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof JSONH))  {
                children = attributes;
                attributes = null;
            }
        }
        
        this.addChild(tag, attributes, children, false);
        return  this;
    }

    addChild(tag, attributes, children, isAppend)  {
        if (tag instanceof JSONH || tag.then)  {
            if (isAppend)
                this.pushChild( tag );
            else
                this.prependChild( tag );
        }
        else  {
            let  node = new JSONH(tag, attributes, children);

            if (isAppend)
                this.pushChild( node );
            else
                this.prependChild( node );
        }

        return  this;
    }

    addIf(cond, tag, attributes, children)  {
        if (cond && !this.isSingleton)  {
            if (arguments.length == 3)  {
                if (!isTagSingleton(tag) && 
                    (typeof attributes == 'string' || Array.isArray(attributes) || attributes instanceof JSONH))  {
                    children = attributes;
                    attributes = null;
                }
            }
            return  this.add(tag, attributes, children);
        }
        else
            return  this;
    }

    addText(s)  {
        if (!this.isSingleton)
            this.pushChild(s);
        return  this;
    }

    nest(tag, attr)  {
        if (tag.then)
            throw  'Do not nest on an UIC. Try add().';

        let  elm = new JSONH(tag, attr, null);
        this.add( elm );

        return  elm;
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

        // this element is registering events AFTER it has been added to the palet tree
        if (this.parent)
            bubbleEvents(this.parent, this);

        return  this;
    }

    find(selector)  {
        let  found = [];

        if (selector && this.c)
            found = xpath.find(selector, this.c);

        return  new JHArray(found);
    }

    attr(key, value)  {
        if (arguments.length === 1)
            return  this.a  ?  this.a[key] : undefined;
            
        this.a = this.a || {};
        this.a[key] = value;
        return  this;
    }

    addClass(claz)  {
        this.a = this.a || {};

        let  clazes = this.a.class;
        if (clazes)  {
            let  cs = clazes.split(' ');
            if (cs.indexOf(claz) < 0)
                clazes += ' ' + claz;
        }
        else
            clazes = claz;

        this.a.class = clazes;
        return  this;
    }

    removeClass(claz)  {
        this.a = this.a || {};

        let  clazes = this.a.class;
        if (clazes)  {
            let  cs = clazes.split(' '),
                 idx = cs.indexOf(claz);

            if (idx >= 0)
                cs.splice(idx, 1);
            this.a.class = cs.join(' ');
        }

        return  this;
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

    prependChild(c)  {
        if (this.c)
            this.c.unshift( c );
        else
            this.c = [c];

        if (c instanceof JSONH)
            c.parent = this;

        bubbleEvents(this, c);
    }

    toHTML(space)  {
        // check if there are extended classes
        let  cssExtend;
        if (this.css)  {
            cssExtend = _.reduce(this.css, (result, value, key) => {
                if (value['!extend'])  {
                    result[key.slice(1)] = _.reduce(value['!extend'].split(' '), (extStr, s) => {
                        if (!this.css[s] && s[0] === '.')
                            extStr += ' ' + s.slice(1);
                        return  extStr;
                    }, '').trim();
                }
                return  result;
            }, {});
            //console.log('css extended:\n' + JSON.stringify(cssExtend, null, 4) );
        }

        space = space  ?  Math.min(Math.max(space, 0), 8) : 0;
        return  this.toHTMLString(this, '', space, cssExtend);
    }

    toCSS(space, prefix)  {
        if (!this.isUIC)
            return  '';

        space = Math.min(space || 0, 8);
        let  ws = space  ?  _wsStr.slice(0, space) : '',
             cssStr = this.css  ?  toCSSExpr(this.css, '', ws, prefix) : '';

        if (this.uicList)
            this.uicList.forEach( uic => {
                if (uic instanceof JSONH)  {
                    let  cssClass = '#' + uic.id,
                         pcss = prefix  ?  (prefix + ' ' + cssClass) : cssClass;
                    cssStr += uic.toCSS( space, pcss );
                }
            });

        return  cssStr;
    }


    /**
     * 
     * @param {*} isReload true if the palet is reloaded and we don't have to regenerate everything.
     * @param {*} isEmbedded true if this element is NOT the root element of a HTML fragment.
     */
    toJS(isReload, isEmbedded)  {
        // UIC with errors will not have ID, and it doesn't have to generate Javascript code
        if (!this.isUIC || !this.id)
            return  '';

        let  id = this.id,
             endpoint = this.endpoint;
        /*
        return  "(function(orgUIC)  {\n" +
               "\tlet  uic = orgUIC ?  orgUIC : new __._uic('" + id + "', '" + endpoint + "');\n" +
               this.genJsCode(isReload) + "\nreturn uic;\n})(__._" + id + ");\n";
        */
        let  origUIC;
        if (isEmbedded)
            origUIC = "uic._c['" + id + "']";
        else
            origUIC = '__._' + id;

        return  "(function(orgUIC)  {\n" +
               "\tlet  uic = orgUIC ?  orgUIC : new __._uic('" + id + "', '" + endpoint + "');\n" +
               this.genJsCode(isReload) + "\nreturn uic;\n})(" + origUIC + ");\n";
    }


    genJsCode(isReload)  {
        let  regCode = '',
             jsCode = '',      // declare child-UICs as variables
             argCount = this.ctrlArgCount;

        // this.uicList may be undefined which can be caused by syntax errors of child UICs
        if (this.uicList)  {
            this.uicList.forEach( uic => {
                // uic.id == undefined means the palet has error
                if (uic.id)  {
                    let  uicID = uic.id;
                    // jsCode += '\t\t_' + uicID + '=__._' + uicID + '=' + uic.toJS(isReload, true) + 
                    //           '\t\tuic.addChild("' + uicID + '", _' + uicID + ');\n';
                    jsCode += 'let _' + uicID + '=__._' + uicID + '=' + uic.toJS(isReload, true) + 
                              'uic.addChild("' + uicID + '", _' + uicID + ');\n';

                    if (uic.events)
                        regCode += registerChildHandler(uic);
                }
            });
        }

        if (this.events)
            regCode += registerTagHandler(this);

        if (this.ctx)
            jsCode += 'uic._ctx=' + JSON.stringify(this.ctx) + ';\n';

        if (this.src)  {
            //jsCode += 'let  defCtrl = ' + (argCount > 1  ?  'true' : 'false') + '|| !orgUIC;\n';
            jsCode += 'let  defCtrl = true;\n';
            jsCode += 'if (defCtrl)  {\n';
            jsCode += this.src + '\n\nif (ctrlGen)  {\n';

            let  paramSrc;
            if (argCount > 1 && this.params)  {
                // the control() function is expecting parameters...
                jsCode += '\tlet params=' + JSON.stringify(this.params, replacer) + ';\n';
                paramSrc = 'params';
            }
            else
                paramSrc = 'null';
                
            jsCode += '\tctrlGen(uic';
            if (argCount > 1)
                jsCode += ', ' + paramSrc;
            if (this.ctx && argCount > 2)
                jsCode += ', uic._ctx';
            jsCode += ');\n';

            jsCode += '}\n}\n';
            // jsCode += '\tuic.control=ctrlGen;\n}\n';
            // jsCode += '}\n';
        }

        jsCode += '\nuic.init = function() {\n\tthis._init();' + regCode + '}';
        return  jsCode;
    }


    /**
     * Sum up all include items of a palet tree
     * @param {*} incList 
     */
    toInclude(incList)  {
        if (this.include)  {
            this.include.forEach( item => {
                let  idx = _.findIndex( incList, o => {
                    return  o.href == item.href || o.src == item.src;
                });

                if (idx < 0)
                    incList.push( item );
            });
        }

        if (this.uicList)
            this.uicList.forEach( uic => uic.toInclude(incList) );
    }


    toHTMLString(hsObj, leading, space, cssExtend)  {
        let  tag = hsObj.t,
             s = leading + '<' + tag;
    
        if (cssExtend && hsObj.a && hsObj.a['class'])  {
            // replace extended classes with the actual classes
            let  classNames = hsObj.a['class'].split(' '),
                 classAttr = '';

            classNames.forEach( c => {
                if (cssExtend[c])
                    classAttr += ' ' + cssExtend[c];
                classAttr += ' ' + c;
            });
            hsObj.a['class'] = classAttr.trim();
        }

        s = toAttributes( hsObj.a, s ) + '>';

        if (!hsObj.isSingleton)  {
            if (hsObj.c)  {
                let  ws = leading + _wsStr.slice(0, space),
                     node = this,
                     isMutiLine = false;
    
                hsObj.c.forEach( (child, idx) => {
                    if (typeof child === 'string')
                        s += child;
                    else  {
                        if (idx == 0 && space)
                            s += '\n';
                        s += (child instanceof JSONH && child.isUIC)  ?  child.toHTML(space) : node.toHTMLString(child, ws, space, cssExtend);
                        if (space)  {
                            s += '\n';
                            isMutiLine = true;
                        }
                    }
                });

                if (isMutiLine)
                    s += leading;
            }
    
            s += '</' + tag + '>';
        }

        if (hsObj.endpoint)  {
            let  pre = '<div id="' + hsObj.id + '"';
            if (hsObj.clazName)
                pre += ' class="' + hsObj.clazName + '"';
            
            if (space)
                s = pre + '>\n' + leading + s + '\n' + leading + '</div>';
            else
                s = pre + '>' + s + '\n</div>';
        }
        
        return  s;
    }
}

module.exports = JSONH;


function  normalizeChildren(children)  {
    if (Array.isArray(children))  {
        let  clen = children.length;
        if (typeof children[0] === 'string' && clen <= 3)  {
            let  c1 = children[1];
            if (clen === 1 ||
                (clen === 2 && !(c1 instanceof JSONH) || Array.isArray(c1)) ||
                (clen === 3 && !(c1 instanceof JSONH) && (typeof c1 === 'object')))
                // ok. children are specified as an array
                children = [children];
        }
    }
    else
        children = [children];

    return  children;
}


function  makeAChild(c)  {
    let  ctag, cattr, cc,
         clen = c.length;

    if (typeof c[0] === 'string' && clen <= 3)  {
        // ok. children are specified as an array
        ctag = c[0];
        if (clen == 2)  {
            cattr = c[1];
            if (typeof cattr == 'string' || Array.isArray(cattr) || cattr instanceof JSONH)  {
                cc = cattr;
                cattr = null;
            }
        }
        else  {
            cattr = c[1];
            cc = c[2];
        }
    }
    
    ctag = ctag || 'div';   // fault tolerant
    return  new JSONH(ctag, cattr, cc);
}


function  toAttributes(attr, hs)  {
    if (!attr)
        return  hs;

    let  s = hs,
         keys = Object.getOwnPropertyNames(attr);

    keys.forEach( key => {
        if (key == 'docType')
            return  true;

        let  value = attr[key];

        if (value === null || value === undefined)
            // a tag attribute can be without a value
            s += ' ' + key;
        else  {
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


/**
 * convert a HTML attribute string to an attribute object.
 * 
 * @param {*} s 
 */
function  stringToAttr(s)  {
    let  attr = {},
         as = s;

    while (as.length > 0)  {
        let  idx = as.indexOf('='),
            key = as.substring(0, idx).trim();

        idx = as.indexOf('"');
        as = as.slice(idx+1);

        idx = as.indexOf('"');
        let  value = as.slice(0, idx).trim();
        as = as.slice(idx+1);

        attr[key] = value;
    }

    return  attr;
}


/**
 * This is the actual css generation function for an UIC.
 * 
 * @param {*} rules 
 * @param {*} leading 
 * @param {*} space 
 * @param {*} prefix 
 */
function  toCSSExpr(rules, leading, space, prefix)  {
    let  s = '';

    if (rules)  {
        let  keys = Object.getOwnPropertyNames(rules);

        keys.forEach( key => {
            let  cssValue = rules[key];

            if (key[0] === '@')
                s += cssAtRule(key, cssValue, leading, space, prefix);
            else  if (key !== '!extend')  {
                // check if there are extended classes...
                let  extClass = cssValue['!extend'];
                if (extClass)  {
                    //delete  cssValue['!extend'];

                    if (typeof extClass === 'string')  {
                        let  extProp = {},
                             cssClasses = extClass.split(' ');

                        cssClasses.forEach( claz => {
                            if (claz != key && rules[claz])
                                // claz != key: to prevent endless recursion
                                _.assign(extProp, rules[claz]);
                        });

                        // the actual css rules will overwrite those inherited from extended classes
                        _.assign(extProp, cssValue);
                        cssValue = extProp;
                    }
                }

                let  selector = prefixSelector(prefix || '', key);
                s += leading + selector + ' ' + toCSSProperties( cssValue, leading + space, space );
            }
        });
    }

    return  s;
}


function  cssAtRule(key, value, leading, space, prefix)  {
    let  valueType = typeof value,
         result = '';

    if (valueType === 'string')
        result = key + ' ' + value;
    else  if (valueType === 'object')  {
        let  valueList = Object.values( value );

        if (valueList.length && (typeof valueList[0] === 'string'))
            result = key + ' ' + toCSSProperties(value, leading + space, space);
        else
            result = key + ' {' + (space  ?  '\n' : '') +
                     toCSSExpr(value, leading + space, space, prefix) + '}';
    }
    if (space)
        result += '\n';
    
    return  result;
}


function  prefixSelector(prefix, key)  {
    let  sel = '',
         selectors = key.split(',');
    if (prefix)
        prefix += ' ';

    selectors.forEach( (s, idx) => {
        if (idx)
            sel += ', ';
        sel += prefix + (s == '.'  ?  '' : s);
    });

    return  sel;
}


function  toCSSProperties(cssp, leading, space)  {
    if (typeof cssp === 'string')
        return  cssp;

    let  keys = Object.getOwnPropertyNames(cssp),
         s = '{';
    if (space)
        s += '\n';

    let  ws = leading + space;

    keys.forEach( key => {
        let  ruleValue = cssp[key];
        if (typeof ruleValue === 'object')
            ruleValue = toCSSProperties(ruleValue, ws, space);

        s += leading + key + ': ' + ruleValue + ';';
        if (space)
            s += '\n';
    });
    s += leading.slice(0, -space.length) + '}';
    if (space)
        s += '\n';

    return  s;
}


function  clone(obj)  {
    let  no = {};
    Object.getOwnPropertyNames(obj).forEach( key => {
        no[key] = obj[key];
    });
    return  no;
}


function  registerChildHandler(uic)  {
    // register event handler on the child
    let  jsCode = '\n',
         uicName = '_' + uic.id;

    Object.getOwnPropertyNames(uic.events).forEach( evName => {
        let  evtList = uic.events[evName];
        evtList.forEach( evt => {
            if (!evt.selector)
                jsCode += uicName + ".on('" + evName + "', " + evt.handler + ");\n";
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


function  isTagSingleton(tag)  {
    return  tag === 'hr' || tag === 'br' || tag === 'img' || tag === 'input' || tag === 'base' || 
            tag === 'embed' || tag === 'meta' || tag === 'link';
}