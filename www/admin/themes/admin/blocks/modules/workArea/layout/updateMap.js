var  fs = require('fs'),
	 path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  inData = ctx.bi.query,
         theme = inData.theme,
         layout = inData.layout,
         blockURL = inData.url,
         isRemove = inData.remove
         mapFile = path.join(__dirname, '../../../../../', theme + '/layoutMap.json');

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