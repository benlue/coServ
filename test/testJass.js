var  assert = require('assert'),
     jass = require('../lib/css/jass');

describe('[coServ/css]...', function() {
    it('try add...', function()  {
        var  r = jass.r('nav'),
             r_h1 = jass.r('h1', {color: '#888'}),
             p = {
                 'font-size': '12pt'
             };

        assert.equal( r.toString(), 'nav {\n}', 'empty rule' );
        r.add( p );
        assert.equal( r.toString(), 'nav {\n\tfont-size: 12pt;\n}', 'single property' );

        r = jass.r('nav');
        r.add( r_h1 );
        assert.equal( r.toString(), 'nav h1 {\n\tcolor: #888;\n}\n', 'nested rules.' );

        var  r_h2 = jass.r('h2', {font: '20pt'});
        r = jass.r('nav');
        r.add( [r_h1, r_h2] );
        assert.equal( r.toString(), 'nav h1 {\n\tcolor: #888;\n}\nnav h2 {\n\tfont: 20pt;\n}\n', 'multiple nested rules.' );

        // nested to 1 level
        r = jass.r('.c', {padding: '5px'});
        r.add( r_h1 );
        assert.equal( r.toString(), '.c h1 {\n\tpadding: 5px;\n\tcolor: #888;\n}\n', 'inherit properties');

        // nested down 2 levels
        r = jass.r('.c', {padding: '5px'});
        r.add( r_h1 );
        r_h1.add( r_h2 );
        assert.equal(r.toString().indexOf('.c h1 h2 {'), 0, 'selector not match');
        //console.log( r.toString() );
    });

    it('test property dont mix', function()  {
        var  p = {'background-color': '#fff'},
             r1 = jass.r('.c', {font: '16pt'}),
             r2 = jass.r('.c', {font: '14pt'});

        r1.add( p );
        r2.add( p );
        assert.equal(r2.toString(), '.c {\n\tfont: 14pt;\n\tbackground-color: #fff;\n}', 'p is mixed');
    });

    it('test print', function()  {
        var  p = {
            'font-size': '12pt'
        },
        p2 = {
            color: '#fff',
            'margin-top': '3px'
        };

        assert.equal( jass.p('nav', {}), 'nav {\n}', 'empty rule' );
        assert.equal( jass.p('nav', p), 'nav {\n\tfont-size: 12pt;\n}', 'single property' );
        assert.equal( jass.p('nav', p2), 'nav {\n\tcolor: #fff;\n\tmargin-top: 3px;\n}', 'single property' );

        var  r = jass.r('nav');
        assert.equal( r.toString(), 'nav {\n}', 'empty rule' );
        r = jass.r('nav', p);
        //console.log( r.toString() );
        assert.equal( r.toString(), 'nav {\n\tfont-size: 12pt;\n}', 'single property' );
    });

    it('test convenience', function()  {
        var  p = {'background-color': '#fff'},
             r1 = jass.r('.c', {font: '16pt'});

        assert.equal( jass.p(r1), r1.toString(), 'should be identical');
        assert.equal( jass.p(p), '\tbackground-color: #fff;\n', 'should be the same.');
    });
});
