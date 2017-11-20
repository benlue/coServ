/*!
 * SSEConn.js: Server Side Event connection
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2017 Gocharm Inc.
 */
const  SSEChannel = require('./SSEChannel');

var  _all = {};

exports.createChannel = function(host, url)  {
    var  key = host + ':' + url,
         channel = _all[key];

    if (!channel)  {
        channel = new SSEChannel(url);
        _all[key] = channel;
    }
    //console.log('setting channel... %s', key);
    //console.log(JSON.stringify(_all, null, 4));
    return  channel;
}


exports.findChannel = function(host, url)  {
    var  key = host + ':' + url;
    //console.log('finding channel... %s', key);
    //console.log('url: %s, idx: %d', _all[key]._url, _all[key].idx);
    return  _all[key];
}


/**
 * Adding a client to a channel
 * @param {*} url 
 * @param {*} req 
 * @param {*} resp 
 */
exports.addClient = function(channel, req, resp)  {
    // respond & keep the connection alive
    resp.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    channel.addClient( req, resp );
}


/**
 * Pushing event data to clients of a channel as identified by the 'url' parameter.
 * 
 * @param {*} url 
 * @param {*} eventType 
 * @param {*} data 
 */
exports.notifyClients = function(channel, eventType, data)  {
    channel.notifyAll(eventType, data);
}