var  fs = require('fs'),
	 path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  inData = ctx.bi.query,
         theme = inData.theme,
         bkName = inData.bkName,
         viewPath = path.join(__dirname, '../../../../../' + theme + '/siteURI.json');
    //console.log('theme: %s, bkName: %s', theme, bkName);
  
  	fs.readFile(viewPath, 'utf8', function(err, data) {
      	if (err)
        	cb({
          		errCode: 1,
          		message: "Unable to read the 'siteURI' file."
        	});
      	else
          	try {
              	var  siteInfo = JSON.parse(data)[ctx.bi.query.bkName],
                     result = {url: bkName};

                for (var k in siteInfo)
                  result[k] = siteInfo[k];

              	cb({
                  	errCode: 0,
                  	message: 'Ok',
                  	value: result
                });
            }
      		catch (e)  {
              	cb({
                  	errCode: 2,
                  	message: "The 'siteURI' file was broken (not a valid JSON file)."
                });
            }
    });
}