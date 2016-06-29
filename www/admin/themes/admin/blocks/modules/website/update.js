var  async = require('async'),
	 fs = require('fs'),
	 path = require('path'),
     siteUtil = require('../util/siteUtil.js');

var  config,
     coServ,
	 SiteCache,
     DEFAULT_TEMP = 'base';

exports.execute = function(ctx, inData, cb)  {
	var  inData = ctx.bi.query;
	if (inData.doCreate)
		createSite(ctx, inData, cb);
	else  if (inData.doDelete)
		deleteSite(ctx, inData, cb);
    else
        updateSite(ctx, inData, cb);
}


function  updateSite(ctx, inData, cb)  {
    var  inData = ctx.bi.query,
         caCode = inData.caCode,
         wwwRoot = getWWWRoot(ctx, caCode),
         sitesFile = siteUtil.getSitesJSON(ctx);

    fs.readFile(sitesFile, function(err, data) {
        if (err)
            return  cb({
                errCode: 1,
                message: 'Unable to read the sites.json file'
            });

        var  sites = JSON.parse(data);
        for (var k in sites)  {
            var  siteInfo = sites[k];
            if (siteInfo.caCode === caCode || siteInfo.theme === caCode)  {
                if (k !== inData.domain)  {
                    delete sites[k];
                    sites[inData.domain] = siteInfo;
                }

                if (inData.sitePath)
                    siteInfo.sitePath = inData.sitePath;
                else
                    delete  siteInfo.sitePath;
                if (inData.title)
                    siteInfo.title = inData.title;
                else
                    delte  siteInfo.title;
                if (inData.locale)
                    siteInfo.locale = inData.locale;
                if (inData.homePage)
                    siteInfo.home = inData.homePage;
                else
                    delete  siteInfo.home;
                if (inData.loginPage)
                    siteInfo.login = inData.loginPage;
                else
                    delete  siteInfo.login;
                if (inData.hasOwnProperty('isProtected'))
                    siteInfo.isProtected = inData.isProtected;

                return  fs.writeFile( sitesFile, JSON.stringify(sites, null, 4), function(err) {
                    if (err)
                        cb({
                            errcode: 2,
                            message: 'Unable to update the sites.json file.'
                        });
                    else  {
                        // ok. we can now reload the site cache to have the new website taking effect.
                        siteUtil.reloadSites( ctx );

                        cb({
                            errcode: 0,
                            message: 'Ok'
                        });
                    }
                });
            }
        }

        cb({
            errcode: 3,
            message: 'No such website!'
        });
    });
}


function  deleteSite(ctx, inData, cb)  {
	async.waterfall([
    	function(cb)  {
            var  domain = inData.domain,
                 sitesFile = siteUtil.getSitesJSON(ctx);

    		fs.readFile(sitesFile, function(err, data) {
    			if (err)
    				return  cb(err);

    			var  sites = JSON.parse(data),
    				 siteInfo = sites[domain];

    			if (siteInfo)  {
    				var  caCode = siteInfo.caCode;
    				delete  sites[domain];

    				fs.writeFile( sitesFile, JSON.stringify(sites, null, 4), function(err) {
                        if (err)
                            cb(err);
                        else
                            cb(null, caCode);
                    });
    			}
    		});
    	},

    	function(caCode, cb)  {
    		var  siteDir = path.join(siteUtil.getRootWWW(ctx, caCode), '../../');
    		removeDir(siteDir, cb);
    	}
    ],
    function(err) {
    	if (err)
    		cb({
    			errCode: 1,
    			message: 'Unable to delete the website.'
    		});
    	else  {
            // ok. we can now reload the site cache to have the new website taking effect.
            siteUtil.reloadSites( ctx );

            // restart server to stop static file loading of the removed website
            if (!coServ)
                coServ = require(path.join(ctx.basePath, 'server/main.js'));
            coServ.restart();

    		cb({
    			errCode: 0,
    			message: 'Ok'
    		});
        }
    });
}


function  removeDir(dir, cb)  {
	fs.readdir(dir, function(err, files)  {
		if (err)
			cb(err);
		else  {
			async.each(files, function(fname, cb) {
				var  p = path.join(dir, fname),
					 stats = fs.statSync( p );

				if (stats.isFile())
					fs.unlink( p, cb );
				else  if (stats.isDirectory())
					removeDir( p, cb );
			},
			function(err) {
				if (err)
					cb(err);
				else
					fs.rmdir(dir, cb);
			});
		}
	})
}


function  createSite(ctx, inData, cb)  {
	var  domain = inData.domain,
         caCode = inData.caCode,
         webTemplate = inData.tempName || DEFAULT_TEMP,
         theme = caCode;

    var  sitePath,
         wwwRoot,
         adminSite = siteUtil.lookupSite(ctx, 'admin'),
         tempPath = path.join( adminSite.getRootPath(), '../../cont/resource/template/' + webTemplate );

    if (inData.sitePath)
        wwwRoot = sitePath = path.join(inData.sitePath, caCode)
    else  {
        sitePath = './' + caCode;
        wwwRoot = getWWWRoot(ctx, caCode);
    }

    async.series([
    	function(cb)  {
    		var  sitesFile = siteUtil.getSitesJSON(ctx);
    		fs.readFile(sitesFile, function(err, data) {
    			if (err)
    				return  cb(err);

    			var  sites = JSON.parse(data);
    			if (sites[domain])
                    sites['x-' + domain] = sites[domain];

				var  siteConfig = {
					caCode: caCode,
					title: inData.title || 'The [' + caCode + '] website',
                    sitePath: sitePath,
					locale: inData.locale || 'en'
				};

				if (inData.homePage)
					siteConfig.home = inData.homePage;
                if (inData.loginPage)
					siteConfig.login = inData.loginPage;

				sites[domain] = siteConfig;

				fs.writeFile( sitesFile, JSON.stringify(sites, null, 4), cb);
    		});
    	},

        function(cb)  {
            // copy the whole template
            fs.stat( wwwRoot, function(err, stats)  {
                if (err)
                    fs.mkdir(wwwRoot, function(err) {
                        if (err)
                            cb(err);
                        copyFiles(tempPath, wwwRoot, cb);
                    });
                else
                    cb();
            });
        },

        function(cb)  {
            // make sure the wcomp directory is available
            var  wcomPath = path.join(wwwRoot, 'wcomp');
            fs.stat( wcomPath, function(err, stats)  {
                if (err)
                    fs.mkdir( wcomPath, cb );
                else
                    cb();
            });
        },

        function(cb)  {
            var  oldp = path.join(wwwRoot, 'themes/' + webTemplate),
                 newp = path.join(wwwRoot, 'themes/' + caCode);
            fs.rename(oldp, newp, cb);
        }
    ],
    function(err, results) {
    	if (err)  {
    		if (err.errCode)
    			cb( err );
    		else  {
                console.log('error:\n' + JSON.stringify(err, null, 4));
    			cb({
	    			errCode: 2,
	    			message: 'Unable to create a new website.'
	    		});
            }
    	}
    	else  {
    		// ok. we can now reload the site cache to have the new website taking effect.
    		siteUtil.reloadSites( ctx );

            // restart server to enable static file loading
            if (!coServ)
                coServ = require(path.join(ctx.basePath, 'server/main.js'));
            coServ.restart();

	    	cb({
		        errCode: 0,
		        message: 'Ok'
		    });
	    }
    });
}


function  getWWWRoot(ctx, caCode)  {
    if (!config)
        config = require( path.join(ctx.basePath, './server/config.js'));

    return  path.join(config.getWWW(), './' + caCode);
}


function  copyFiles(srcPath, destPath, cb)  {
    fs.readdir(srcPath, function(err, files)  {
        if (err)
            return  cb(err);

        async.each( files, function(item, cb)  {
            var  f = path.join(srcPath, item);
            fs.stat(f, function(err, stats)  {
                if (err)
                    cb(err);
                else  {
                    var  destF = path.join( destPath, item );

                    if (stats.isFile())  {
                        fs.readFile( f, function(err, data) {
                            if (err)
                                cb(err);
                            else
                                fs.writeFile(destF, data, cb);
                        });
                    }
                    else  if (stats.isDirectory)  {
                        fs.mkdir( destF, function(err) {
                            if (err)
                                cb(err);
                            else
                                copyFiles( f, destF, cb );
                        });
                    }
                    else
                        cb();
                }
            });
        }, cb);
    });
}


/**
 * Copy layout files from templates.
 */
function  copyLayoutFiles(templatePath, layoutPath, flist)  {
	for (var i in flist)  {
		var  file = path.join(templatePath, flist[i]),
			 dstFile = path.join(layoutPath, flist[i]);

		var  data = fs.readFileSync(file);
		fs.writeFileSync(dstFile, data);
	}
}