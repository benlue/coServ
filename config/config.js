var  path = require('path');

// first dealing with the www directory
var  wwwPath,
     dftWWW = path.join(__dirname, '../../www/'),
     coServOption;
    
exports.init = function(option)  {
    coServOption = option;
    
    if (option.server)
        wwwPath = option.server.wwwPath;

    wwwPath = (wwwPath || option.wwwPath || dftWWW).replace(/\\/g, '/');

    if (option.server.maxSockets)
        require('http').globalAgent.maxSockets = option.server.maxSockets;
}

exports.getWWW = function()  {
    return  wwwPath;
}

exports.getPort = function()  {
	return  coServOption.server.port || 8080;
}

exports.getApiEngine = function()  {
    return  coServOption.apiEngine;
}

exports.getServer = function()  {
    return  coServOption.server;
}

exports.getRPC = function()  {
    return  coServOption.rpc;
}