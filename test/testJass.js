/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2015 ~ 2016 Gocharm Inc.
 */
var  assert = require('assert'),
     jass = require('../lib/css/jass');


module.exports = {
    'building rules': ruleBuilderTest,
    'no mix' : noMixTest,
    'test print': printTest,
    'convenience test': convenientTest
};


function  ruleBuilderTest(beforeExit, assert)  {
    var  r = jass.r('nav'),
         r_h1 = jass.r('h1', {color: '#888'}),
         p = {
             'font-size': '12pt'
         };

    assert.equal( r.toString(), 'nav {\n}' );
    r.add( p );
    assert.equal( r.toString(), 'nav {\n\tfont-size: 12pt;\n}' );

    r = jass.r('nav');
    r.add( r_h1 );
    assert.equal( r.toString(), 'nav h1 {\n\tcolor: #888;\n}\n' );

    var  r_h2 = jass.r('h2', {font: '20pt'});
    r = jass.r('nav');
    r.add( [r_h1, r_h2] );
    assert.equal( r.toString(), 'nav h1 {\n\tcolor: #888;\n}\nnav h2 {\n\tfont: 20pt;\n}\n' );

    // nested to 1 level
    r = jass.r('.c', {padding: '5px'});
    r.add( r_h1 );
    assert.equal( r.toString(), '.c h1 {\n\tpadding: 5px;\n\tcolor: #888;\n}\n');

    // nested down 2 levels
    r = jass.r('.c', {padding: '5px'});
    r.add( r_h1 );
    r_h1.add( r_h2 );
    assert.equal(r.toString().indexOf('.c h1 h2 {'), 0);
}


function  noMixTest(beforeExit, assert)  {
    var  p = {'background-color': '#fff'},
         r1 = jass.r('.c', {font: '16pt'}),
         r2 = jass.r('.c', {font: '14pt'});

    r1.add( p );
    r2.add( p );
    assert.equal(r2.toString(), '.c {\n\tfont: 14pt;\n\tbackground-color: #fff;\n}');
}


function  printTest(beforeExit, assert)  {
    var  p = {
            'font-size': '12pt'
    },
    p2 = {
        color: '#fff',
        'margin-top': '3px'
    };

    assert.equal( jass.p('nav', {}), 'nav {\n}' );
    assert.equal( jass.p('nav', p), 'nav {\n\tfont-size: 12pt;\n}' );
    assert.equal( jass.p('nav', p2), 'nav {\n\tcolor: #fff;\n\tmargin-top: 3px;\n}' );

    var  r = jass.r('nav');
    assert.equal( r.toString(), 'nav {\n}' );
    r = jass.r('nav', p);
    //console.log( r.toString() );
    assert.equal( r.toString(), 'nav {\n\tfont-size: 12pt;\n}' );
}


function  convenientTest(beforeExit, assert)  {
    var  p = {'background-color': '#fff'},
         r1 = jass.r('.c', {font: '16pt'});

    assert.equal( jass.p(r1), r1.toString());
    assert.equal( jass.p(p), '\tbackground-color: #fff;\n');
}