/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2015 Gocharm Inc.
 */
var  engine = require('./ApiEngine.js'),
	 localeMap = require('../util/localeMap.js');

var  INVALID_TOKEN_ERR = -3,
	 TOKEN_EXPIRE_ERR = -4;
/**
 * Possible properties of 'inData':
 * .url: the endpoint. Website developers have to provide the complete path
 * .post: the parameters to be posted to the API
 */
exports.postToServer = function(siteInfo, inData, req, res, cb)  {
	if (req.cookies && req.cookies.token)  {
		var  token = req.cookies.token;
		issueRequest(siteInfo, inData, req, res, token, cb);
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
	
	var  clientKey = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
	if (!clientKey && req.connection)
		clientKey = req.connection.remoteAddress;

	if (clientKey)  {
		var  idx = clientKey.lastIndexOf(':');
		headers['x-deva-clientkey'] = idx >= 0  ?  clientKey.substring(idx+1) : clientKey.split(',')[0];
	}
	//console.log('headers:\n' + JSON.stringify(headers, null, 4));

	engine.request("/@admin/token/request", null, {headers: headers}, function(ctype, apiObj, isDone) {
		if (isDone)  {
			if (apiObj.code)
				cb(ctype, apiObj, true);

			var  token ='!' + apiObj.token.token;
			engine.setToken( res, token );
			issueRequest(siteInfo, inData, req, res, token, cb);
		}
	});
};


function issueRequest(siteInfo, inData, req, res, token, cb)  {
	var  caCode = siteInfo.caCode,
		 apiPath = inData.url,
		 headers = {
		 	"x-deva-token": token[0] === '!'  ?  token.substring(1) : token,
		 	"x-deva-appcode": caCode
		 },
		 postData = inData.post || {},
		 locale = postData._loc || localeMap.localeToID(inData._loc);
	
	var  clientKey = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
	if (!clientKey && req.connection)
		clientKey = req.connection.remoteAddress;

	if (clientKey)  {
		var  idx = clientKey.lastIndexOf(':');
		headers['x-deva-clientkey'] = idx >= 0  ?  clientKey.substring(idx+1) : clientKey;
	}

	if (locale)
		headers['x-deva-locale'] = locale;

	if (apiPath.charAt(0) !== '/')
		apiPath = '/' + apiPath;
	if (inData.id)
		apiPath += '/' + inData.id;

	engine.request(apiPath, postData, {headers: headers}, function(ctype, apiObj, isDone) {
		if (isDone)  {
			if (apiObj.code === INVALID_TOKEN_ERR || apiObj.code === TOKEN_EXPIRE_ERR)  {
				//engine.setToken( res, null );
				getToken(siteInfo, inData, req, res, cb);
			}
			else  {
				if (apiObj.token)
					apiObj.token = apiObj.token.token;

				apiObj.errCode = apiObj.code;
				delete  apiObj.code;
				cb( ctype, apiObj, isDone );
			}
		}
		else
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