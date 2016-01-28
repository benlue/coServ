var  archiver = require('archiver'),
	 fs = require('fs'),
	 path = require('path'),
	 siteUtil = require('../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = ctx.bi.id,
		 cwd = path.join(siteUtil.getRootWWW(ctx, caCode), '../../../' + caCode),
		 archive = archiver('zip');
	
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
}