var  fs = require('fs'),
	 path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
         layout = inData.layout,
         blockURL = inData.url,
         isRemove = inData.remove
         mapFile = path.join(siteUtil.getRootWWW(ctx, caCode), 'layoutMap.json');

    fs.readFile(mapFile, function(err, data) {
    	if (err)
    		return  cb({
    			errCode: 1,
    			message: 'Cannot read the layout mapping file.'
    		});

    	var  lmap = JSON.parse(data);

    	if (isRemove)
    		delete  lmap[blockURL];
    	else
    		lmap[blockURL] = layout;

    	fs.writeFile(mapFile, JSON.stringify(lmap, null, 4), function(err) {
    		if (err)
    			cb({
    				errCode: 2,
    				message: 'Unable to update the layout mapping.'
    			});
    		else
    			cb({
		    		errCode: 0,
		    		message: 'Ok'
		    	});
    	});
    });
}