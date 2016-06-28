var  fs = require('fs'),
	 path = require('path'),
	 siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode;

	if (caCode)  {
		var  viewPath = path.join(siteUtil.getRootWWW(ctx, caCode), 'siteURI.json');
		//console.log('view path: ' + viewPath);
		//console.log('bk is ' + inData.bk);

		fs.readFile(viewPath, 'utf8', function(err, data) {
			if (err)
				cb({
					errCode: 1,
					message: "Unable to read the 'siteURI' file."
				});
			else
				try  {
					var  siteInfo = JSON.parse(data),
						 list = [],
                         bk = inData.bk;

                    if (bk)  {
                        if (bk.charAt(0) != '/')
                            bk = '/' + bk;
                        
                        for (var key in siteInfo)  {
                            if (key.indexOf(bk) === 0)
                                list.push({
                                    title: key,
                                    arg: key
                                });
                        }
                    }
                    else  {
                        for (var key in siteInfo)  {
                            list.push({
                                title: key,
                                arg: key
                            });
                        }
                    }
					
					list.sort(function(a, b) {
						if (a.title < b.title)
							return  -1;
						return a.title === b.title  ?  0 : 1;
					});
					//console.log("block list:\n" + JSON.stringify(list, null, 4));

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