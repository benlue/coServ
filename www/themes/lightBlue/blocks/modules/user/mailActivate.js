/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
 var  request = require('request');

/* This is another cross-origin example. coServe will forward the request to the tw.coimotion.com website,
 * and return the result to the cient.
 */
 exports.run = function run(inData, callback)  {
     request.post(
        {
          headers: {'content-type' : 'application/x-www-form-urlencoded'},
          url:     'http://tw.coimotion.com/mail/accActivate.wsj',
          json:    inData
        },
        /*
        {
          headers: {'content-type' : 'application/x-www-form-urlencoded'},
          url:     'http://127.0.0.1:9090/mail/accActivate.wsj',
          json:    inData
        },
        */
        function(error, response, body){
            if (error)
                callback( {errCode: 1, message: "Failed to send out the activation mail."} );
            else
                callback( {errCode: 0, message: 'Ok'});
        }
    );
 };
