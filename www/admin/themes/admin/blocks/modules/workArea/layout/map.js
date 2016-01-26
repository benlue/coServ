var  fs = require('fs'),
	 path = require('path');

exports.execute = function(ctx, inData, cb)  {
	var  inData = ctx.bi.query,
         theme = inData.theme,
         layout = inData.layout,
         mapFile = path.join(__dirname, '../../../../../', theme + '/layoutMap.json');

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