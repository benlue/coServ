var  async = require('async'),
	 fs = require('fs'),
     path = require('path'),
	 siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
         wcomp = inData.wcomp,
         wcompPath = path.join( siteUtil.getRootWWW(ctx, caCode), '../../wcomp' );

    // remove the leading and trailing '/'
    wcomp = wcomp.substring(1);
    if (wcomp[wcomp.length-1] === '/')
        wcomp = wcomp.substring(0, wcomp.length-1);

    removePath(wcompPath, wcomp, function(err)  {
        if (err)
            cb({
                errCode: 1,
                message: 'Unable to remove the wcomp'
            });
        else
            cb({
                errCode: 0,
                message: 'Ok'
            });
    });
}


function  removePath(basePath, fpath, cb)  {
    var  idx = fpath.indexOf('/');
    if (idx > 0)  {
        var  curPath = fpath.substring(0, idx),
             nBase = path.join(basePath, curPath),
             nPath = fpath.substring(idx+1);

        removePath(nBase, nPath, function(err)  {
            if (err)
                cb(err);
            else
                fs.readdir( nBase, function(err, files) {
                    if (err)
                        cb(err);
                    else  {
                        if (files.length)
                            cb();
                        else
                            fs.rmdir(nBase, cb);
                    }
                });
        });
    }
    else
        removeFiles( path.join(basePath, fpath), cb );
}


function  removeFiles(fpath, cb)  {
    fs.readdir(fpath, function(err, files) {
        if (err)
            return  cb(err);

        var  isEmpty = true;
        
        for (var i in files)  {
            var  nxPath = path.join(fpath, files[i]),
                 stats = fs.statSync( nxPath );
            if (stats.isFile())
                fs.unlinkSync( nxPath );
            else  if (stats.isDirectory())
                isEmpty = false;
        }
        
        if (isEmpty)
            fs.rmdir(fpath, cb);
        else
            cb();
    });
}