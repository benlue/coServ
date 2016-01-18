var  fs = require('fs'),
	 path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  theme = inData.theme,
		 layout = ctx.bi.query.layout,
		 editMode = ctx.bi.query.mode;
	//console.log('bkName is %s, bkType is %s', bkName, bkType);

	var  layoutRoot = path.join(__dirname, '../../../../../' + theme + '/layout'),
		 layPath = path.join(layoutRoot, layout);
	
	fs.readdir(layPath, function(err, files) {
		if (err)
			return  cb({
				errCode: 1,
				message: 'The page layout is not found.',
				value: ''
			});

		var  filePath;
		for (var i in files)  {
			var  postFix = files[i].split('.')[1];
			if (postFix === editMode)  {
				filePath = path.join(layPath, files[i]);
				break;
			}
		}

		if (filePath)  {
			fs.readFile( filePath, {encoding: 'utf8'}, function(err, data) {
				if (err)
					return cb({
						errCode: 2,
						message: 'Cannot read the layout file',
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
				message: 'No such a layout file.',
				value: ''
			});
	});
}