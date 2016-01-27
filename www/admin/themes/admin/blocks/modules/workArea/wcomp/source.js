var  fs = require('fs'),
	 path = require('path'),
	 siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
		 wcomp = inData.wcomp,
		 editMode = inData.mode;
	//console.log('bkName is %s, bkType is %s', bkName, bkType);

	var  compRoot = path.join(siteUtil.getRootWWW(ctx, caCode), '../../wcomp'),
		 compPath = path.join(compRoot, wcomp);
	
	fs.readdir(compPath, function(err, files) {
		if (err)
			cb({
				errCode: 1,
				message: 'The wcomp is not found.',
				value: ''
			});
		else  {
			var  filePath;
			for (var i in files)  {
				var  postFix = files[i].split('.')[1];
				if (postFix === editMode)  {
					filePath = path.join(compPath, files[i]);
					break;
				}
			}

			if (filePath)  {
				fs.readFile( filePath, 'utf8', function(err, data) {
					if (err)
						cb({
							errCode: 2,
							message: 'Cannot read the wcomp file',
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
			else
				cb({
					errCode: 3,
					message: 'No such a wcomp file.',
					value: ''
				});
		}
	});
}