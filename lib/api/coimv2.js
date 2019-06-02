/*!
 * coServ
 * authors: Ben Lue
 * Copyright(c) 2015 ~ 2018 Gocharm Inc.
 */
const  engine = require('./ApiEngine.js');

const  INVALID_TOKEN_ERR = -3,
	   TOKEN_EXPIRE_ERR = -4;

/**
 * Possible properties of 'inData':
 * .url: the endpoint. Website developers have to provide the complete path
 * .post: the parameters to be posted to the API
 * .id: endpoint id
 * .locale: locale of the request
 */
exports.postToServer = function(inData, req, res, cb)  {
	if (req.cookies && req.cookies.token)  {
		let  token = req.cookies.token;
		issueRequest(inData, req, res, token, cb);
	}
	else
		getToken(inData, req, res, cb);
};


function  getToken(inData, req, res, cb)  {
	var  headers = {
			 "x-deva-appcode": inData.appCode,
			 "x-deva-appkey": inData.appKey,
			 "x-deva-locale": inData.locale
		 };

	setClientKey(req, headers);

	engine.request("/@admin/token/request", null, {headers: headers}, function(ctype, apiObj, isDone) {
		if (isDone)  {
			if (apiObj.code)
				return  cb(ctype, apiObj, true);

			if (apiObj.token && apiObj.token.token)  {
				let  token = apiObj.token.token;
				engine.setToken( res, token, true /* isGuest */ );
				
				issueRequest(inData, req, res, token, cb);
			}
			else
				cb({
					code: INVALID_TOKEN_ERR,
					message: 'Not authorized to access the API services.'
				});
		}
	});
};


function issueRequest(inData, req, res, token, cb)  {
	if (token && token[0] === '!')
		token = token.slice(1);
		
	let  headers = {
		 	"x-deva-token": token,
			"x-deva-appcode": inData.appCode,
			"x-deva-locale": inData.locale
		 },
		 postData = inData.post || {};

	// if token is not valid, we'll need app-key
	if (inData.appKey)
		headers['x-deva-appkey'] = inData.appKey;

	setClientKey(req, headers);

	let  apiPath = inData.url;
	if (apiPath.charAt(0) !== '/')
		apiPath = '/' + apiPath;
	if (inData.id)
		apiPath += '/' + inData.id;
	//console.log('http headers:\n' + JSON.stringify(headers, null, 4));

	engine.request(apiPath, postData, {headers: headers}, function(ctype, apiObj, isDone) {
		if (isDone)  {
			if (apiObj.code === INVALID_TOKEN_ERR || apiObj.code === TOKEN_EXPIRE_ERR)  {
				//engine.setToken( res, null );
				getToken(inData, req, res, cb);
			}
			else
				cb( ctype, apiObj, true );
		}
		else
			cb( ctype, apiObj, false );
	});
}


function  setClientKey(req, headers)  {
	let  clientKey = req.headers['X-Real-IP'] || req.headers['X-Forwarded-For'];
	if (!clientKey && req.connection)
		clientKey = req.connection.remoteAddress;

	// ::1, local host IP of IPv6
	if (clientKey && clientKey.slice(0, 2) != '::')  {
		let  idx = clientKey.lastIndexOf(':');
		headers['x-deva-clientkey'] = idx >= 0  ?  clientKey.substring(idx+1) : clientKey.split(',')[0];
	}
}