var  fs = require('fs'),
     path = require('path'),
     config,
     siteCache;

exports.getRootWWW = function(ctx, caCode, device)  {
    if (!siteCache)
        siteCache = require( path.join(ctx.basePath, './server/SiteCache.js'));

    device = device || 'desktop';
    var  wsite = siteCache.lookupByCode( caCode );
    return  wsite.getRootPath(device);
}


exports.getSitesJSON = function(ctx)  {
    if (!config)
        config = require( path.join(ctx.basePath, './server/config.js'));

    return  path.join(config.getWWW(), 'sites.json');
}


exports.reloadSites = function(ctx)  {
	if (!siteCache)
        siteCache = require(path.join(ctx.basePath, './server/SiteCache.js'));

    siteCache.reload();
}


exports.resetBlockMap = function(ctx, caCode)  {
    if (!siteCache)
        siteCache = require(path.join(ctx.basePath, './server/SiteCache.js'));

    var  website = siteCache.lookupByCode( caCode );
    if (website)
        website.resetBlockMap();
}