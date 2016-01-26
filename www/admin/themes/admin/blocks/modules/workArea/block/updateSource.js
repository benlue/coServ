var  fs = require('fs'),
	 path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  inData = ctx.bi.query,
		 theme = inData.theme,
		 bkName = inData.bkName,
		 bkType = inData.bkType,
		 data = inData.data;

	if (bkType === 'model')  {
		var  modelRoot = path.join(__dirname, '../../../../../' + theme + '/blocks/modules'),
			 modPath = modelRoot,
			 fpath = bkName.split('/'),
			 plen = fpath.length-1,
			 modName = fpath[plen];
		fpath = fpath.slice(1, plen);

		try  {
	        for (var i in fpath)  {
	            modPath += '/' + fpath[i];
	            //console.log('bk path is ' + bkPath);
	            if (!fs.existsSync(modPath))
	                fs.mkdirSync(modPath);
	        }

	        var  modFile = path.join(modPath, modName + '.js');
	        fs.writeFile( modFile, data, function(err) {
				if (err)
					return  cb({
						errCode: 10,
						message: 'Failed to write to the model.'
					});

				return  cb({
					errCode: 0,
					message: 'Ok'
				});
			});
	    }
	    catch (e)  {
	        cb({
	            errCode: 10,
	            message: 'Unable to create the model directory.'
	        });
	    }
	}
	else  {
		var  blockRoot = path.join(__dirname, '../../../../../' + theme + '/blocks/views'),
			 bkPath = path.join(blockRoot, bkName);
		//console.log('bkPath is ' + bkPath);
		
		fs.readdir(bkPath, function(err, files) {
			if (err)
				return  cb({
					errCode: 1,
					message: 'The block is not found.'
				});

			var  filePath;
			for (var i in files)  {
				var  postFix = files[i].split('.')[1];
				if (postFix === bkType)  {
					filePath = path.join(bkPath, files[i]);
					break;
				}
			}

			if (!filePath)  {
				var  bp = bkName.split('/');
				filePath = bkPath + '/' + bp[bp.length-1] + '.' + bkType;
			}
			//console.log('filePath: ' + filePath);

			fs.writeFile( filePath, data, function(err) {
				if (err)
					return cb({
						errCode: 2,
						message: 'Cannot write to the block file.'
					});

				return  cb({
					errCode: 0,
					message: 'Ok'
				});
			});
		});
	}
}