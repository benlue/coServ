var  fs = require('fs'),
	 path = require('path'),
	 sitePath = path.join(__dirname, '../../../../../../sites.json');
	 //console.log('sites.json path: ' + wwwPath);

exports.execute = function(ctx, inData, cb)  {
	fs.readFile(sitePath, function(err, data) {
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
						arg: site.theme || site.caCode
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