var  fs = require('fs'),
	 path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  theme = ctx.bi.query.theme;

	if (theme)  {
		var  viewPath = path.join(__dirname, '../../../../../' + theme + '/siteURI.json');
		//console.log('view path: ' + viewPath);

		fs.readFile(viewPath, 'utf8', function(err, data) {
			if (err)
				cb({
					errCode: 1,
					message: "Unable to read the 'siteURI' file."
				});
			else
				try  {
					var  siteInfo = JSON.parse(data),
						 list = [];

					for (var key in siteInfo)  {
						list.push({
							title: key,
							arg: key
						});
					}
					
					list.sort(function(a, b) {
						if (a.title < b.title)
							return  -1;
						return a.title === b.title  ?  0 : 1;
					});

					cb({
						errCode: 0,
						message: 'Ok',
						value: {
							list: list
						}
					});
				}
				catch (e)  {
					cb({
						errCode: 2,
						message: "The 'siteURI' file was broken (not a valid JSON file)."
					});
				}
		});
	}
	else
		cb({
			errCode: 0,
			message: 'Ok',
			value: {list: []}
		});
}