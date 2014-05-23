/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  request = require('request'),
     xml2js = require('xml2js');

var  RETRIEVE_FAIL = 1,
     PARSE_FAIL = 2;


exports.run = function run(inData, callback)  {
    // default to Yahoo/news/entertainment
    var  thisOp = this,
         url = inData.url || 'http://news.yahoo.com/rss/entertainment';

    request(url, function(err, resp, body) {
        if (err)
            callback( {errCode: RETRIEVE_FAIL, message:'Unable to retrieve the Yahoo news RSS list.'} );
        else  {
            var  parser = new xml2js.Parser();
            parser.parseString( body, function(err, result) {
                if (!err)  {
                    //console.log( body );
                    var  channel = result.rss.channel[0],
                         items = channel.item,
                         rssList = [],
                         rtnValue = {channel: channel.title, list: rssList};

                    if (items)  {
                        for (var i = 0, len = items.length; i < len; i++)  {
                            var  item = {
                                title: items[i].title
                            };
                            rssList.push( item );
                        }
                    }

                    callback( {errCode: 0, message:'Ok', value: rtnValue} );
                }
                else
                    callback( {errCode: PARSE_FAIL, message:'Unable to parse the RSS list.'} );
            });
        }
    });
};
