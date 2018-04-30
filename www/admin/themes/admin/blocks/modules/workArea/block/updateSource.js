var  fs = require('fs'),
	 path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
		 bkName = inData.bkName,
		 bkType = inData.bkType,
		 data = inData.data;

	if (bkType === 'model')  {
		var  modelRoot = path.join(siteUtil.getRootWWW(ctx, caCode), './blocks/modules'),
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
			writeToFile(modFile, data, cb);
	    }
	    catch (e)  {
	        cb({
	            errCode: 10,
	            message: 'Unable to create the model directory.'
	        });
	    }
	}
	else  if (bkType === 'xs' || bkType === 'phs')  {
		let  blockRoot = path.join(siteUtil.getRootWWW(ctx, caCode), './blocks/views'),
			 bkPath = path.join(blockRoot, bkName + '.' + bkType);

			 writeToFile(bkPath, data, cb);
	}
	else  {
		var  blockRoot = path.join(siteUtil.getRootWWW(ctx, caCode), './blocks/views'),
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

			writeToFile(filePath, data, cb);
		});
	}
}


function  writeToFile(fname, data, cb)  {
	fs.writeFile( fname, data, function(err) {
		if (err)
			cb({
				errCode: 10,
				message: 'Failed to write to the model.'
			});
		else
			cb({
				errCode: 0,
				message: 'Ok'
			});
	});
}