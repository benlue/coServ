/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  fs = require('fs'),
     path = require('path'),
     util = require('util'),
     siteLookup;

/* sitePath points to the sites.json file */
var  sitePath,
     uriPath;

 exports.setContext = function setContext(ctx)  {
     var  wwwPath = __dirname;
     if (path.sep === '\\')
         wwwPath = wwwPath.replace(/\\/, '/');
     wwwPath = path.join(wwwPath, '../../../../');

     sitePath = path.join(wwwPath, '../sites.json');
     uriPath = path.join(wwwPath, './index/siteURI.json');
     siteLookup = require(path.join(ctx.basePath, './server/SiteLookup.js'))(wwwPath);
 };


 exports.run = function run(inData, callback)  {
     // let's update the sites.json file with the received appKey
     var  sites = JSON.parse( fs.readFileSync( sitePath ) ),
          uriMap = JSON.parse( fs.readFileSync( uriPath ) ),
          demoSite = sites['127.0.0.1'];

     demoSite.caCode = inData.caCode;
     demoSite.appKeys[inData.caCode] = inData.appKey;

     var  servicePath = util.format('/%s/myPage/', inData.waCode);
     uriMap['/myPage/list'] = {id: 'no', service: servicePath + 'list'};
     uriMap['/myPage/view'] = {id: 'yes', service: servicePath + 'view'};

     fs.writeFile(uriPath, JSON.stringify(uriMap, null, 4), function(err) {
        if (err)
            callback( {errCode: 1, message: 'Failed to update the siteURI.json file.'} );
        else  {
            fs.writeFile(sitePath, JSON.stringify(sites, null, 4), function(err) {
               if (err)
                    callback( {errCode: 2, message: 'Failed to update the sites.json file with app-key.'} );
               else  {
                   siteLookup.reload();
                   callback( {errCode: 0, message:'Ok'} );
               }
            });
        }
     });
 };
