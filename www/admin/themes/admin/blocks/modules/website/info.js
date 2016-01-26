var  fs = require('fs'),
	 siteUtil = require('../util/siteUtil.js');

exports.execute = function(ctx, inData, cb)  {
    var  caCode = ctx.bi.id;
    
    if (caCode)  {
        var  sitesFile = siteUtil.getSitesJSON(ctx);
        fs.readFile(sitesFile, function(err, data) {
            if (err)
    			return  cb(err);
            
            var  sites = JSON.parse(data),
                 data = findSite(sites, 'caCode', caCode);
                 
            if (!data)
                data = findSite(sites, 'theme', caCode);
            
            cb({
                errCode: 0,
                message: 'Ok',
                value: data || {}
            });
        });
    }
    else
        cb({
            errCode: 0,
            message: 'Ok',
            value: {}
        });
}


function  findSite(sites, prop, caCode)  {
    var  data;
    
    for (var k in sites)  {
        var  siteInfo = sites[k];
        if (siteInfo[prop] === caCode)  {
            data = {
                domain: k,
                caCode: siteInfo.caCode,
                title: siteInfo.title,
                locale: siteInfo.locale || 'en',
                home: siteInfo.home
            };
            
            break;
        }
    }
    
    return  data;
}