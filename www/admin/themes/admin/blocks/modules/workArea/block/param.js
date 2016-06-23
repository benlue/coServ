var  fs = require('fs'),
     path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
         bkName = inData.bk,
         viewPath = path.join(siteUtil.getRootWWW(ctx, caCode), 'siteURI.json');
    //console.log('caCode: %s, bkName: %s', caCode, bkName);
    //console.log('path to the siteURI.json: ' + viewPath);
  
  	fs.readFile(viewPath, 'utf8', function(err, data) {
      	if (err)  {
        	cb({
          		errCode: 1,
          		message: "Unable to read the 'siteURI' file."
        	});
        }
        else
        	try {
              	var  siteInfo = JSON.parse(data),
              		 bkInfo = siteInfo[bkName];

              	if (bkInfo)  {
              		cb({
				        errCode: 0,
				        message: 'Ok',
				        value: bkInfo.query || {}
				    });
              	}
              	else
              		cb({
	                  	errCode: 2,
	                  	message: "This is not a valid block."
	                });
            }
            catch (e)  {
              	cb({
                  	errCode: 3,
                  	message: "The 'siteURI' file was broken (not a valid JSON file)."
                });
            }
    });
}