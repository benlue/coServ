var  archiver = require('archiver'),
	 fs = require('fs'),
	 path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  inData = ctx.bi.query,
		 caCode = inData.caCode,
		 expPath = inData.expPath,
		 cwd = path.join(__dirname, '../../../../../../');
		 
	var  output = fs.createWriteStream( path.join(expPath, caCode + '.zip') ),
		 archive = archiver('zip');
		 
	output.on('close', function()  {
		cb({
			errCode: 0,
			message: 'Ok'
		});
	});
	
	archive.on('error', function(err) {
		cb({
			errCode: 1,
			message: 'Unable to zip the website'
		});
	});
	
	archive.pipe( output );
	archive.bulk([
		{expand: true, cwd: cwd, src: ['*.*']}
	]);
}