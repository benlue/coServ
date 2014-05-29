var  fs = require('fs'),
     path = require('path');

if (process.argv.length < 4)  {
    console.log('Missing the website code and page name.\n  Try node addPage.js -h for usage.');
}
else  {
    var  caCode = process.argv[2],
         pageName = process.argv[3];
    if (caCode === '-h')  {
        console.log('node addPage.js %ca\n\t%ca: the code name of the website getting a new page\n\t%pg: name of the new page');
    }
    else  {
        var  bkPath = path.join(__dirname, '../www/themes/' + caCode + '/blocks/views/');
        // create a new block
        fs.mkdir( bkPath + pageName, function(err) {
            if (err)
                console.log( err );
            else
                fs.writeFile(bkPath + pageName + '/' + pageName + '.html', '<div></div>', function(err) {
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
        })
    }
}
