/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2015 Gocharm Inc.
 */
var  engine = require('./ApiEngine.js');

/**
 * Possible properties of 'inData':
 * .caCode: if the request is issued to other client apps.
 * .url: the endpoint
 * .id: the identifier part of the endpoint
 * .post: the parameters to be posted to the API
 */
exports.postToServer = function(siteInfo, inData, req, res, cb)  {
	var  caCode = inData.caCode || siteInfo.caCode,
		 apiPath = inData.url;
	//console.log('original endpoint is ' + apiPath);

	if (apiPath.charAt(0) !== '/')
		apiPath = '/' + apiPath;

	apiPath = '/' + caCode + apiPath;
	if (inData.id)
		apiPath += '/' + inData.id;

	var  postData = inData.post || {};
	if (siteInfo.appKeys)
       	postData._key = siteInfo.appKeys[caCode];
	if (req.cookies && req.cookies.token)
		postData.token = req.cookies.token;
		
	if (postData.token)
		console.log('requested api: %s, token: %s', apiPath, postData.token);
	if (postData._key)
		console.log('requested api: %s, appKey: %s', apiPath, postData._key);
	if (!postData.token && !postData._key)
		console.log('requested api: %s. No token, no appKey.');

	postData._loc = postData._loc || mapLocaleToID(inData._loc);

	engine.request(apiPath, postData, function(ctype, apiObj, isDone)  {
		if (isDone)  {
			// if access denied, we should clear the existing token
			if (apiObj.errCode === -1000)
				engine.setToken( res, null );
		}
		
		cb( ctype, apiObj, isDone );
	});
};


function  mapLocaleToID(locale)  {
	var  locID = 1;

	switch (locale)  {
	case 'en':
		locID = 1;
		break;

	case 'zh':
		locID = 2;
		break;
	}

	return  locID;
};