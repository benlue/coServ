/*!
 * EmulateUIC: generate the UIC code of the server side
 * authors: Ben Lue
 * Copyright(c) 2018 ~ 2019 Gocharm Inc.
 */
const  fs = require('fs'),
       path = require('path'),
       Promise = require('bluebird'),
       CheckInLib = require('./CheckIn'),
       JSONH = require('./jsonh'),
       xs = require('./hAsJs.js');

exports.buildModel =  makeDataModel;
exports.checkInput = checkInParams;

exports.convertInclude = function(list)  {
    let  incList = [];

    list.forEach( item => {
        let  node;

        if (typeof item === 'string')  {
            let  idx = item.lastIndexOf(".");

            if (item.substring(idx) === '.css')
                node = xs.html('link', {
                    rel: 'stylesheet',
                    type: 'text/css',
                    href: item
                });
            else
                node = xs.html('script', {
                    type: 'text/javascript',
                    src: item
                });
        }
        else  {
            let  prop = {crossorigin: item.crossorigin || 'anonymous'};
            if (item.integrity)
                prop.integrity = item.integrity;

            if (item.href)  {
                // css
                prop.rel = item.rel || 'stylesheet';
                prop.href = item.href;

                node = xs.html('link', prop);
            }
            else  if (item.src)  {
                // js
                prop.src = item.src;
                node = xs.html('script', prop);
            }
        }

        if (node)
            incList.push( node );
    });

    incList.push( xs.html('script', {
        type: 'text/javascript',
        src: '/xs.js'
    }));

    return  incList;
}


exports.interpretXS = function(src, bdCtx)  {
    let  uic = interpret(src, bdCtx.srcPath, bdCtx.blockRoot, bdCtx);

    return  new Promise((resolve, reject) => {
        if (uic.uicList.length)
            Promise.all( uic.uicList ).then( values => {
                uic.uicList = values;
                resolve( uic );
            });
        else
            resolve( uic );
    });
}


exports.runXS = function(uic, id, bdCtx)  {
    let  xsRoot = uic.err;      // uic.err no null means syntax error   

    if (!xsRoot)  {
        let  model = bdCtx.model;
        if (model.code)
            // data model can not be generated properly. report model error!
            xsRoot = modelError(model, bdCtx.uicPath);

        if (!xsRoot)  {
            let  ctx = bdCtx.createCtx(id);

            xsRoot = makeElement(uic, id, model.value, bdCtx, ctx, {uicPath: bdCtx.uicPath});

            // if developers specify page title or description in the view function
            if (ctx.title)
                bdCtx.srvObj.title = ctx.title;
            if (ctx.description)
                bdCtx.srvObj.description = ctx.description;

            // let's save the runtime data to the root element
            xsRoot.input = bdCtx.input;
            xsRoot.isPalet = true;
        }
    }

    return  makeUICTree( xsRoot );
}


/**
 * verify input parameters.
 * 
 * @param {*} rules The input parameter rules. i.e. uic.checkIn
 * @param {*} params the actual input to a palet (or UIC)
 */
function  checkInParams(endpID, rules, params)  {
    if (rules._id)
        params._id = endpID;
    let  err = CheckInLib.verifyObjectInput(rules, '', params);
    delete  params._id;

    if (err)
        err = xs.reportError('param', err);
    return  err;

    /*
    Object.getOwnPropertyNames(rules).some( key => {
        if (key === '_id')
            // this is the endpoint ID, will do something else
            return  false;

        let  spec = rules[key],
             value = params[key];   // the parameter value

        if (typeof spec === 'string')
            spec = {type: spec};

        if (value)  {
            let  dataFormat = spec.type,
                 typeoOfFormat = typeof dataFormat;

            if (typeoOfFormat === 'function')  {
                // this usage should be deprecated. left for backward compability.
                let  hasError = false;

                if (typeoOfFormat == xs.isDate || typeoOfFormat == xs.isArray)
                    hasError = !typeoOfFormat( null, value );
                else  if (typeoOfFormat == xs.isString || typeoOfFormat == xs.isNumber || typeoOfFormat == xs.isInteger)
                    hasError = !typeoOfFormat( value );
                else
                    // typeFun here is a customized fuction
                    err = typeFun( value );

                if (hasError)  {
                    let  msg = spec.error  || 'The parameter [' + key + '] is not compliant to the requirements.';
                    err = xs.reportError('param', msg );
                }
            }
            else  if (typeoOfFormat === 'string')   {
                let  result = CheckInLib.verifyInput(typeoOfFormat, key, value);
                if (result.err)
                    err = xs.reportError('param', spec.err || result.err);
                else
                    // the result value maybe justified based on the spec
                    params[key] = result.value;
            }
            else  if (typeoOfFormat === 'object')   {
                // the input parameter is expected to be an object
                CheckInLib.verifyObjectInput(key, value);
            }
            else  if (Array.isArray(typeoOfFormat))  {
                // the input parameter is expected to be an array
            }
        }
        else  if (spec.required)
            err = xs.reportError('param', 'The paremeter [' + key + '] is required.');
        else  if (spec.default)
            params[key] = spec.default;

        return  err != null;
    });

    return  err;
    */
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
}


/**
 * One of the built-in functions of an UIC
 * @param {*} id 
 * @param {*} params 
 */
function  requireBuild(id, params)  {
    let  xsPath = this.xsPath,
         bdCtx = this.bdCtx,
         blockRoot = bdCtx.blockRoot,
         uicPath = xsPath,
         node;

    if (blockRoot.charAt(4) != '@' && blockRoot.charAt(6) != '@')
        uicPath = xsPath.substring( blockRoot.length );

    let  nxBdCtx = bdCtx.childContext(uicPath, params, false);
    //xsPath += '.xs';

    let  uic = readUIC(xsPath, blockRoot, nxBdCtx, false),
         endpID = nxBdCtx.srvObj.id;

    if (uic.then)
        node = uic.then( u => {
            return  runPalet(u, nxBdCtx, uicPath, endpID, id, params);
        });
    else
        node = runPalet(uic, nxBdCtx, uicPath, endpID, id, params);

    if (node.then)
        // if 'node' is still a promise, we need to make a little twist with its 'on' function
        node.on = (evName, func) => {return  xs.on(node, evName, func);}

    this.uicSource.uicList.push( node );
    return  node;
}


function  runPalet(uic, bdCtx, uicPath, endpID, id, params)  {
    if (uic.err)
        // uic.err not null means syntax error
        return  uic.err;

    params = params || {};
    if (uic.checkIn)  {
        // if anything is returned, it means input error
        let  xlem = checkInParams( bdCtx.endpID, uic.checkIn, params );
        if (xlem)
            return  xlem;
    }
    
    let  ctx = bdCtx.createCtx(id);
    
    return  makeDataModel(bdCtx.webSite, uic, params, ctx).then( model => {
        let  xsRoot;
        if (model.code)
            // data model can not be generated properly. report model error!
            xsRoot = modelError(model, uicPath);
        else
            model = model.value || {};

        if (!xsRoot)  {
            xsRoot = makeElement(uic, id, model, bdCtx, ctx, {uicPath: uicPath, endpID: endpID});
            // let's save the runtime data to the root element
            xsRoot.endpointID = endpID;    
            xsRoot.input = params;
            xsRoot.isPalet = true;
        }
        return  xsRoot;
    })
    .catch (err =>  {
        console.log( err.stack );
        return  xs.reportError('prog', err.message);
    });
}


function  importBuild(uicName, id, params)  {
    if (uicName.charAt(0) != '/')
        uicName = '/' + uicName;
    uicName = this.packPath + uicName;

    let  xsPath = this.uicRoot + uicName,
         bdCtx = this.bdCtx.childContext(uicName, params, true);
    bdCtx.blockRoot = this.uicRoot;

    let  uic = readUIC(xsPath, this.uicRoot, bdCtx, false),
         node;

    if (uic)  {
        if (uic.then)  {
            node = uic.then( u => {
                return  runUIC(u, bdCtx, uicName, id, params);
            });

            // if (uic.option)
            //     node.isComp = uic.option.noWrapper;
            node.on = (evName, func) => {return  xs.on(node, evName, func);}
        }
        else  {
            node = runUIC(uic, bdCtx, uicName, id, params);
            // if (uic.option)
            //     node.isComp = uic.option.noWrapper;
        }

        this.uicSource.uicList.push( node );
    }
    else
        node = xs.reportError('prog', 'Cannot find the target component: ' + xsPath);

    return  node;
}


function  runUIC(uic, bdCtx, uicName, id, params)  {
    let  node;

    if (uic.err)
        return  uic.err;

    params = params || {};
    if (uic.checkIn)  {
        // if anything is returned, it means input error
        node = checkInParams( bdCtx.endpID, uic.checkIn, params );
        if (node)
            return  node;
    }

    let  ctx = bdCtx.createCtx(id, true);
    node = makeElement(uic, id, params, bdCtx, ctx, {uicPath: uicName});
    // let's save the runtime data to the root element
    node.input = params;

    return  node;
}


function  readUIC(xsPath, blockRoot, bdCtx, canPreCompiled)  {
    let  deviceType = bdCtx.deviceType,
         palet = bdCtx.webSite.readPaletSource(xsPath, blockRoot, deviceType);
    if (palet.then)
        return  palet.then( src => {
            return  handleUICSource(src, xsPath, blockRoot, bdCtx, canPreCompiled);
        });
    else
        return  handleUICSource(palet, xsPath, blockRoot, bdCtx, canPreCompiled);

    // let  src = bdCtx.webSite.readPaletSource(xsPath, blockRoot);
    // if (src)
    //     return  interpret(src.html, xsPath, blockRoot, bdCtx);
}


/**
 * Based on the 'canPreCompiled' parameter to decide if we'll recompiled the source code or not.
 */
function  handleUICSource(palet, xsPath, blockRoot, bdCtx, canPreCompiled)  {
    let  exeCode;

    if (canPreCompiled)  {
        if (!palet.compiled)
            palet.compiled = interpret(palet.html, xsPath, blockRoot, bdCtx);
        exeCode = palet.compiled;
    }
    else
        exeCode = interpret(palet.html, xsPath, blockRoot, bdCtx);

    return  exeCode;
}


/**
 * The output is gauranteed not null.
 * TODO: need to deal with error handling
 * @param {*} webSite 
 * @param {*} uic 
 * @param {*} inData 
 * @param {*} ctx 
 */
function  makeDataModel(webSite, uic, inData, ctx)  {
    return  new Promise( resolve => {
        if (uic.model)  {
            if (typeof uic.model === 'function')
                uic.model(inData, ctx, result => resolve( result ) )
            else  if (typeof uic.model === 'string')  {
                let  ms = uic.model.split('.'),
                     modStr = ms[0],
                     func = ms[1],
                     prefix = modStr.slice(0, 5);

                if (func && (prefix === '/lib/' || prefix == '/uic/'))  {
                    let  mod = webSite.readModuleSource(modStr),
                         reqMod = {};
                    (new Function('require', 'xs', 'exports', mod.src))(require, xs, reqMod);

                    if (typeof reqMod[func] === 'function')
                        reqMod[func](inData, ctx, result => resolve(result));
                    else
                        resolve({value: inData});
                }
                else
                    resolve({value: inData});
            }
            else  {
                let  mod = uic.model;
                if (mod['xs-url'])  {
                    // this will be an option object for remote API
                }
                else
                    resolve({value: mod});
            }
        }
        else
            resolve({value: inData});
    });
}


/**
 * 
 * @param {*} phsPath the file path of the language resource file
 * @param {*} locale the desired locale
 */
function  readPhrases(xsPath, ctx, bdCtx)  {
    let  deviceType = bdCtx.deviceType,
         src = bdCtx.webSite.readPaletSource( xsPath, bdCtx.blockRoot, deviceType ).phrases;

    if (src)  {
        let  locale = bdCtx.getLocale(),
             phrases = {};

        Object.getOwnPropertyNames(src).forEach( key => {
            phrases[key] = src[key][locale];
        });

        ctx.phrases = phrases;
    }
}


function  requireFun(modPath)  {
    let  reqMod,
         modBase = this.modPath,
         prefix = modPath.slice(0, 5);

    if (prefix == '/lib/' || prefix == '/uic/')  {
        let  mod = this.bdCtx.webSite.readModuleSource(modPath);

        if (mod.compiled)
            reqMod = mod.compiled;
        else  {
            let  moduleMock = {},     
                 thisObj = {
                    bdCtx: this.bdCtx,
                    modPath: modBase
                 },
                 require = requireFun.bind( thisObj );

            // don't redefine reqMod with 'let' here
            reqMod = {};
            //console.log( JSON.stringify(module.paths, null, 4) );

            (new Function('require', 'xs', 'exports', 'module', mod.src))(require, xs, reqMod, moduleMock);
            
            if (moduleMock.exports)
                reqMod = moduleMock.exports;

            mod.compiled = reqMod;
        }
    }
    else  {
        let  fc = modPath.charAt(0);
        if (fc === '.' || fc === '/')  {
            let  xsPath,
                 jsPath;

            if (fc === '/')
                // refering to palet from the palet root
                xsPath = path.join(modBase, '../palets' + modPath).replace(/\\/g, '/');
            else
                xsPath = path.join(modBase, modPath).replace(/\\/g, '/');

            if (xsPath.slice('-3') === '.xs')
                xsPath = xsPath.slice(0, -3);
            else
                jsPath = xsPath.slice(-3) == '.js'  ?  xsPath : (xsPath + '.js');

            if (jsPath && fs.existsSync(jsPath))
                reqMod = require(jsPath);
            else  {
                let  thisObj = {
                        uicSource: this.uic,
                        bdCtx: this.bdCtx,
                        xsPath: xsPath
                    };

                reqMod = {
                    create: requireBuild.bind( thisObj )
                };
            }
        }
        else  {
            // this should be a 'real' node module
            // add the web app node_modules directory to the require path
            let  blockRoot = this.bdCtx.blockRoot,
                 idx = blockRoot.indexOf('/themes/'),
                 reqPath = blockRoot.substring(0, idx) + '/node_modules';

            if (module.paths.indexOf(reqPath) < 0)
                module.paths.splice( 0, 0, reqPath );
            //console.log( JSON.stringify(module.paths, null, 4) );
            reqMod = require(modPath);
        }
    }

    return  reqMod;
}


function  importUICFun(packPath)  {
    let  blockRoot = this.bdCtx.blockRoot,
         uicRoot

    if (blockRoot.slice(-4) === '/uic')
        // this function is invoked within a UIC, so the blockRoot is indeed the uicRoot
        uicRoot = blockRoot
    else  {
        let  idx = blockRoot.indexOf(path.sep + 'themes' + path.sep)
        uicRoot = blockRoot.substring(0, idx) + '/uic'
    }

    if (packPath.charAt(0) != '/')
        packPath = '/' + packPath;
    if (packPath.slice(-1) === '/')
        packPath = packPath.slice(0, -1);

    let  thisObj = {
            uicSource: this.uic,
            bdCtx: this.bdCtx,
            packPath: packPath,
            uicRoot: uicRoot
         };

    return  {
        create: importBuild.bind( thisObj )
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
function  makeElement(uic, id, params, bdCtx, ctx, ep)  {
    let  elm,
         uicPath = ep.uicPath.replace(/\\/g, "/"),
         phsFile = uic.xsPath || bdCtx.blockRoot + uicPath + '.xs';

    if (id != 'xs_page')
        // make no sense to read phrases for layout
        readPhrases(phsFile, ctx, bdCtx);

    try  {
        params = params || {};
        if (typeof uic.view === 'function')
            elm = uic.view(params, ctx);
        else  if (typeof uic.view === 'string')  {
            // this palet is from a static file
            elm = xs.uic('div').addText( uic.view );
        }
        else  {
            // this is PSON
            elm = xs.uic('div', null, null, uic.css);
            elm.uicList = [];

            if (Array.isArray(uic.view))
                uic.view.forEach( (item, rowIdx) => {
                    elm.add( buildJSONH(elm, item, params, bdCtx, rowIdx));        
                });
            else
                elm.add( buildJSONH(elm, uic.view, params, bdCtx, 0));
        }

        let  clazName = toClassName( uicPath );
        elm.id = id;
        elm.clazName = clazName;
        elm.endpoint = ep.endpID  ?  (uicPath + '/' + ep.endpID) : uicPath;

        if (!elm.uicList)
            elm.uicList = uic.uicList;

        if (uic.control)  {
            //elm.src = 'exports.control = ' + uic.control.toString();
            elm.src = 'let  ctrlGen = ' + uic.control.toString();
            elm.ctrlArgCount = uic.control.length;
        }
        else
            elm.src = '';

        elm.ctx = ctx;
        elm.params = params;

        if (!elm.isUIC)
            throw  "The root tag of a UIC should be created by xs.uic() not xs.html()";
    }
    catch (e)  {
        elm = xs.reportError('prog', '[' + uicPath + '] has errors when building HTML. Errors as:')
                .add('pre', e.stack || e.message || e);
    }

    return  elm;
}


function  buildJSONH(root, jhView, inData, bdCtx, rowCount)  {
    let  row = null,
         rowv = jhView.t || jhView;

    if (Array.isArray(rowv))  {
        if (rowv.length > 1)  {
            let  attr = jhView.a || {};
            if (attr.class)
                attr.class += ' row equal no-gutters';
            else
                attr.class = 'row equal no-gutters';
            attr.id = '_r' + rowCount;

            row = xs.html('div', attr);

            rowv.forEach( (item, idx) => {
                let  prop = {
                        id: '_r' + rowCount + '_c' + idx,
                        class: 'col-1-auto'
                     };

                if (Array.isArray(item))  {
                    let  col = xs.html('div', prop)
                                 .add( buildJSONH(root, item, inData, bdCtx, rowCount+1) );
                    row.add( col );
                }
                else  {
                    if (item.a)  {
                        for (let k in item.a)
                            prop[k] = item.a[k];
                    }

                    row.add( xs.html('div', prop, parseJSONH(root, item, inData, bdCtx, rowCount)) );
                }
            });
        }

        else  if (rowv.length == 1)
            row = buildJSONH(root, rowv[0], inData, bdCtx, rowCount);
    }
    else
        row = parseJSONH(root, jhView, inData, bdCtx, rowCount);
    
    return  row;
}


/**
 * Convert a loose object to a JSONH object
 * 
 * @param {*} p the parent node 
 * @param {*} jh 
 * @param {*} inData 
 * @param {*} bdCtx 
 */
function  parseJSONH(root, jh, inData, bdCtx, rowCount)  {
    if (Array.isArray(jh.t))
        return  buildJSONH(root, jh, inData, bdCtx, rowCount+1);
    else  if (typeof jh === 'string')
        jh = {t: jh};

    let  names = jh.t.split(':');

    if (names.length <= 1)  {
        let  node;

        if (jh instanceof JSONH)
            node = jh;
        else  {
            node = xs.html(jh.t, jh.a, null, jh.css);
            if (jh.c)
                jh.c.forEach( jhc => {
                    node.add( parseJSONH( node, jhc, inData, bdCtx, rowCount ) );
                });
        }

        return  node;
    }
    else  {
        // palet(id)@server:/path/here/...
        let  node = null,
             id = jh.id || ('palet_' + bdCtx.webSite.paletIdCount()),
             proto = names[0],
             url = names[1],
             ns = proto.split('@'),
             leading = ns[0],
             server = ns.length > 1  ?  ns[1] : null;

        // check if css ID is specified
        let  idx = leading.indexOf('(');
        if (idx > 0)  {
            id = leading.slice(idx+1);
            leading = leading.slice(0, idx);

            idx = id.indexOf(')');
            if (idx > 0)
                id = id.slice(0, idx);
            else
                // syntax error
                id = null;
        }

        if (server)  {
            bdCtx = bdCtx.childContext(url, inData, false );
            bdCtx.blockRoot = proto;
        }

        if (leading === 'palet')  {
            let  thisObj = {
                    uicSource: root,
                    bdCtx: bdCtx,
                    xsPath: server  ?  url : path.join(bdCtx.blockRoot, url),
                    isRemote: server  ?  true : false
                 };
            node = requireBuild.call(thisObj, id, jh.p || inData);
        }
        else  if (leading === 'uic')  {
            let  us = url.split('/'),
                 thisObj = {
                    uicSource: root,
                    bdCtx: bdCtx,
                    packPath: server  ?  url : us.slice(0, -1).join('/'),
                    uicRoot: server  ?  proto : path.join(bdCtx.blockRoot, '../../../uic'),
                    isRemote: server  ?  true : false
                 };
            node = importBuild.call(thisObj, us.slice(-1)[0], id, jh.p || inData);
        }

        // TODO: report error on node === null?
        return  node;
    }
}


function  modelError(mdata, uicPath)  {
    let  elm;
    try  {
        if (mdata.value)  {
            let  clazName = toClassName( uicPath.replace(/\\/g, "/") );
            elm = mdata.value;
            elm.endpoint = uicPath;     // this is just a patch for css to work
            elm.clazName = clazName;
        }
        else
            elm = xs.reportError('model', '[' + uicPath + '] failed to run model. Error shown as :')
                    .add('div', '&nbsp;&nbsp;&nbsp; ' + mdata.code + '-- ' + mdata.message );
    }
    catch (e)  {
        elm = xs.reportError('prog', '[' + uicPath + '] failed to report model errors. Details as:')
                .add('pre', null, e.stack);
    }

    return  elm;
}


/**
 * compile the palet source file.
 * 
 * @param {*} src 
 * @param {*} xsPath 
 * @param {*} blockRoot 
 * @param {*} bdCtx 
 */
function  interpret(src, xsPath, blockRoot, bdCtx)  {
    let  isPSON = (src[0] == '{' || src.slice(0, 9) == 'let x = {') && src.slice(-1) == '}',
         exportMock;

    try  {
        if (isPSON)  {
            if (src[0] != '{')
                src = src.slice(8);
            exportMock = (new Function('xs', 'return ' + src))(xs);
            exportMock.uicList = [];
        }
        else  {
            exportMock = {uicList: []};

            let  modPath = xsPath.replace(/\\/g, "/").split('/').slice(0, -1).join('/'),
                 thisObj = {
                    uic: exportMock,
                    bdCtx: bdCtx,
                    modPath: modPath
                 },
                 require = requireFun.bind( thisObj ),
                 importUIC = importUICFun.bind( thisObj );

            (new Function('require', 'importUIC', 'xs', 'exports', src))(require, importUIC, xs, exportMock);
        }
        exportMock.xsPath = xsPath;
    }
    catch (e)  {
        let  stackMsg = String(e.stack.split('\n')[0]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        exportMock.err = xs.reportError('prog', 'The palet [' + xsPath.substring(blockRoot.length) + '] has syntax errors as:')
                           .add('pre', stackMsg)
    }

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