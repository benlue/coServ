var  fs = require('fs'),
	 path = require('path'),
	 siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
		 wcomp = inData.wcomp,
		 editMode = inData.mode;

	console.log('wcomp is %s, editMode is %s', wcomp, editMode);

	if (editMode === 'xs')  {
		let  compRoot = path.join(siteUtil.getRootWWW(ctx, caCode), '../../wcomp'),
			 compPath = path.join(compRoot, wcomp + '.xs');

		fs.readFile(compPath, {encoding: 'utf-8'}, (err, data) => {
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
		let  compRoot = path.join(siteUtil.getRootWWW(ctx, caCode), '../../wcomp'),
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
}