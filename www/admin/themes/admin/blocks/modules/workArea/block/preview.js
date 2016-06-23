var  fs = require('fs'),
     path = require('path'),
     siteUtil = require('../../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
    var  site = siteUtil.lookupSite(ctx, inData.caCode),
         siteInfo = site.siteInfo;
    
    cb({
        errCode: 0,
        message: 'Ok',
        value: {
            domain: siteInfo.domain,
            port: siteInfo.port || 80
        }
    });
}