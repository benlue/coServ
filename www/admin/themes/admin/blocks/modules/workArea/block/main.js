const  fs = require('fs'),
       path = require('path'),
       resolve = require('resolve');

var  csMain;

exports.execute = function(ctx, inData, cb)  {
    if (csMain)
        checkBlockStyle(inData, cb);
    else
        resolve('coserv', {basedir: __dirname}, (err, csPath) => {
            if (err)  {
                let  themePath = ctx.themePath,
                    idx = themePath.indexOf('www/admin/');
                csPath = path.join( themePath.substring(0, idx), './lib/server/main.js');
            }

            csMain = require( csPath );
            checkBlockStyle(inData, cb);
        });
}


function  checkBlockStyle(inData, cb)  {
    let  caCode = inData.caCode,
         config = csMain.readConfig(),
         siteInfo = path.join( config.server.wwwPath, 'sites.json'),
         sitePath;

    fs.readFile( siteInfo, {encoding: 'utf8'}, (err, txt) => {
        let  sites = JSON.parse(txt);

        for (let domain in sites)  {
            if (sites.hasOwnProperty(domain))  {
                if (sites[domain].caCode == caCode)  {
                    sitePath = path.join(config.server.wwwPath, sites[domain].sitePath);
                    break;
                }
            }
        }

        if (!sitePath)
            sitePath = path.join(config.server.wwwPath, './' + caCode);

        let  bkPath = path.join(sitePath, './themes/' + caCode + '/blocks/views' + inData.bkName + '.xs'),
             isXS = fs.existsSync(bkPath);

        cb({
            errCode: 0,
            message: 'Ok',
            value: {
                isXS: isXS
            }
        });
    });
}