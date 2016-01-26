var  cfg = require('../../config.json'),
     fs = require('fs'),
     path = require('path');

// first dealing with the www directory
var  wwwPath,
     dftWWW = path.join(__dirname, '../../www/');

if (cfg.server)
    wwwPath = cfg.server.wwwPath;

wwwPath = (wwwPath || cfg.wwwPath || dftWWW).replace(/\\/g, '/');

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
