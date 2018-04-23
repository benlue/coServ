/*!
 * EmulateUIC: generate the UIC code of the server side
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2018 Gocharm Inc.
 */
const  fs = require('fs'),
       path = require('path'),
       Promise = require('bluebird'),
       JSONH = require('./jsonh'),
       xs = require('./hAsJs.js');

exports.runXS = async function(id, mdata, uicPath, blockRoot)  {
    let  xsPath = path.join(blockRoot, uicPath + '.xs'),
         uic = await readUIC(xsPath, blockRoot),
         xsRoot = uic.err,      // uic.err no null means syntax error   
         params = mdata  ?  (mdata.value || {}) : {};

    if (!xsRoot && uic.checkIn)
        // if anything is returned, it means input error
        xsRoot = uic.checkIn( params );

    xsRoot = xsRoot || makeElement(uic, id, params, uicPath);
    return  makeUICTree( xsRoot );
}


/**
 * A recursive fucntion to rebuild the UIC tree
 * 
 * @param {*} uic 
 */
function  makeUICTree(xsRoot)  {
    return  Promise.all([xsRoot, Promise.all(xsRoot.c || [])]).then( values => {
        let  uic = values[0],
             clist = values[1];
        uic.c = clist.length  ?  clist : null;

        if (uic.isUIC)
            uic.uicList = [];

        if (uic.c)  {
            uic.c.forEach( (c, idx) => {
                if (c instanceof JSONH)  {
                    if (c.isUIC)
                        uic.uicList.push( c );
                    makeUICTree( c );
                }
            });
        }

        return  uic;
    });
}


/**
 * One of the built-in functions of an UIC
 * @param {*} id 
 * @param {*} params 
 */
function  requireBuild(id, params)  {
    let  xsPath = this.xsPath,
         blockRoot = this.blockRoot,
         uicPath = xsPath.substring( blockRoot.length );

    if (uicPath.slice(-3) === '.xs')
        uicPath = uicPath.slice(0, -3);
    else
        xsPath += '.xs';

    let  uic = readUIC(xsPath, blockRoot),
         node = new Promise( resolve => {
                    uic.then( u => {
                        let  xsRoot = u.err;      // uic.err no null means syntax error   

                        if (!xsRoot && u.checkIn)
                            // if anything is returned, it means input error
                            xsRoot = u.checkIn( params );

                        xsRoot = xsRoot || makeElement(u, id, params, uicPath);
                        resolve( xsRoot );
                    }); 
                });
    node.on = (evName, func) => {return  xs.on(node, evName, func);}
    return  node;
}


function  importBuild(uicName, id, params)  {
    let  packPath = this.packPath,
         xsPath = this.uicRoot + packPath + '/' + uicName + '.xs',
         uic = readUIC(xsPath, this.uicRoot),
         node = new Promise( resolve => {
                    uic.then( u => {
                        let  xsRoot = u.err;      // uic.err no null means syntax error   

                        if (!xsRoot && u.checkIn)
                            // if anything is returned, it means input error
                            xsRoot = u.checkIn( params );

                        xsRoot = xsRoot || makeElement(u, id, params, packPath + '/' + uicName);
                        resolve( xsRoot );
                    }); 
                });
    node.on = (evName, func) => {return  xs.on(node, evName, func);}
    return  node;
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
        //elm.src = uic.src;
        elm.src = uic.makeCtrl  ?  'exports.makeCtrl = ' + uic.makeCtrl.toString() : '';
        elm.params = params;
        elm.setAsUIC();
    }
    catch (e)  {
        elm = xs.reportError('prog', '[' + uicPath + '] has execution errors as:')
                .add('pre', null, e.stack);
    }

    return  elm;
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