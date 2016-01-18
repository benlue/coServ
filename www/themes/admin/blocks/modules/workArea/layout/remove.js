var  async = require('async'),
	 fs = require('fs'),
     path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  inData = ctx.bi.query,
         theme = inData.theme,
         layout = inData.layout,
         rootPath = path.join(__dirname, '../../../../../', theme);

    // first, clear up layout map...
    var  lm = path.join(rootPath, 'layoutMap.json');
    fs.readFile(lm, 'utf8', function(err, data) {
    	if (err)
    		cb({
          		errCode: 1,
          		message: "Unable to read the 'layoutMap' file."
        	});

    	var  lmap = JSON.parse(data),
    		 hasUpdated = false;

    	for (var k in lmap)  {
    		if (lmap[k] === layout)  {
    			delete  lmap[k];
    			hasUpdated = true;
    		}
    	}

    	if (hasUpdated)
    		fs.writeFileSync(lm, JSON.stringify(lmap, null, 4));

    	// now, let's remove the layout files
    	var  layoutDir = path.join(rootPath, 'layout/' + layout);
    	removeFiles(layoutDir, cb);
    })
}


function  removeFiles(fpath, cb)  {
	fs.readdir(fpath, function(err, files) {
		if (err)
			return  cb({
				errCode: 10,
				message: 'Failed to remove layout files.'
			});

		var  dirList = [];
		for (var i in files)  {
			var  nxPath = path.join(fpath, files[i]),
				 stats = fs.statSync( nxPath );
			if (stats.isFile())
				fs.unlinkSync( nxPath );
			else  if (stats.isDirectory())
				dirList.push( nxPath );
		}

		async.each(dirList, function(item, cb) {
			removeFiles( item, function(result) {
				if (result.errCode)
					cb( result );
				else
					cb();
			});
		}, function(err)  {
			if (err)
				cb( err );
			else
				// the directory itself has to be removed
				fs.rmdir( fpath, function(err)  {
					if (err)
						cb({
							errCode: 10,
							message: 'Failed to remove layout files.'
						});
					else
						cb({
							errCode: 0,
							message: 'Ok'
						});
				});
		});
	});
}