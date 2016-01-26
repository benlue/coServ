var  fs = require('fs'),
	 path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
         layout = inData.layout,
         mapFile = path.join(siteUtil.getRootWWW(ctx, caCode), 'layoutMap.json');

    fs.readFile(mapFile, function(err, data) {
    	if (err)
    		return  cb({
    			errCode: 1,
    			message: 'Cannot read the layout mapping file.'
    		});

    	var  list = [],
    		 lmap = JSON.parse(data);
    	for (var k in lmap)  {
    		if (lmap[k] === layout)
    			list.push( k );
    	}

    	return  cb({
    		errCode: 0,
    		message: 'Ok',
    		value: list
    	});
    });
}