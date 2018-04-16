const  hajs = require('../lib/wcomp/hAsJs'),
       jsonh = require('../lib/wcomp/jsonh');

const  html = hajs.html,
       toHTML = hajs.toHTML,
       toCSSP = hajs.toCSSProperties,
       toCSS = hajs.toCSS,
       block = hajs.block;

describe("HTML as JSON", function() {
    it("singleton tag", function() {
        let  hr = html('hr');
        //console.log(JSON.stringify(hr, null, 4));

        //console.log(toHTML(hr));
        //expect(toHTML(hr)).toBe('<hr>');
        expect(hr.toHTML()).toBe('<hr>');
    });

    it("singleton tag with attributes", function() {
        let  hr = html('hr', {align: 'center', color: 'gray'});
        //console.log(JSON.stringify(hr, null, 4));

        //console.log(toHTML(hr));
        expect(hr.toHTML()).toBe('<hr align="center" color="gray">');
    });

    it("simple tag with text", function() {
        let  li = html('li', 'a list');
        //console.log(JSON.stringify(li, null, 4));
        //expect(li.c[0]).toBe('a list');

        //console.log(toHTML(li));
        expect(li.toHTML()).toBe('<li>a list</li>');
    });

    it("simple tag with text and attributes", function() {
        let  li = html('li', {hight:200, width:100}, 'a list');
        //console.log(JSON.stringify(li, null, 4));
        //expect(li.c[0]).toBe('a list');

        //console.log(toHTML(li));
        expect(li.toHTML()).toBe('<li hight="200" width="100">a list</li>');
    });

    it("tag with multiple children", function() {
        let  c = [];
        for (i = 0; i < 3; i++)  {
            let  li = html('li', 'item #' + i);
            c.push( li );
        }

        let  ul = html('ul', c);
        //console.log(JSON.stringify(ul, null, 4));
        //expect(ul.c[0].t).toBe('li');

        //console.log(toHTML(ul));
        expect(ul.toHTML()).toBe('<ul><li>item #0</li><li>item #1</li><li>item #2</li></ul>');
    });
});


describe("Prettify JSON to HTML output", function() {
    it("singleton tag", function() {
        let  hr = html('hr');

        //console.log(toHTML(hr, 4));
        expect(hr.toHTML(4)).toBe('<hr>');
    });

    it("singleton tag with attributes", function() {
        let  hr = html('hr', {align: 'center', color: 'gray'});

        //console.log(toHTML(hr));
        expect(hr.toHTML(4)).toBe('<hr align="center" color="gray">');
    });

    it("simple tag with text", function() {
        let  li = html('li', 'a list');
        //console.log(JSON.stringify(li, null, 4));
        //expect(li.c[0]).toBe('a list');

        //console.log(toHTML(li));
        expect(li.toHTML(4)).toBe('<li>a list</li>');
    });

    it("simple tag with text and attributes", function() {
        let  li = html('li', {hight:200, width:100}, 'a list');
        //console.log(JSON.stringify(li, null, 4));
        //expect(li.c[0]).toBe('a list');

        //console.log(toHTML(li));
        expect(li.toHTML(4)).toBe('<li hight="200" width="100">a list</li>');
    });

    it("tag with multiple children", function() {
        let  c = [];
        for (i = 0; i < 3; i++)  {
            let  li = html('li', 'item #' + i);
            c.push( li );
        }

        let  ul = html('ul', c);
        //console.log(JSON.stringify(ul, null, 4));
        //expect(ul.c[0].t).toBe('li');

        //console.log(toHTML(ul, 4));
        expect(ul.toHTML(2)).toBe('<ul>\n  <li>item #0</li>\n  <li>item #1</li>\n  <li>item #2</li>\n</ul>');
    });
});


describe("HTML as JSON -- mixin", function() {
    it("mixin attributes", function() {
        let  height = 200,
             width = 100,
             li = html('li', {hight:height, width:width}, 'a list');
        //console.log(JSON.stringify(li, null, 4));
       // expect(li.c[0]).toBe('a list');

        //console.log(toHTML(li));
        expect(li.toHTML()).toBe('<li hight="200" width="100">a list</li>');
    });
});


describe("CSS as JSON", function() {
    it("a simple property", function() {
        let  p = {
                'text-align': 'center',
                'vertical-align': 'middle',
                'border-top': 'none'
             };

        //console.log( toCSSP(p) );
        expect(toCSSP(p)).toBe('text-align: center;vertical-align: middle;border-top: none;');
    });

    it("a single CSS rule", function() {
        let  p = {
                'text-align': 'center',
                'vertical-align': 'middle',
                'border-top': 'none'
             },
             rules = {
                '.Foot .table>tbody>tr>td': p
             };

        //console.log( toCSS(rules) );
        expect(toCSS(rules)).toBe('.Foot .table>tbody>tr>td {text-align: center;vertical-align: middle;border-top: none;}');
    });

    it("multiple CSS rules", function() {
        let  p = {
                'height': 'auto',
                'background-color': '#111'
             },
             rules = {
                '.Head': p,
                '.Foot': p
             };

        //console.log( toCSS(rules) );
        expect(toCSS(rules)).toBe('.Head {height: auto;background-color: #111;}.Foot {height: auto;background-color: #111;}');
    });
});


describe("Prettify CSS as JSON", function() {
    it("a simple property", function() {
        let  p = {
                'text-align': 'center',
                'vertical-align': 'middle',
                'border-top': 'none'
             };

        //console.log( toCSSP(p, 2) );
        expect(toCSSP(p, 2)).toBe('  text-align: center;\n  vertical-align: middle;\n  border-top: none;\n');
    });

    it("a single CSS rule", function() {
        let  p = {
                'text-align': 'center',
                'vertical-align': 'middle',
                'border-top': 'none'
             },
             rules = {
                '.Foot .table>tbody>tr>td': p
             };

        //console.log( toCSS(rules, 2) );
        expect(toCSS(rules, 2)).toBe('.Foot .table>tbody>tr>td {\n  text-align: center;\n  vertical-align: middle;\n  border-top: none;\n}\n');
    });

    it("multiple CSS rules", function() {
        let  p = {
                'height': 'auto',
                'background-color': '#111'
             },
             rules = {
                '.Head': p,
                '.Foot': p
             };

        //console.log( toCSS(rules, 2) );
        expect(toCSS(rules, 2)).toBe('.Head {\n  height: auto;\n  background-color: #111;\n}\n.Foot {\n  height: auto;\n  background-color: #111;\n}\n');
    });
});


xdescribe("Embedding blocks", function() {
    it("a simple block", function() {
        let  elm = html('div', [
                        html('h1', 'Header'),
                        block('myID', '/foo/bar')
                   ]);

        console.log( toHTML(elm) );
        //expect(toCSSP(p, 2)).toBe('  text-align: center;\n  vertical-align: middle;\n  border-top: none;\n');
    });
});