var  fs = require('fs'),
	 siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  sitesFile = siteUtil.getSitesJSON(ctx);

	fs.readFile(sitesFile, function(err, data) {
		if (err)
			return  cb({
				errCode: 1,
				message: 'Unable to read the sites.json file'
			});

		var  sitesInfo = JSON.parse(data),
			 list = [];

		for (var key in sitesInfo)  {
			if (key.indexOf('x-') !== 0)  {
				var site = sitesInfo[key],
					item = {
						title: site.title,
						arg: site.caCode
					 };
				list.push( item );
			}
		}

		cb({
			errCode: 0,
			message: 'Ok',
			value: {
				list: list
			}
		});
	});
};