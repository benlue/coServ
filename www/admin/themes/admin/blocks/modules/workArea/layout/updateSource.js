var  fs = require('fs'),
	 path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
		 layout = inData.layout,
		 bkType = inData.bkType,
		 data = inData.data;

	var  layoutDir = path.join(siteUtil.getRootWWW(ctx, caCode), './layout/' + layout)
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