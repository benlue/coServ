var  fs = require('fs'),
	 path = require('path'),
	 siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
		 bkName = ctx.bi.query.bkName,
		 bkType = ctx.bi.query.bkType;
	//console.log('caCode: %s, bkName is %s, bkType is %s', caCode, bkName, bkType);

	if (bkType === 'model')  {
		var  modelRoot = path.join(siteUtil.getRootWWW(ctx, caCode), './blocks/modules'),
			 modelPath = path.join(modelRoot, bkName + '.js');

		readFile(modelPath, cb);
	}
	else  if (bkType === 'xs' || bkType === 'phs')  {
		let  blockRoot = path.join(siteUtil.getRootWWW(ctx, caCode), './blocks/views'),
			 bkPath = path.join(blockRoot, bkName + '.' + bkType);

		readFile(bkPath, cb);
	}
	else  {
		var  blockRoot = path.join(siteUtil.getRootWWW(ctx, caCode), './blocks/views'),
			 bkPath = path.join(blockRoot, bkName);

		fs.readdir(bkPath, function(err, files) {
			if (err)
				return  cb({
					errCode: 1,
					message: 'The block is not found.',
					value: ''
				});

			var  filePath;
			for (var i in files)  {
				var  postFix = files[i].split('.')[1];
				if (postFix === bkType)  {
					filePath = path.join(bkPath, files[i]);
					break;
				}
			}

			if (filePath)
				readFile(filePath, cb);
			else
				cb({
					errCode: 3,
					message: 'No such a block file.',
					value: ''
				});
		});
	}
}


function  readFile(fname, cb)  {
	fs.readFile( fname, {encoding: 'utf8'}, function(err, data) {
		if (err)
			cb({
				errCode: 2,
				message: 'Cannot read the block file',
				value: ''
			});
		else
			cb({
				errCode: 0,
				message: 'Ok',
				value:  data
			});
	});
}