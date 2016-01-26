var  fs = require('fs'),
	 path = require('path'),
	 siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode;

	if (caCode)  {
		var  wcompPath = path.join(siteUtil.getRootWWW(ctx, caCode), './wcomp');

		fs.readdir(viewPath, function(err, dirList) {
			if (err)
				cb({errCode: 1, message: 'Cannot read the website design.'});
			else  {
				var  list = [],
					 pathLen = viewPath.length + 1;

				dirList.map(function (file) {
			    	return path.join(viewPath, file);
			    }).filter(function (file) {
			    	return fs.statSync(file).isDirectory();
			    }).forEach(function (file) {
			    	var  layoutName = file.substring(pathLen);
			    	
			    	list.push({
						title: layoutName,
						arg: layoutName
					});
			    });

				cb({
					errCode: 0,
					message: 'Ok',
					value: {
						list: list
					}
				});
			}
		});
	}
	else
		cb({
			errCode: 0,
			message: 'Ok',
			list: []
		})
}