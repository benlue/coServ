var  fs = require('fs'),
     ncp = require('ncp'),
     path = require('path');

if (process.argv.length < 3)  {
    console.log('Missing the code name of a website.\n  Try node addSite.js -h for usage.');
}
else  {
    var  caCode = process.argv[2];
    if (caCode === '-h')  {
        console.log('node addSite.js %ca\n\t%ca: the code name of the website to be created\n\t%dn: (optional) domain name of this website');
    }
    else  {
        var  wwwPath = path.join(__dirname, '../www/'),
             tempPath = path.join(__dirname, './template/HLF')
             themePath = path.join(wwwPath, 'themes/' + caCode + '/');

        // First, let's see if the code name has been used
        var  sites = JSON.parse(fs.readFileSync( wwwPath + 'sites.json' ));
        for (var dn in sites)  {
            if (sites[dn].caCode === caCode)  {
                console.log('The code name has been used. Please try another one.');
                return;
            }
        }

        // Is there an extra parameter to specify the domain name of this website?
        var  domainName = process.argv.length > 3  ?  process.argv[3] : '127.0.0.1';

        // create the 'cont' and 'themes' directories required for a new site.
        fs.mkdirSync(wwwPath + 'cont/' + caCode);
        fs.mkdirSync(themePath);

        // copy from template
        ncp(tempPath, themePath, function(err) {
            if (err)
                console.log('Oops! Failed to copy templates to the website.');
            else  {
                // now it's time to add an entry to the siteURI.json file
                for (var dn in sites)  {
                    if (dn === domainName)  {
                        // temporarily move sites with the same domain name to 'x-'
                        sites['x-' + dn] = sites[dn];
                        delete  sites[dn];
                        break;
                    }
                }

                var  siteInfo = {caCode: caCode, title: '[' + caCode + '] WebSite', validFrom: '', validTo: '', locale: 'en', home: '/index'};
                sites[domainName] = siteInfo;
                fs.writeFile(wwwPath + 'sites.json', JSON.stringify(sites, null, 4), function(err) {
                    if (err)
                        console.log('Failed to write to the sites.json file.')
                    else
                        console.log('Done!');
                });
            }
        });
    }
}
