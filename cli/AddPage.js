var  fs = require('fs'),
     path = require('path');

if (process.argv.length < 4)  {
    console.log('Missing the web theme and page name.\n  Try node addPage.js -h for usage.');
}
else  {
    var  caCode = process.argv[2],
         pageName = process.argv[3];
    if (caCode === '-h')  {
        console.log('node addPage.js %ca\n\t%ca: the code name of the web theme\n\t%pg: name of the new page');
    }
    else  {
        // create a new block
        var  bkPath = path.join(__dirname, '../www/themes/' + caCode + '/blocks/views');

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

            var  page = fpath[fpath.length-1];

            fs.writeFile(bkPath + '/' + page + '.html', '<div></div>', function(err) {
                if (err)
                    console.log( err );
                else  {
                    var  uriFile = path.join(__dirname, '../www/themes/' + caCode + '/siteURI.json'),
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
        catch (err)  {
            console.log('Cannot create the file with the designated path.');
        }
    }
}
