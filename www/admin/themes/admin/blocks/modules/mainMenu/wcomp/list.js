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
            wcompList.sort(function(a, b) {
                if (a.title < b.title)
                    return  -1;
                return a.title === b.title  ?  0 : 1;
            });
            
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
			let  f = flist[i],
				 compName = curDir;

			if (f.slice(-3) === '.xs')  {
				compName = curDir + '/' + f.slice(0, -3);
				plist.push( {title: compName, arg: compName} );
			}
			else  {
				let  stats = fs.statSync( path.join(workPath, f) );

				if (stats.isDirectory())
					subList.push( path.join(curDir, f).replace(/\\/g, '/') );
				else
					isComp = isComp || stats.isFile();
			}
		}

		if (isComp)
			plist.push( {title: curDir, arg: curDir} );

		async.each( subList, function(item, cb) {
			walkPath( baseDir, item, plist, cb);
		}, cb);
	});
}