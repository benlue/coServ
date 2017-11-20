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
        var  clientInfo = {
                id: this.getNextID(),
                conn: new SSEConn(req, resp)
             };

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

module.exports = SSEChannel;