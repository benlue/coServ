var  fs = require('fs'),
     path = require('path'),
     config,
     siteCache;

exports.getRootWWW = function(ctx, caCode, device)  {
    requireSiteCache(ctx);

    device = device || 'desktop';
    var  wsite = siteCache.lookupByCode( caCode );
    return  wsite.getRootPath(device);
}


exports.getSitesJSON = function(ctx)  {
    if (!config)
        config = require( path.join(ctx.basePath, './server/config.js'));

    return  path.join(config.getWWW(), 'sites.json');
}


exports.lookupSite = function(ctx, caCode)  {
    requireSiteCache(ctx);
    return  siteCache.lookupByCode( caCode );
}


exports.reloadSites = function(ctx)  {
	requireSiteCache(ctx);

    siteCache.reload();
}


exports.resetBlockMap = function(ctx, caCode)  {
    requireSiteCache(ctx);

    var  website = siteCache.lookupByCode( caCode );
    if (website)
        website.resetBlockMap();
}


exports.resetLayoutMap = function(ctx, caCode)  {
    requireSiteCache(ctx);

    var  website = siteCache.lookupByCode( caCode );
    if (website)
        website.resetLayoutMap();
}


function  requireSiteCache(ctx)  {
    if (!siteCache)
        siteCache = require(path.join(ctx.basePath, './server/SiteCache.js'));
}