var  async = require('async'),
	 fs = require('fs'),
	 path = require('path'),
	 siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode;

	if (caCode)  {
		var  wcompPath = path.join(siteUtil.getRootWWW(ctx, caCode), '../../wcomp'),
			 wcompList = [];

		walkPath(wcompPath, '/', wcompList, function(err)  {
			//console.log('wcomp list:\n' + JSON.stringify(wcompList, null, 4));
			cb({
				errCode: 0,
				message: 'Ok',
				value: {
					list: wcompList
				}
			});
		});
	}
	else
		cb({
			errCode: 0,
			message: 'Ok',
			value: {list: []}
		})
}


function  walkPath(baseDir, curDir, plist, cb)  {
	var  workPath = path.join(baseDir, curDir);
	//console.log('walk on path: %s', curDir);

	fs.readdir(workPath, function(err, flist)  {
		if (err)  {
			console.error( err );
			return  cb(err);
		}

		var  subList = [],
			 isComp = !flist.length && curDir !== '/';

		for (var i in flist)  {
			var  f = flist[i],
				 stats = fs.statSync( path.join(workPath, f) );

			if (stats.isDirectory())
				subList.push( path.join(curDir, f) );
			else
				isComp = isComp || stats.isFile();
		}

		if (isComp)
			plist.push( {title: curDir, arg: curDir} );

		async.each( subList, function(item, cb) {
			walkPath( baseDir, item, plist, cb);
		}, cb);
	});
}