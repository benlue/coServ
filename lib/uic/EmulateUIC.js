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

exports.runXS = async function(id, uicPath, blockRoot, renderQ)  {
    let  xsPath = path.join(blockRoot, uicPath + '.xs'),
         uic = await readUIC(xsPath, blockRoot, renderQ),
         xsRoot = uic.err;      // uic.err no null means syntax error   

    if (!xsRoot)  {
        // model data
        let  mdata = renderQ.getSrcData();      

        // program does not have syntax errors, continue
        if (mdata.errCode)
            // data model does not run properly. report model error!
            xsRoot = modelError(uic, mdata, uicPath);
        else  {
            let  params = mdata  ?  (mdata.value || {}) : {},
                 ctx = renderQ.createCtx(id);
            if (uic.checkIn)
                // if anything is returned, it means input error
                xsRoot = checkInParams( uic.checkIn, params );

            if (!xsRoot)  {
                let  phsPath = path.join(blockRoot, uicPath + '.phs');      // phrases: the language resource file
                if (fs.existsSync(phsPath))  {
                    let  phrases = readPhrases( phsPath, renderQ.getLocale() );
                    ctx.phrases = phrases;
                }

                xsRoot = makeElement(uic, id, params, ctx, {uicPath: uicPath});
            }
        }
    }

    return  makeUICTree( xsRoot );
}


function  checkInParams(rules, params)  {
    let  err;

    Object.getOwnPropertyNames(rules).some( key => {
        let  hasError = false,
             spec = rules[key],
             value = params[key],
             errMsg;

        if (value)  {
            let  typeFun;
            if (typeof spec === 'function')
                typeFun = spec;
            else
                typeFun = spec.type;

            if (typeFun)  {
                if (typeFun == xs.in.isDate || typeFun == xs.in.isArray)
                    hasError = !typeFun( null, value );
                else  if (typeFun == xs.in.isString || typeFun == xs.in.isNumber || typeFun == xs.in.isInteger)
                    hasError = !typeFun( value );
                else  {
                    // typeFun here is a customized fuction
                    errMsg = typeFun( value );
                    if (errMsg)
                        hasError = true;
                }
            }
        }
        else  if (spec.required)
            hasError = true;
        else  if (spec.default)
            params[key] = spec.default;

        if (hasError)  {
            let  msg = errMsg || spec.error  || 'The parameter [' + key + '] is not compliant to the requirements.';
            err = xs.reportError('param', msg );
        }

        return  hasError;
    });

    return  err;
}


/**
 * A recursive fucntion to rebuild the UIC tree
 * 
 * @param {*} uic 
 */
function  makeUICTree(xsRoot)  {
    return  Promise.all(xsRoot.c || []).then( values => {
        if (xsRoot.c)
            xsRoot.c = values;

        let  clist = [];
        values.forEach( c => {
            if (c instanceof JSONH)
                clist.push( makeUICTree( c ) );
        });

        return  Promise.all([xsRoot, Promise.all(clist)]).then( values => {
            let  uic = values[0];

            if (uic.isUIC && xsRoot.uicList)  {
                return  Promise.all(xsRoot.uicList).then( uicList => {
                    uic.uicList = uicList;
                    return  uic;
                });
            }
            else
                return  uic;
        });
    });
    /*
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
    */
}


/**
 * One of the built-in functions of an UIC
 * @param {*} id 
 * @param {*} params 
 */
function  requireBuild(id, params)  {
    let  xsPath = this.xsPath,
         blockRoot = this.blockRoot,
         renderQ = this.renderQ,
         uicSource = this.uicSource,
         uicPath = xsPath.substring( blockRoot.length );

    if (uicPath.slice(-3) === '.xs')
        uicPath = uicPath.slice(0, -3);
    else
        xsPath += '.xs';

    let  idParts = id.split('/'),
         endpID = idParts.length > 1  ?  idParts[1] : null,
         ep = endpID  ?  (uicPath + '/' + endpID) : uicPath;
    id = idParts[0];

    if (fs.existsSync(xsPath))  {
        let  uic = readUIC(xsPath, blockRoot, renderQ);
        node = new Promise( resolve => {
                    uic.then( u => {
                        if (u.err)
                            // uic.err not null means syntax error
                            return  resolve( u.err );

                        renderQ.buildModel(id, params, ep, renderQ, (model, subRQ) => {
                            let  xsRoot;
                            if (model && model.errCode != 0)  {
                                xsRoot = xs.reportError('prog', '[' + uicPath + '] failed to build data model.')
                                            .add('pre', null, model.value);
                            }
                            else  {
                                model = model  ?  model.value : params;
                                if (u.checkIn)
                                    // if anything is returned, it means input error
                                    xsRoot = checkInParams( u.checkIn, model );

                                if (!xsRoot)  {
                                    let  ctx = subRQ.createCtx(id),
                                         phsPath = path.join(blockRoot, uicPath + '.phs');      // phrases: the language resource file
                                    if (fs.existsSync(phsPath))  {
                                        let  phrases = readPhrases( phsPath, subRQ.getLocale() );
                                        ctx.phrases = phrases;
                                    }

                                    xsRoot = makeElement(u, id, model, ctx, {uicPath: uicPath, endpID: endpID});
                                }
                            }

                            resolve( xsRoot );
                        });
                    }); 
                });
        uicSource.uicList.push( node );
    }
    else  {
        // the "old-styled" block
        let  html = [];
        renderQ.invokeBlock(id, ep, params || {}, html);

        node = new Promise( resolve => {
            Promise.all(html).then( lines => {
                let  elm = xs.html('div', lines.concat());
                resolve( elm );
            });
        });
    }

    node.on = (evName, func) => {return  xs.on(node, evName, func);}
    return  node;
}


function  importBuild(uicName, id, params)  {
    let  packPath = this.packPath,
         xsPath = this.uicRoot + packPath + '/' + uicName + '.xs',
         phsPath = this.uicRoot + packPath + '/' + uicName + '.phs',
         renderQ = this.renderQ,
         uicSource = this.uicSource,
         node;

    if (fs.existsSync(xsPath))  {
        let  uic = readUIC(xsPath, this.uicRoot, this.renderQ);
        node = new Promise( resolve => {
                    uic.then( u => {
                        let  xsRoot = u.err;      // uic.err no null means syntax error   

                        if (!xsRoot && u.checkIn)
                            // if anything is returned, it means input error
                            xsRoot = checkInParams( u.checkIn, params );
                            //xsRoot = u.checkIn( params );

                        if (!xsRoot)  {
                            let  ctx;

                            if (fs.existsSync(phsPath))  {
                                let  phrases = readPhrases( phsPath, renderQ.getLocale() );
                                ctx = {phrases: phrases};
                            }
                            xsRoot = makeElement(u, id, params, ctx, {uicPath: packPath + '/' + uicName});
                        }
                        
                        resolve( xsRoot );
                    }); 
                });
        uicSource.uicList.push( node );
    }
    else  {
        // the "old-styled" UIC
        let  html = [];
        renderQ.invokeUIC(id, packPath + '/' + uicName, params || {}, html);

        node = new Promise( resolve => {
                    Promise.all(html).then( lines => {
                        let  elm = xs.html('div', lines.concat());
                        resolve( elm );
                    })
                });
    }

    node.on = (evName, func) => {return  xs.on(node, evName, func);}
    return  node;
}


function  readUIC(xsPath, blockRoot, renderQ)  {
    let  idx = xsPath.lastIndexOf('/'),
         modPath = xsPath.substring(0, idx);

    return  new Promise((resolve, reject) => {
        fs.readFile( xsPath, {encoding: 'utf8'}, (err, src) => {
            if (err)  return  reject(err);

            //resolve( interpret(src, modPath, blockRoot, renderQ) );
            let  uic = interpret(src, modPath, blockRoot, renderQ);
            Promise.all( uic.uicList ).then( values => {
                uic.uicList = values;
                resolve( uic );
            });
        });
    });
}


/**
 * 
 * @param {*} phsPath the file path of the language resource file
 * @param {*} locale the desired locale
 */
function  readPhrases(phsPath, locale)  {
    let  phTxt = fs.readFileSync(phsPath, {encoding: 'utf8'});
    
    try  {
        let  src = JSON.parse(phTxt),
             phrases = {};
        Object.getOwnPropertyNames(src).forEach( key => {
            phrases[key] = src[key][locale];
        });

        return  phrases;
    }
    catch (e)  {
        reject( e );
    }
}


function  requireFun(modPath)  {
    let  xsPath = path.join(this.modPath, modPath);

    if (fs.existsSync(xsPath + '.xs'))  {
        let  thisObj = {
                uicSource: this.uic,
                renderQ: this.renderQ,
                xsPath: xsPath,
                blockRoot: this.blockRoot
            };

        return  {
            make: requireBuild.bind( thisObj )
        };
    }
    else
        // this should be a 'real' node module
        return  require(modPath);
}


function  importUICFun(packPath)  {
    let  idx = this.blockRoot.indexOf('/themes/'),
         uicRoot = this.blockRoot.substring(0, idx) + '/wcomp/';
    let  thisObj = {
            uicSource: this.uic,
            renderQ: this.renderQ,    
            packPath: packPath,
            uicRoot: uicRoot
         };

    return  {
        make: importBuild.bind( thisObj )
    }
}


/**
 * 
 * @param {*} uic 
 * @param {*} id 
 * @param {*} params 
 * @param {*} ctx 
 * @param {*} ep end-point specification
 */
function  makeElement(uic, id, params, ctx, ep)  {
    let  elm,
         uicPath = ep.uicPath;

    try  {
        elm = uic.make(params || {}, ctx);

        let  clazName = toClassName( uicPath.replace(/\\/gi, '') );
        elm.id = id;
        elm.clazName = clazName;
        elm.endpoint = ep.endpID  ?  (uicPath + '/' + ep.endpID) : uicPath;

        if (uic.uicList)
            elm.uicList = uic.uicList;

        //elm.src = uic.src;
        if (uic.makeCtrl)  {
            elm.src = 'exports.makeCtrl = ' + uic.makeCtrl.toString();
            elm.srcLength = uic.makeCtrl.length;
        }
        else
            elm.src = '';
        elm.src = uic.makeCtrl  ?  'exports.makeCtrl = ' + uic.makeCtrl.toString() : '';

        if (ctx && ctx.uri)
            // this is a block not just a wcomp 
            elm.ctx = ctx;

        elm.params = params;

        if (!elm.isUIC)
            throw  "The root tag of a UIC should be created by xs.uic() not xs.html()";
    }
    catch (e)  {
        elm = xs.reportError('prog', '[' + uicPath + '] has errors when building HTML. Errors as:')
                .add('pre', null, e.stack || e.message || e);
    }

    return  elm;
}


function  modelError(uic, mdata, uicPath)  {
    let  elm;
    try  {
        if (uic.modelError)
            elm = uic.modelError(mdata.errCode, mdata.message);
        else
            elm = xs.reportError('model', '[' + uicPath + '] failed to run model. Error shown as : ' + mdata.errCode + '-- ' + mdata.message );
    }
    catch (e)  {
        elm = xs.reportError('prog', '[' + uicPath + '] failed to report model errors. Details as:')
                .add('pre', null, e.stack);
    }

    return  elm;
}


function  interpret(src, modPath, blockRoot, renderQ)  {
    let  exportMock = {uicList: []},
         require = requireFun;

    (function(exports) {
        let  ctrl = {},
             thisObj = {
                uic: exportMock,
                renderQ: renderQ,
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