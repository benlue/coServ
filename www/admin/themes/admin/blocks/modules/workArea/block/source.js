var  fs = require('fs'),
	 path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  theme = inData.theme,
		 bkName = ctx.bi.query.bkName,
		 bkType = ctx.bi.query.bkType;
	//console.log('bkName is %s, bkType is %s', bkName, bkType);

	if (bkType === 'model')  {
		var  modelRoot = path.join(__dirname, '../../../../../' + theme + '/blocks/modules'),
			 modelPath = path.join(modelRoot, bkName + '.js');

		fs.readFile( modelPath, {encoding: 'utf8'}, function(err, data) {
			if (err)
				return  cb({
					errCode: 10,
					message: 'No such model',
					value: ''
				});

			return  cb({
				errCode: 0,
				message: 'Ok',
				value: data
			});
		});
	}
	else  {
		var  blockRoot = path.join(__dirname, '../../../../../' + theme + '/blocks/views'),
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

			if (filePath)  {
				fs.readFile( filePath, {encoding: 'utf8'}, function(err, data) {
					if (err)
						return cb({
							errCode: 2,
							message: 'Cannot read the block file',
							value: ''
						});

					return  cb({
						errCode: 0,
						message: 'Ok',
						value:  data
					});
				});
			}
			else
				cb({
					errCode: 3,
					message: 'No such a block file.',
					value: ''
				});
		});
	}
}