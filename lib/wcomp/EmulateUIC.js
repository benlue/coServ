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

exports.runXS = async function(id, uicPath, blockRoot)  {
    let  xsPath = path.join(blockRoot, uicPath + '.xs'),
         uic = await readUIC(xsPath, blockRoot);

    return  makeElement(id, uicPath, uic);
}


function  build(id, params)  {
    let  xsPath = this.xsPath,
         blockRoot = this.blockRoot,
         src = fs.readFileSync( xsPath, {encoding: 'utf8'} ),
         uic = interpret(src, xsPath, blockRoot);
        
    let  uicPath = xsPath.substring( blockRoot.length );
    if (uicPath.slice(-3) === '.xs')
        uicPath = uicPath.slice(0, -3);
    
    return  makeElement(id, uicPath, uic);
}


function  makeElement(id, uicPath, uic)  {
    let  elm = uic.make(),
         clazName = toClassName( uicPath.replace(/\\/gi, '') );
    elm.id = id;
    elm.clazName = clazName;
    elm.uicPath = uicPath;
    elm.src = uic.src;

    return  elm;
}


function  requireFun(modPath)  {
    let  thisObj = {
            xsPath: path.join(this.modPath, modPath),
            blockRoot: this.blockRoot
         };

    return  {
        build: build.bind( thisObj )
    };
}


function  readUIC(xsPath, blockRoot)  {
    let  idx = xsPath.lastIndexOf('/'),
         modPath = xsPath.substring(0, idx);

    return  new Promise((resolve, reject) => {
        fs.readFile( xsPath, {encoding: 'utf8'}, (err, src) => {
            if (err)  return  reject(err);

            resolve( interpret(src, modPath, blockRoot) );
        });
    });
}


function  interpret(src, modPath, blockRoot)  {
    let  exportMock = {src: src},
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