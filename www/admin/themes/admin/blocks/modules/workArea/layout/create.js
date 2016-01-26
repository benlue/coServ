var  fs = require('fs'),
     path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
         layout = inData.layout,
         layoutDir = path.join(siteUtil.getRootWWW(ctx, caCode), './layout/' + layout);

    fs.stat( layoutDir, function(err, stats) {
    	if (err)  {
    		fs.mkdir( layoutDir, function(err) {
    			if (err)
    				return  cb({
    					errCode: 1,
    					message: 'Unable to create the layout directory.'
    				});

    			var  templatePath = path.join(ctx.basePath, '../cli/template/HLF/layout/default');
    			copyFiles(templatePath, layoutDir, ['page.html', 'page.css', 'page.inc']);

    			cb({
    				errCode: 0,
    				message: 'Ok'
    			});
    		});
    	}
    	else
    		return  cb({
    			errCode: 10,
    			message: 'The layout already existed.'
    		});
    })
}


/**
 * Copy layout files from templates.
 */
function  copyFiles(templatePath, layoutPath, flist)  {
	for (var i in flist)  {
		var  file = path.join(templatePath, flist[i]),
			 dstFile = path.join(layoutPath, flist[i]);

		var  data = fs.readFileSync(file);
		fs.writeFileSync(dstFile, data);
	}
}