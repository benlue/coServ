var  fs = require('fs'),
     path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
         bkName = inData.url,
         viewPath = path.join(siteUtil.getRootWWW(ctx, caCode), 'siteURI.json');
    //console.log('theme: %s, bkName: %s', theme, bkName);
  
  	fs.readFile(viewPath, 'utf8', function(err, data) {
      	if (err)
        	cb({
          		errCode: 1,
          		message: "Unable to read the 'siteURI' file."
        	});
      	else
          	try {
              	var  siteInfo = JSON.parse(data);
                
                if (inData.doDelete)  {
                    // delete the block
                    delete  siteInfo[bkName];
                    
                    fs.writeFile( viewPath, JSON.stringify(siteInfo, null, 4), function(err) {
                        if (err)
                            return  cb({
                                errCode: 2,
                                message: "Cannot write to the block file."
                            });
                        
                        removeBlock(ctx, theme, viewPath, bkName, cb)
                    });
                }
                else  {
                    var  bkInfo = siteInfo[bkName],
                         doCreate = false;

                    if (!bkInfo)  {
                        bkInfo = {};
                        siteInfo[bkName] = bkInfo;
                        doCreate = true;
                    }

                    if (inData.title)
                        bkInfo.title = inData.title;
                    if (inData.desc)
                        bkInfo.description = inData.desc;
                    if (inData.service)
                        bkInfo.service = inData.service;
                    bkInfo.id = inData.id;

                    fs.writeFile( viewPath, JSON.stringify(siteInfo, null, 4), function(err) {
                        if (err)
                            return  cb({
                                errCode: 2,
                                message: "Cannot write to the block file."
                            });

                        if (doCreate)
                            createBlock( ctx, theme, viewPath, bkName, cb );
                        else
                            cb({
                                errCode: 0,
                                message: 'Ok'
                            });
                    });
                }
            }
      		catch (e)  {
              	cb({
                  	errCode: 3,
                  	message: "The 'siteURI' file was broken (not a valid JSON file)."
                });
            }
    });
}


function  createBlock(ctx, theme, viewPath, bkName, cb)  {
    var  bkPath = path.join(viewPath, '../blocks/views'),
    	 fpath = bkName.split('/').slice(1);
    
    try  {
        for (var i in fpath)  {
            bkPath += '/' + fpath[i];
            //console.log('bk path is ' + bkPath);
            if (!fs.existsSync(bkPath))
                fs.mkdirSync(bkPath);
        }
        
        siteUtil.resetBlockMap(ctx, theme);
        
        cb({
            errCode: 0,
            message: 'Ok'
        });
    }
    catch (e)  {
        cb({
            errCode: 10,
            message: 'Unable to create the block directory.'
        });
    }
}


function  removeBlock(ctx, theme, viewPath, bkName, cb) {
    removeView(ctx, theme, viewPath, bkName, function(err) {
        if (err)
            return  cb({
                errCode: 20,
                message: 'Unable to read the block files.'
            });

        // remove the block module, if applicable
        viewPath = path.join(viewPath, '../blocks/modules');
        var  modFile = viewPath + bkName + '.js';
        
        try  {
            // the module file may not exist at all.
            fs.unlinkSync(modFile);

            var  fpath = bkName,
                 idx = fpath.lastIndexOf('/'),
                 removeDir = idx > 0;
            fpath = fpath.substring(0, idx);
    
            while (removeDir)  {
                fs.rmdirSync( viewPath + fpath );
    
                var  idx = fpath.lastIndexOf('/');
                if (idx > 0)  {
                    fpath = fpath.substring(0, idx);
                    removeDir = fs.readdirSync(viewPath + fpath).length === 0;
                }
                else
                    removeDir = false;
            }
        }
        catch(e)  {}
        
        cb({
            errCode: 0,
            message: 'Ok'
        });
    });
}


function  removeView(ctx, theme, viewPath, bkName, cb) {
    var  viewPath = path.join(viewPath, '../blocks/views');

    fs.readdir(viewPath + bkName, function(err, files)  {
        if (err)
            return  cb(err);

        var  removeDir = true,
             bkPath = viewPath + bkName,
             fpath = bkName;

        for (var i in files)  {
            var  f = path.join(bkPath, files[i]),
                 stats = fs.statSync(f);

            if (stats.isFile())
                fs.unlinkSync( f );
            else  if (stats.isDirectory())
                removeDir = false;
        }

        // trace back to see if we need to remove along the directory path.
        while (removeDir)  {
            fs.rmdirSync( viewPath + fpath );

            var  idx = fpath.lastIndexOf('/');
            if (idx > 0)  {
                 fpath = fpath.substring(0, idx);
                 removeDir = fs.readdirSync(viewPath + fpath).length === 0;
            }
            else
                removeDir = false;
        }

        siteUtil.resetBlockMap(ctx, theme);

        cb();
    });
}