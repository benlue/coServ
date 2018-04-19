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

exports.runXS = async function(id, params, uicPath, blockRoot)  {
    let  xsPath = path.join(blockRoot, uicPath + '.xs'),
         uic = await readUIC(xsPath, blockRoot);

    return  uic.err || makeElement(uic, id, params, uicPath);
}


/**
 * One of the built-in functions of an UIC
 * @param {*} id 
 * @param {*} params 
 */
function  requireBuild(id, params)  {
    let  xsPath = this.xsPath,
         blockRoot = this.blockRoot;
    if (xsPath.slice(-3) != '.xs')
        xsPath += '.xs';
    
    let  uicPath = xsPath.substring( blockRoot.length );
    if (uicPath.slice(-3) === '.xs')
        uicPath = uicPath.slice(0, -3);

    let  src = fs.readFileSync( xsPath, {encoding: 'utf8'} ),
         uic = interpret(src, xsPath, blockRoot);
    
    return  uic.err || makeElement(uic, id, params, uicPath);
}


function  importBuild(uicName, id, params)  {
    let  packPath = this.packPath,
         uicFile = this.uicRoot + packPath + '/' + uicName + '.xs',
         src = fs.readFileSync( uicFile, {encoding: 'utf8'} ),
         uic = interpret(src, uicFile, this.uicRoot);

    return  makeElement(uic, id, params, packPath + '/' + uicName);
}


function  requireFun(modPath)  {
    let  thisObj = {
            xsPath: path.join(this.modPath, modPath),
            blockRoot: this.blockRoot
         };

    return  {
        build: requireBuild.bind( thisObj )
    };
}


function  importUICFun(packPath)  {
    let  thisObj = {
            packPath: packPath,
            uicRoot: this.blockRoot.slice(0, -'blocks/view/'.length) + 'uic/'
         };

    return  {
        build: importBuild.bind( thisObj )
    }
}


function  makeElement(uic, id, params, uicPath)  {
    let  elm;
    try  {
        elm = uic.make(params || {});

        let  clazName = toClassName( uicPath.replace(/\\/gi, '') );
        elm.id = id;
        elm.clazName = clazName;
        elm.uicPath = uicPath;
        elm.src = uic.src;
        elm.params = params;
        elm.setAsUIC();
    }
    catch (e)  {
        elm = xs.reportError('prog', '[' + uicPath + '] has execution errors as:')
                .add('pre', null, e.stack);
    }

    return  elm;
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
             require = requireFun.bind( thisObj ),
             importUIC = importUICFun.bind( thisObj );

        try  {
            eval(src);
        }
        catch (e)  {
            exports.err = xs.reportError('prog', 'The block [' + modPath.substring(blockRoot.length) + '] has syntax errors as:')
                            .add('pre', null, e.stack.split('\n')[0]);
        }
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