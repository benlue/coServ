var  async = require('async'),
	 fs = require('fs'),
	 path = require('path'),
	 SiteCache;

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
         theme,
         sitesFile = path.join(__dirname, '../../../../../sites.json');

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

                if (inData.title)
                    siteInfo.title = inData.title;
                if (inData.locale)
                    siteInfo.locale = inData.locale;
                if (inData.homePage)
                    siteInfo.home = inData.homePage;

                return  fs.writeFile( sitesFile, JSON.stringify(sites, null, 4), function(err) {
                    if (err)
                        cb({
                            errcode: 2,
                            message: 'Unable to update the sites.json file.'
                        });
                    else  {
                        // ok. we can now reload the site cache to have the new website taking effect.
                        if (!SiteCache)
                            SiteCache = require(path.join(ctx.basePath, './server/SiteCache.js'));

                        SiteCache.reload();

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
	var  inData = ctx.bi.query,
         domain = inData.domain,
         theme,
         wwwRoot = path.join(__dirname, '../../../../../');

    async.series([
    	function(cb)  {
    		var  sitesFile = path.join(wwwRoot, './sites.json');
    		fs.readFile(sitesFile, function(err, data) {
    			if (err)
    				return  cb(err);

    			var  sites = JSON.parse(data),
    				 siteInfo = sites[domain];

    			if (siteInfo)  {
    				theme = siteInfo.theme || siteInfo.caCode;

    				delete  sites[domain];

    				fs.writeFile( sitesFile, JSON.stringify(sites, null, 4), cb);
    			}
    		});
    	},

    	function(cb)  {
    		var  contDir = path.join(wwwRoot, './cont/' + theme);
    		removeDir(contDir, cb);
    	},

    	function(cb)  {
    		var  themeRoot = path.join(wwwRoot, './themes/' + theme);
    		removeDir(themeRoot, cb);
    	},
    ],
    function(err, results) {
    	if (err)
    		cb({
    			errCode: 1,
    			message: 'Unable to delete the website.'
    		});
    	else  {
            // ok. we can now reload the site cache to have the new website taking effect.
            if (!SiteCache)
                SiteCache = require(path.join(ctx.basePath, './server/SiteCache.js'));

            SiteCache.reload();

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
	var  inData = ctx.bi.query,
         domain = inData.domain,
         caCode = inData.caCode,
         theme = caCode,
         wwwRoot = path.join(__dirname, '../../../../../');

    async.series([
    	function(cb)  {
    		var  sitesFile = path.join(wwwRoot, './sites.json');
    		fs.readFile(sitesFile, function(err, data) {
    			if (err)
    				return  cb(err);

    			var  sites = JSON.parse(data);
    			if (sites[domain])
    				cb({
    					errCode: 1,
    					message: 'The web domain has already been used.'
    				})
    			else  {
    				var  siteConfig = {
    					caCode: caCode,
    					title: inData.title || 'The [' + caCode + '] website',
    					locale: inData.locale || 'en'
    				};

    				if (inData.homePage)
    					siteConfig.home = inData.homePage;

    				sites[domain] = siteConfig;

    				fs.writeFile( sitesFile, JSON.stringify(sites, null, 4), cb);
    			}
    		});
    	},

    	function(cb)  {
    		var  contDir = path.join(wwwRoot, './cont/' + theme);
    		fs.mkdir(contDir, cb);
    	},

    	function(cb)  {
    		var  themeRoot = path.join(wwwRoot, './themes/' + theme);
    		fs.mkdir(themeRoot, function(err)  {
    			if (err)
    				return  cb(err);

    			var  p = path.join(themeRoot, 'blocks');
    			fs.mkdirSync( p );

				p = path.join(themeRoot, 'blocks/modules');
    			fs.mkdirSync( p );

    			p = path.join(themeRoot, 'blocks/views');
    			fs.mkdirSync( p );    			

    			p = path.join(themeRoot, 'layout');
    			fs.mkdirSync( p );
    			cb();
    		})
    	},

        function(cb)  {
            var  idxBlk = path.join(wwwRoot, './themes/' + theme + '/blocks/views/index');
            fs.mkdir( idxBlk, function(err) {
                if (err)
                    cb(err);
                else  {
                    var  idxFile = path.join(idxBlk, 'index.html');
                    fs.writeFile(idxFile, 'Hello World!', cb);
                }
            });
        },

    	function(cb)  {
    		var  siteURI = path.join(wwwRoot, './themes/' + theme + '/siteURI.json'),
                 bkInfo = {
                    "/index": {id: "no"}
                 };
    		fs.writeFile( siteURI, JSON.stringify(bkInfo, null, 4), cb);
    	},

    	function(cb)  {
    		var  layoutMap = path.join(wwwRoot, './themes/' + theme + '/layoutMap.json');
    		fs.writeFile( layoutMap, '{}', cb);
    	},

    	function(cb)  {
    		var  layoutDir = path.join(wwwRoot, './themes/' + theme + '/layout/default'),
    			 templatePath = path.join(ctx.basePath, '../cli/template/HLF/layout/default');

    		fs.mkdir(layoutDir, function(err) {
    			if (err)
    				cb(err);
    			else  {
    				copyLayoutFiles(templatePath, layoutDir, ['page.html', 'page.css', 'page.inc']);
    				cb();
    			}
    		});
    	}
    ],
    function(err, results) {
    	if (err)  {
    		if (err.errCode)
    			cb( err );
    		else
    			cb({
	    			errCode: 2,
	    			message: 'Unable to create a new website.'
	    		});
    	}
    	else  {
    		// ok. we can now reload the site cache to have the new website taking effect.
    		if (!SiteCache)
            	SiteCache = require(path.join(ctx.basePath, './server/SiteCache.js'));

            SiteCache.reload();

	    	cb({
		        errCode: 0,
		        message: 'Ok'
		    });
	    }
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