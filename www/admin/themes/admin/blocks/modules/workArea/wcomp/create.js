var  fs = require('fs'),
     path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
	var  caCode = inData.caCode,
         wcomp = inData.wcomp,
         wcompPath = path.join(siteUtil.getRootWWW(ctx, caCode), '../../wcomp/');

    createPath(wcompPath, wcomp);
    cb({
        errCode: 0,
        message: 'Ok'
    });
}


function  createPath(compBase, wcomp)  {
    var  wp = wcomp.split('/').slice(1);

    for (var i in wp)  {
        compBase = path.join(compBase, wp[i]);

        try  {
            fs.statSync(compBase);
        }
        catch (e)  {
            fs.mkdirSync(compBase);
        }
    }
}