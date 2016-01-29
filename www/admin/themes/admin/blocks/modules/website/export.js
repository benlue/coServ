var  archiver = require('archiver'),
	 fs = require('fs'),
	 path = require('path'),
	 siteUtil = require('../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = ctx.bi.id,
		 cwd = path.join(siteUtil.getRootWWW(ctx, caCode), '../../../'),
		 sitesFile = siteUtil.getSitesJSON(ctx);

	fs.readFile(sitesFile, 'utf8', function(err, data) {
		if (err)
			return  cb({
				errCode: 1,
				message: 'Unable to read the website definition (sites.json)'
			});

		try  {
			var  sites = JSON.parse(data),
				 siteInfo = getSiteInfo(caCode, sites);

			if (siteInfo)  {
				delete  siteInfo.sitePath;

				var  mySite = path.join(cwd, './' + caCode + '/mySite.json');
				fs.writeFile( mySite, JSON.stringify(siteInfo), 'utf8', function(err)  {
					if (err)
						return  cb({
							errCode: 4,
							message: 'Cannot access the source directory'
						});

					var  archive = archiver('zip');
					archive.on('error', function(err) {
						cb({
							errCode: 1,
							message: 'Unable to zip the website'
						});
					});
					
					archive.bulk([
						{expand: true, cwd: cwd, src: ['**']}
					]);
					archive.finalize();

					cb({_stream: archive});
				});
			}
			else
				cb({
					errCode: 3,
					message: 'Cannot find the website in the definition file (sites.json)'
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


function  getSiteInfo(caCode, sites)  {
	for (var k in sites)  {
		var  siteInfo = sites[k];
		if (siteInfo.caCode === caCode)
			return  siteInfo;
	}
	return  null;
}