/*!
 * SSEConn.js: Server Side Event connection
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2017 Gocharm Inc.
 */
'use strict';

class  SSEConn {
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }

    get clientReq()  {
        return  this.req;
    }

    get clientResp()  {
        return  this.res;
    }

    notify(eventType, id, data, cb)  {
        this.res.write('id: ' + id + '\n', 'utf8', (err) => {
            if (err)  cb(err);
        });

        if (eventType)
            this.res.write('event: ' + eventType + '\n', 'utf8', (err) => {
                if (err)  cb(err);
            });

        let  dataMsg = data  ?  "data: " + data + '\n\n' : '\n';
        this.res.write(dataMsg, 'utf8', (err) => {
            cb(err);
        });
    }
}

module.exports = SSEConn;