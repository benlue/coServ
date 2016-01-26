var  fs = require('fs'),
	 path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  inData = ctx.bi.query,
		 theme = inData.theme,
		 layout = inData.layout,
		 bkType = inData.bkType,
		 data = inData.data;

	var  layoutDir = path.join(__dirname, '../../../../../' + theme + '/layout/' + layout)
	//console.log('layoutDir is ' + layoutDir);
	
	fs.readdir(layoutDir, function(err, files) {
		if (err)
			return  cb({
				errCode: 1,
				message: 'The layout directory is not found.'
			});

		var  filePath;
		for (var i in files)  {
			var  postFix = files[i].split('.')[1];
			if (postFix === bkType)  {
				filePath = path.join(layoutDir, files[i]);
				break;
			}
		}

		if (!filePath)
			filePath = layoutDir + '/page.' + bkType;

		//console.log('filePath: ' + filePath);

		fs.writeFile( filePath, data, function(err) {
			if (err)
				return cb({
					errCode: 2,
					message: 'Cannot write to the layout file.'
				});

			return  cb({
				errCode: 0,
				message: 'Ok'
			});
		});
	});
}