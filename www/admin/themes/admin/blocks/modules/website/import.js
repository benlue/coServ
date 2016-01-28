exports.execute = function(ctx, inData, cb)  {
	var  domain = inData.domain,
		 sitePath = inData.sitePath,
		 files = inData.files;

	console.log('domain: %s, sitePath: %s', domain, sitePath);
	console.log('do we have files? ' + (files  ?  'true' : 'false'));

	cb( {
		errCode: 0,
		message: 'Ok'
	});
}