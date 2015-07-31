/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2015 Gocharm Inc.
 */
var  engine = require('./ApiEngine.js'),
	 localeMap = require('../util/localeMap.js');

/**
 * Possible properties of 'inData':
 * .url: the endpoint. Website developers have to provide the complete path
 * .post: the parameters to be posted to the API
 */
exports.postToServer = function(siteInfo, inData, req, res, cb)  {
	if (req.cookies && req.cookies.token)  {
		var  token = req.cookies.token;
		issueRequest(siteInfo, inData, req, token, cb);
	}
	else
		getToken(siteInfo, inData, req, res, cb);
};


function  getToken(siteInfo, inData, req, res, cb)  {
	var  caCode = siteInfo.caCode,
		 headers = {
		 	"x-deva-appcode": caCode
		 };
	
	if (siteInfo.appKeys)
		headers['x-deva-appkey'] = siteInfo.appKeys[caCode];
	if (siteInfo.appSecret)
		headers['x-deva-appsecret'] = siteInfo.appSecret[caCode];
	
	if (req.connection)  {
		var  clientKey = req.connection.remoteAddress;
		if (clientKey)  {
			var  idx = clientKey.lastIndexOf(':');
			headers['x-deva-clientkey'] = idx >= 0  ?  clientKey.substring(idx+1) : clientKey;
		}
	}

	engine.request("/@admin/token/request", null, {headers: headers}, function(ctype, apiObj, isDone) {
		if (isDone)  {
			if (apiObj.code)
				cb(ctype, apiObj, true);

			var  token = apiObj.token.token;
			engine.setToken( res, token );
			issueRequest(siteInfo, inData, req, token, cb);
		}
	});
};


function issueRequest(siteInfo, inData, req, token, cb)  {
	var  caCode = siteInfo.caCode,
		 apiPath = inData.url,
		 headers = {
		 	"x-deva-token": token,
		 	"x-deva-appcode": caCode
		 },
		 postData = inData.post || {};
	
	if (req.connection)  {
		var  clientKey = req.connection.remoteAddress;
		if (clientKey)  {
			var  idx = clientKey.lastIndexOf(':');
			headers['x-deva-clientkey'] = idx >= 0  ?  clientKey.substring(idx+1) : clientKey;
		}
	}
	headers['x-deva-locale'] = postData._loc || localeMap.localeToID(inData._loc);

	if (apiPath.charAt(0) !== '/')
		apiPath = '/' + apiPath;
	if (inData.id)
		apiPath += '/' + inData.id;

	engine.request(apiPath, postData, {headers: headers}, function(ctype, apiObj, isDone) {
		if (isDone)  {
			if (apiObj.token)
				apiObj.token = apiObj.token.token;

			apiObj.errCode = apiObj.code;
			delete  apiObj.code;
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