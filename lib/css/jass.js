/*!
* coServ
* authors: Ben Lue
* license: MIT
* Copyright(c) 2014 Gocharm Inc.
*/
exports.r = function makeRule(sel, prop)  {
    return  new Rule(sel, prop);
};


exports.p = function printOut(sel, prop)  {
    var  s;
    if (arguments.length === 1)
        s = sel.constructor === Rule  ?  s = sel.toString() : s = printProp( sel );
    else
        s = printRule(sel, prop);

    return  s;
};


var  Rule = (function() {

    function  rule(sel, prop)  {
        this.cssSel = sel;
        this.cssProp = prop  ?  cloneProp(prop) : null;
    };

    rule.prototype.add = function(prop)  {
        var  ans;
        if (prop.constructor === Array)  {
            this.rules = this.rules || [];
            this.rules = this.rules.concat( prop );
        }
        else  if (prop.constructor === Rule)  {
            this.rules = this.rules || [];
            this.rules.push( prop );
        }
        else  {
            this.cssProp = this.cssProp || {};
            for (var k in prop)
                this.cssProp[k] = prop[k];
        }
    };

    rule.prototype.toString = function()  {
        var  s;
        if (this.rules)  {
            s = '';
            for (var i in this.rules)
                s += print(this.cssSel, this.cssProp, this.rules[i]);
        }
        else
            s = printRule(this.cssSel, this.cssProp);
        return  s;
    };

    function  print(sel, prop, r)  {
        var  s = '';
        if (r.rules)  {
            var  ns = sel + ' ' + r.cssSel,
                 np = r.cssProp  ?  cloneProp(prop, cloneProp(r.cssProp)) : prop;
            for (var i in r.rules)
                s += print(ns, np, r.rules[i]);
        }
        else
            s = sel + ' ' + r.cssSel + ' {\n' + printProp(prop) + printProp(r.cssProp) + '}\n';
        return  s;
    }

    return  rule;
})();


function  printRule(sel, prop)  {
    return  sel + ' {\n' + printProp(prop) + '}';
};


function  printProp(prop)  {
    var  s = '';
    if (prop)  {
        for (var key in prop)
            s += '\t' + key + ': ' + prop[key] + ';\n';
    }

    return  s;
};


function  cloneProp(prop, toProp)  {
    var  p = toProp || {};
    for (var k in prop)
        p[k] = prop[k];
    return  p;
};
