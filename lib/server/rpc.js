const  config = require('./config.js'),
       fs = require('fs'),
       glob = require('glob'),
       jayson = require('jayson'),
       path = require('path'),
       git = require('simple-git'),
       BuildContext = require('../uic/BuildContext')
       emulator = require('../uic/EmulateUIC');

exports.start = function()  {
    let  options = config.getRPC();
    if (options)  {
		let  server = jayson.server({
                createFile: function(args, cb) {
                    createFile(args[0], args[1], args[2], cb);
                },

                createFolder: function(args, cb) {
                    createFolder(args[0], args[1], args[2], cb);
                },

                readSource: function(args, cb) {
                    readSource(args[0], args[1], args[2], cb);
                },
                
                saveSource: function(args, cb)  {
                    saveSource(args[0], args[1], args[2], args[3], cb);
                },

                commitFile: function(args, cb)  {
                    commitFile(args[0], args[1], args[2], args[3], cb);
                },

                readFileTree: function(args, cb)  {
                    readFileTree(args[0], args[1], cb);
                },

                deleteFile: function(args, cb)  {
                    deleteFile(args[0], args[1], args[2], cb);
                },

                blockGraph: function(args, cb)  {
                    genBlockGraph(args[0], args[1], args[2], cb);
                },

                uicInfo: function(args, cb)  {
                    genUICInfo(args[0], args[1], cb);
                }
		  	 });
		   
		server.tcp().listen(options.port);
		console.log('RPC server started.');
	}
}


/**
 * Read the source code of a palet.
 * 
 * @param {*} appCode 
 * @param {*} bkPath 
 * @param {*} cb 
 */
function  readSource(task, appCode, bkPath, cb)  {
    let  rootPath = getRootPath(task, appCode),
         xsPath = path.join( rootPath, bkPath );
    //console.log('read source: ' + xsPath);

    if (fs.existsSync(xsPath))  {
        fs.readFile(xsPath, 'utf8', (err, txt) => {
            if (err)  {
                console.log( err.stack );
                cb( err.message );
            }
            else
                cb(null, txt);
        });
    }
    else
        cb('The file does not exist!');
}


function  deleteFile(task, appCode, bkPath, cb)  {
    let  rootPath;
    if (task == 'Palet')
        rootPath = getBlockRoot(appCode);
    else
        rootPath = getUICRoot(appCode);

    let  xsPath = path.join( rootPath, bkPath );
    fs.unlink(xsPath, (err) => {
        cb(err);
    });
}


function  saveSource(task, appCode, bkPath, source, cb)  {
    //console.log('task: ' + task + ', appCode: ' + appCode + ', bkPath: ' + bkPath);
    let  rootPath = getRootPath(task, appCode);
    doSave(rootPath, bkPath, source, cb);
}


function  doSave(rootPath, bkPath, source, cb)  {
    let  xsPath = path.join( rootPath, bkPath );
    console.log('save to: ' + xsPath);

    if (fs.existsSync(xsPath))  {
        fs.writeFile(xsPath, source, (err) => {
            if (err)
                console.log( err.stack );
                
            cb(err);
        });
    }
    else
        cb('The file does not exist!');
}


function  readFileTree(task, appCode, cb)  {
    let  rootPath = getRootPath(task, appCode),
         pattern = task === 'Lib'  ?  '**/*.js' : '**/*.xs';

    directoryToTree(rootPath, pattern, cb);
}


function  directoryToTree(cwd, pattern, cb)  {
    glob( pattern, {cwd: cwd}, (err, files) => {
        if (err)
            return  cb(err);

        //console.log( JSON.stringify(files, null, 4) );
        let  treeRoot = {nodes: []},
             dmap = {};

        files.forEach(file => {
            let  fps = file.split('/'),
                 dname,
                 parNode = treeRoot;

            fps.forEach( (pname, idx) => {
                dname = idx ?  (dname + '/' + pname) : pname;
                                
                let  suffix = pname.slice(-3),
                     isFile =  suffix === '.xs' || suffix === '.js';
                if (isFile)  {
                    let  node = {
                            text: pname.slice(0, -3),
                            dataAttr: {url: dname}
                          };

                    parNode.nodes.push( node );
                }
                else  {
                    if (dmap[dname])
                        parNode = dmap[dname];
                    else  {
                        let  node = {
                                text: pname,
                                dataAttr: {url: dname},
                                selectable: false,
                                nodes: []
                             };

                        dmap[dname] = node;
                        parNode.nodes.push( node );
                        parNode = node;
                    }
                }
            });
        });

        cb(null, treeRoot.nodes);
    });
}


function  commitFile(task, appCode, bkPath, message, cb)  {
    let  rootPath = getRootPath(task, appCode),
         xsPath = path.join( rootPath, bkPath );

    if (fs.existsSync(xsPath))  {
        let  localPath = path.join(config.getWWW(), appCode),
             filePath;

        if (task === 'Palet')
            //filePath = 'themes/' + appCode + '/palets/' + bkPath;
            filePath = 'themes/default/palets/' + bkPath;
        else  if (task == 'UIC')
            filePath = 'uic/' + bkPath;
        else  if (task == 'Lib')
            filePath = 'lib/' + bkPath;
        //console.log('local file path: ' + filePath);

        git(localPath)
        .add([filePath])
        .commit(message)
        .push('origin', 'master', () => {
            cb();
        });
    }
    else
        cb('The palet does not exist!');

}


function  createFile(task, appCode, bkPath, cb)  {
    let  rootPath = getRootPath(task, appCode);
    newFile(rootPath, bkPath + (task == 'Lib'  ?  '.js' : '.xs'), cb);
}


function  newFile(rootPath, bkPath, cb)  {
    if (bkPath.charAt(0) === '/')
        bkPath = bkPath.slice(1);

    let  xsPath = path.join( rootPath, bkPath );
    //console.log('will create palet...' + bkPath);

    if (fs.existsSync(xsPath))
        cb('The file already exists.');
    else  {
        let  bkp = bkPath.split('/'),
             dpath = rootPath.slice(0, -1);

        // bkp.slice(0, -1): only check if directories exist
        bkp.slice(0, -1).forEach( section => {
            dpath += '/' + section;
            //console.log('dpath: ' + dpath);

            if (!fs.existsSync(dpath))
                fs.mkdirSync(dpath);
        });

        fs.writeFile(xsPath, '', (err) => {
            cb(err);
        });
    }
}


function  createFolder(task, appCode, bkPath, cb)  {
    let  rootPath = getRootPath(task, appCode);
    newFolder(rootPath, bkPath, cb);
}


function  newFolder(rootPath, bkPath, cb)  {
    if (bkPath.charAt(0) === '/')
        bkPath = bkPath.slice(1);

    let  xsPath = path.join( rootPath, bkPath );

    if (fs.existsSync(xsPath))
        cb('The target folder already exists.');
    else  {
        let  bkp = bkPath.split('/'),
             dpath = blockRoot.slice(0, -1);

        // bkp.slice(0, -1): only check if directories exist
        bkp.forEach( section => {
            dpath += '/' + section;
            //console.log('dpath: ' + dpath);

            if (!fs.existsSync(dpath))
                fs.mkdirSync(dpath);
        });

        cb();
    }
}


function  genUICInfo(appCode, uri, cb)  {
    let  cmReq = mockRequest(uri),
         bdCtx = generateBuildContext(cmReq, appCode, uri),
         client = bdCtx.srvObj.client
         clientType = client  ?  client.category : 'desktop',
         palet = bdCtx.webSite.readPaletSource( bdCtx.srcPath, bdCtx.blockRoot, clientType);

    if (palet.then)
        palet.then( p => {
            cb(null, runXS(p.html, bdCtx));
        })
        .catch( err => {
            console.log(err);
            cb( err );
        });
    else
        cb(null, runXS(palet.html, bdCtx));
}


function  runXS(src, bdCtx)  {
    return  emulator.interpretXS(src, bdCtx).then( uic => {
        if (uri.slice(-3) === '.xs')
            uri = uri.slice(0, -3);

        let  uriList = bdCtx.webSite.getUriList('desktop'),
             pageInfo = uriList[uri],
             argList = [],
             info = {
                 needID: pageInfo.id === 'yes',
                 argList: argList
             };

        if (uic.checkIn)  {
            for (let key in uic.checkIn)  {
                let  value = uic.checkIn[key],
                     item = {
                        name: key,
                        isRequired: value.isRequired || false,
                        default: value.default,
                        explain: value.explain
                     };
                argList.push( item );
            }
        }

        return  info;;
    });
}


function  genBlockGraph(appCode, uri, inData, cb)  {
    inData = inData || {appCode: 'todo'};
    let  cmReq = mockRequest(uri, inData),
         bdCtx = generateBuildContext(cmReq, appCode, uri);

    bdCtx.webSite.buildBlockModel(cmReq, bdCtx, null, (uic, result) => {
        bdCtx.model = result;

        if (uic && uic.view)  {
            let  cssID = uic.id; // || genAutoID();

            emulator.runXS(uic, cssID, bdCtx).then( xsElm => {
                let  root = nodeToGraph(xsElm);
                cb(null, root);
            })
            .catch ( (e) => {
                console.log( e.stack );
                cb( e );
            });
        }
        else
            // either a headless or incomplete palet. no graph to show
            cb(null, {name: bdCtx.uicPath});
    });
}


function  mockRequest(uri, inData)  {
    let  cmReq = {
            uri: uri,
            inData: inData || {},
            //cookies: srvObj.cookies,
            //headers: srvObj['http-headers'],
            client: {category: 'desktop'},
            locale: 'en'
         };
    return  cmReq;
}


function  generateBuildContext(cmReq, appCode, uri)  {
    let  siteCache = require('./SiteCache'),
         webSite = siteCache.lookupByCode(appCode),
         srvObj = webSite.verifyURI(cmReq, true),       // true: skip ID test
         blockRoot = getBlockRoot(appCode),
         bdCtx = new BuildContext(srvObj, webSite);

    bdCtx.uicPath = uri;
    bdCtx.blockRoot = blockRoot;
    if (uri.slice(-3) != '.xs')
        uri += '.xs';
    bdCtx.srcPath = blockRoot + uri;

    return  bdCtx;
}


function  nodeToGraph(n)  {
    let  slicePoint = n.hasOwnProperty('endpointID')  ?  -2 : -1,
         root = {
            name: n.endpoint.split('/').splice(slicePoint)[0],
            attr: {
                id: n.id,
                url: n.endpoint
            },
            input: n.input,
            isPalet: n.isPalet
         };

    if (n.isPalet)
         root.model = n.params;
    if (n.uicList.length)
        root.c = [];
    
    n.uicList.forEach( c => {
        // c could be an error message, not the actual UIC/palet
        if (c.isUIC)
            root.c.push( nodeToGraph(c) );
    });

    return  root;
}


function  getRootPath(task, appCode)  {
    let  rootPath;
    if (task === 'Palet')
        rootPath = getBlockRoot(appCode);
    else  if (task === 'UIC')
        rootPath = getUICRoot(appCode);
    else  if (task === 'Lib')
        rootPath = getLibRoot(appCode);

    return  rootPath;
}


function  getBlockRoot(appCode)  {
    let  www = config.getWWW(),
         //blockRoot = path.join(www, './' + appCode + '/themes/' + appCode + '/palets/');
         blockRoot = path.join(www, './' + appCode + '/themes/default/palets/');

    return  blockRoot;
}


function  getUICRoot(appCode)  {
    let  www = config.getWWW(),
         uicRoot = path.join(www, './' + appCode + '/uic/');

    return  uicRoot;
}


function  getLibRoot(appCode)  {
    let  www = config.getWWW(),
         uicRoot = path.join(www, './' + appCode + '/lib/');

    return  uicRoot;
}