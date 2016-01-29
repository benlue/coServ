var  fs = require('fs'),
	 path = require('path'),
	 adm = require('adm-zip'),
	 config,
	 siteUtil = require('../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  domain = inData.domain,
		 sitePath = inData.sitePath,
		 files = inData.files;

	console.log('domain: %s, sitePath: %s', domain, sitePath);
	//console.log('do we have files? ' + (files  ?  'true' : 'false'));
	//console.log('uploaded files\n' + JSON.stringify(files, null, 4));

	var  keys = Object.keys(files);

	//if (Array.isArray(files[keys[0]]))
	//	files = files[keys[0]];

	var  sitesFile = siteUtil.getSitesJSON(ctx),
		 fileObj = files.siteFile;
	console.log('file obj:\n' + JSON.stringify(fileObj, null, 4));

	fs.readFile(sitesFile, 'utf8', function(err, data) {
		if (err)
			return  cb({
				errCode: 1,
				message: 'Unable to read the website definition (sites.json)'
			});

		try  {
			var  sites = JSON.parse(data);
			if (sites[domain])
				sites['x-' + domain] = sites[domain];

			var  destPath = getWWWRoot(ctx);
			fs.readdir( destPath, function(err, flist) {
				if (err)
					return  cb({
						errCode: 10,
						message: 'Unable to read the www directory'
					});

				// now let's extract the uploaded file
				var  zip = new adm( fileObj.path );
				zip.extractAllTo( destPath, true );

				var  nfList = fs.readdirSync(destPath),
					 caCode;
				for (var i in nfList)  {
					var  f = nfList[i];
					if (flist.indexOf(f) < 0)  {
						caCode = f;
						break;
					}
				}
				console.log('caCode: ' + caCode);

				var  siteWWW = path.join(destPath, caCode);
				fs.readFile( path.join(siteWWW, 'mySite.json'), 'utf8', function(err, data) {
					if (err)
						return  cb({
							errCode: 11,
							message: 'The website file seems to be corrupted'
						});

					var  siteInfo = JSON.parse(data);
					siteInfo.sitePath = siteWWW;
					sites[domain] = siteInfo;

					fs.writeFile(sitesFile, JSON.stringify(sites, null, 4), 'utf8', function(err) {
						if (err)
							return  cb({
								errCode: 12,
								message: 'Unable to update the sites.json file'
							});

						// ok. clean up the mess
						siteUtil.reloadSites( ctx );
						fs.unlinkSync(path.join(siteWWW, 'mySite.json'));

						cb( {
							errCode: 0,
							message: 'Ok'
						});
					});
				});

				fs.unlinkSync(fileObj.path);

				
			});
		}
		catch (e)  {
			cb({
				errCode: 2,
				message: 'The sites.json file is corrupted.'
			});
		}
	});
}


function  getWWWRoot(ctx)  {
    if (!config)
        config = require( path.join(ctx.basePath, './server/config.js'));

    return  config.getWWW();
}