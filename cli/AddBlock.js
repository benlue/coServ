var  config = require('../config.json'),
     fs = require('fs'),
     path = require('path');

if (process.argv.length < 4)  {
    console.log('Missing the web theme and block name.\n  Try node addBlock.js -h for usage.');
    return;
}

var  caCode = process.argv[2],
     pageName = process.argv[3];
if (caCode === '-h')  {
    console.log('node addBlock.js %theme %bk\n\t%them: name of the web theme\n\t%bk: name of the new block');
}
else  {
    // decide the theme path
    var  tmPath = config.server.wwwPath  ?  path.join(config.server.wwwPath, './themes/') : path.join(__dirname, '../www/themes/');
    if (path.sep === '\\')
        tmPath = tmPath.replace(/\\/g, '/');
    // create a new block
    var  bkPath = path.join(tmPath, caCode + '/blocks/views');

    // check if every directory on tha path exists
    if (pageName.charAt(0) === '/')
        pageName = pageName.substring(1);

    var  fpath = pageName.split('/');
    try  {
        for (var i in fpath)  {
            bkPath += '/' + fpath[i];
            if (!fs.existsSync(bkPath))
                fs.mkdirSync(bkPath);
        }

        var  pagePath = bkPath + '/' + fpath[fpath.length-1] + '.html';
        if (fs.existsSync(pagePath))
            console.log('The block [%s] already existed.', pageName);
        else  {
            fs.writeFile(pagePath, '<div></div>', function(err) {
                if (err)
                    console.log( err );
                else  {
                    var  uriFile = path.join(tmPath, caCode + '/siteURI.json'),
                         siteURI = JSON.parse( fs.readFileSync(uriFile) );

                    siteURI['/' + pageName] = {id: "no"};
                    fs.writeFile(uriFile, JSON.stringify(siteURI, null, 4), function(err) {
                        if (err)
                            console.log('Failed to write to the siteURI.json file.')
                        else
                            console.log('Done!');
                    });
                }
            } );
        }
    }
    catch (err)  {
        console.log('Failed to create the block. Possible cause: the given web theme does not exist.');
    }
}
