/*!
 * SSEChannel.js: Server Side Event channel
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2017 Gocharm Inc.
 */
'use strict';

const  async = require('async'),
       SSEConn = require('./SSEConn');

class  SSEChannel {
    constructor(url) {
        this._url = url;
        this.idx = 1;
        this.clients = {};

        keepAlive(this);
    }

    set url(u)  {
        this._url = u;
    }

    get url()  {
        return  this._url;
    }

    getNextID()  {
        return  this.idx++;
    }

    addClient(req, resp)  {
        let  clientInfo = {
                id: this.getNextID(),
                conn: new SSEConn(req, resp)
             };

        // remove SSEConn when client connection is lost
        req.on('close', (err) => {
            delete  self.clients[clientInfo.id];
        });

        this.clients[clientInfo.id] = clientInfo;
    }

    notifyAll(eventType, data)  {
        // TODO: how do we keep track of messages with id
        var  id = (new Date()).toLocaleTimeString();

        async.each(this.clients, (clientInfo, cb) => {
            clientInfo.conn.notify(eventType, id, data, (err) => {
                if (err)
                    cb(clientInfo.id);
                else
                    cb(0);
            });
        }, (idx) => {
            if (idx)
                // remove non-functional clients
                delete  this.clients[idx];
        });
    }
}


/**
 * Sends a SSE every 5 seconds on a single connection to keep it alive.
 * @param {*} channel 
 */
function  keepAlive(channel)  {
    let  notifyAll = channel.notifyAll.bind(channel);
    setInterval(function() {
        notifyAll(null, null);
    }, 5000);
}

module.exports = SSEChannel;