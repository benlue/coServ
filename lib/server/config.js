var  cfg = require('../../config.json'),
     fs = require('fs'),
     path = require('path');

// first dealing with the www directory
var  isRelocated = false,
     wwwPath = cfg.server  ?  (cfg.server.wwwPath || cfg.wwwPath) : cfg.wwwPath,
     dftWWW = path.join(__dirname, '../../www/').replace(/\\/g, '/');

if (wwwPath)  {
    if (path.sep === '\\')
        wwwPath = wwwPath.replace(/\\/g, '/');
}
else
    wwwPath = dftWWW;

if (wwwPath != dftWWW)  {
    var  syncFile = path.join(wwwPath, 'xsSync.json');
    fs.readFile(syncFile, function(err, data) {
        var  syncObj = data  ?  JSON.parse(data) : {};

        if (!syncObj.wFront)  {
            // update the wfront.js file with the official one
            syncObj.wFront = true;
            fs.writeFile(syncFile, JSON.stringify(syncObj, null, 4), function(err) {
                var  syncFile = './cont/shared/js/wFront.js';
                fs.createReadStream(path.join(dftWWW, syncFile)).pipe(fs.createWriteStream(path.join(wwwPath, syncFile)));
            });
        }
    });
}

if (cfg.server.maxSockets)
    require('http').globalAgent.maxSockets = cfg.server.maxSockets;

exports.getWWW = function()  {
    return  wwwPath;
};

exports.getApiEngine = function()  {
    return  cfg.apiEngine;
}

exports.getServer = function()  {
    return  cfg.server;
}
