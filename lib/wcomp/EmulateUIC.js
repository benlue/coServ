/*!
 * EmulateUIC: generate the UIC code of the server side
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2018 Gocharm Inc.
 */
const  fs = require('fs'),
       path = require('path'),
       Promise = require('bluebird'),
       xs = require('./hAsJs.js');

exports.runXS = function(id, uicPath, blockRoot)  {
    let  modName = uicPath.split('/').slice(-1)[0],
         xsPath = path.join(blockRoot, uicPath + '/' + modName + '.xs'),
         uic = interpret(xsPath, blockRoot),
         elm = uic.make();

    let  clazName = toClassName( uicPath.replace(/\\/gi, '') );
    elm.id = id;
    elm.clazName = clazName;
    elm.uicPath = uicPath;
    elm.src = uic.src;
    
    return  elm;
}


function  requireFun(modPath)  {
    let  xsPath = path.join(this.modPath, modPath),
         blockRoot = this.blockRoot,
         uic = interpret(xsPath, blockRoot);

    let  uicPath = xsPath.substring( blockRoot.length-1 ),
         len = uicPath.length;
    if (uicPath.substring(len-3) === '.xs')  {
        let  idx = uicPath.lastIndexOf('/');
        uicPath = uicPath.substring(0, idx);
    }

    let  clazName = toClassName( uicPath.replace(/\\/gi, '') );
    uic.build = function(id, params)  {
        let  elm = uic.make();
        elm.id = id;
        elm.clazName = clazName;
        elm.uicPath = uicPath;
        elm.src = uic.src;

        return  elm;
    };

    return  uic;
}


function  interpret(xsPath, blockRoot)  {
    let  idx = xsPath.lastIndexOf('/'),
         modPath = xsPath.substring(0, idx);

    let  src = fs.readFileSync( xsPath, {encoding: 'utf8'} ),
         exportMock = {src: src},
         require = requireFun;

    (function(exports) {
        let  ctrl = {},
             thisObj = {
                modPath: modPath,
                blockRoot: blockRoot
             },
             require = requireFun.bind(thisObj);

        eval(src);
    })(exportMock);
    
    return  exportMock;
}


function  toClassName(uicPath)  {
    let  claz = '',
         parts = uicPath.split('/');
    parts.forEach( p => {
        claz += p.charAt(0).toUpperCase() + p.substring(1);
    });

    return  claz;
}