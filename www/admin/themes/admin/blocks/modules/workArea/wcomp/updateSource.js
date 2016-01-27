var  fs = require('fs'),
	 path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
		 wcomp = inData.wcomp,
		 bkType = inData.bkType,
		 data = inData.data;

	var  wcompPath = path.join(siteUtil.getRootWWW(ctx, caCode), '../../wcomp/' + wcomp);
	//console.log('wcompPath is ' + wcompPath);
	
	fs.readdir(wcompPath, function(err, files) {
		if (err)
			return  cb({
				errCode: 1,
				message: 'The wcomp directory is not found.'
			});

		var  filePath;
		for (var i in files)  {
			var  postFix = files[i].split('.')[1];
			if (postFix === bkType)  {
				filePath = path.join(wcompPath, files[i]);
				break;
			}
		}

		if (!filePath)  {
            var  wp = wcomp.split('/');
			filePath = wcompPath + '/' + wp[wp.length-1] + '.' + bkType;
        }

		//console.log('filePath: ' + filePath);

		fs.writeFile( filePath, data, function(err) {
			if (err)
				return cb({
					errCode: 2,
					message: 'Cannot write to the wcomp file.'
				});

			return  cb({
				errCode: 0,
				message: 'Ok'
			});
		});
	});
}