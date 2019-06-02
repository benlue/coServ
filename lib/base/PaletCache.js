/*!
 * PaletCache: Cache for palets of a website
 * authors: Ben Lue
 * Copyright(c) 2018 Gocharm Inc.
 */
'use strict';

const  fs = require('fs'),
       http = require('http'),
       LRU = require('lru-cache'),
       Promise = require('bluebird'),
       MarkdownIt = require('markdown-it');

var  dftOptions = {
        host: '127.0.0.1',
        port: 8080,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
     };


class PaletCache {
    constructor(name, maxSize)  {
        this.name = name;
        this._cache = LRU({
			max: maxSize		// allow 100 palets to be cached
        });
    }


    /**
	 * 
	 * @param {*} file full path of a local file, OR the path name of a remote palet/UIC
	 * @param {*} paRoot the root path of a palet/UIC, OR the server specification like palet@coServ
	 */
    readSource(file, paRoot)  {
        let  isRemote = paRoot.charAt(4) == '@' || paRoot.charAt(6) == '@',
             ctype;

        if (isRemote)
            ctype = paRoot.charAt(4) == '@'  ?  'uic:' : 'palet:';
        else
            ctype = paRoot.slice(-4) == '/uic'  ? 'uic:' : 'palet:';

        let  cache = this._cache,
		     paName = ctype + (isRemote  ?  file : file.substring(paRoot.length)),
             palet = cache.get( paName ),
             result;
        //console.log("file: " + file + "\npaName: " + paName);
        //console.log( palet  ?  'hit!' : 'miss...');

        if (palet)  
            //result = new Promise( resolve => resolve(palet) );
            result = palet;
        else  {
            if (isRemote)  {
                result = new  Promise( (resolve, reject) =>  {
                    let  endpoint = ctype == 'uic:'  ?  '/share/uic' : '/share/palet',
                         params = {url: file};

                    loadRemote(endpoint, params, {}, (err, src) => {
                        if (err)
                            reject( err);
                        else
                            try  {
                                palet = JSON.parse( src );
                                cache.set( paName, palet );
                                //cache.set( file, palet );
                                resolve( palet );
                            }
                            catch (e)  {
                                console.log( e.stack );
                                reject( e );
                            }
                    });
                });
            }
            else  {
                let  src,
                     fpath = file.slice(-3) === '.xs'  ?  file.slice(0, -3) : file,
                     type = 'xs';

                try  {
                    file = fpath + '.xs';
                    src = fs.readFileSync(file, {encoding: 'utf8'}).trim();
                }
                catch(err)  {
                    try  {
                        file = fpath + '.html';
                        let  htmlSrc = fs.readFileSync(file, {encoding: 'utf8'}).trim();

                        // src = 'exports.view = function() {return xs.root().add("div",\'' +
                        //       htmlSrc.split('\n').join('').replace(/'/g, '\\\'') + '\');}';
                        src = 'exports.view = \`' + htmlSrc + '\`;';
                        type = 'html';
                    }
                    catch(err)  {
                        file = fpath + '.md';
                        let  md = new MarkdownIt(),
                             mdSrc = md.render(fs.readFileSync(file, {encoding: 'utf8'}).trim()).trim();

                        src = 'exports.view = \`' + mdSrc + '\`;';
                        type = 'md';
                    }
                }

                let  stat = fs.statSync(file);
                palet = {
                    html: src,
                    type: type,     // could be xs, html or md
                    htmlTime: stat.mtime.getTime()
                };
                
                fs.watchFile(file, curr => {
                    validateCache(cache, 'palet.html', paName, curr);
                });

                let  phFile = file.slice(0, -3) + '.phs';
                if (fs.existsSync(phFile))  {
                    palet.phrases = JSON.parse( fs.readFileSync(phFile, {encoding: 'utf8'}) );

                    stat = fs.statSync(phFile);
                    palet.phTime = stat.mtime.getTime();

                    fs.watchFile(phFile, curr => {
                        validateCache(cache, 'palet.phrases', paName, curr);
                    });
                }

                cache.set( paName, palet );
                //cache.set( file, palet );

                //result = new Promise( resolve => resolve(palet) );
                result = palet;
            }
		}

		return  result;
    }


    loadRemote(endpoint, postData, custOpt, handler)  {
        // check arguments...
        if (arguments.length === 2)  {
            handler = postData;
            postData = {};
        }
        else  if (arguments.length === 3)  {
            handler = custOpt;
            custOpt = null;
        }
        custOpt = custOpt || {};
    
        var  p_data = JSON.stringify( postData || {} ),
             opt = {headers: {}};
    
        for (var k in dftOptions)  {
            if (k === "headers")  {
                for (var h in dftOptions.headers)
                    opt.headers[h] = dftOptions.headers[h];
            }
            else
                opt[k] = dftOptions[k];
        }
    
        // add the customized option...
        for (var k in custOpt)  {
            if (k === 'headers')  {
                for (var h in custOpt.headers)
                    opt.headers[h] = custOpt.headers[h];
            }
            else
                opt[k] = custOpt[k];
        }
        opt.path = endpoint;
    
        // consider non-English characters
        opt.headers['Content-Length'] = Buffer.byteLength(p_data);
    
        //console.log( 'option is %s', JSON.stringify( opt, null, 4 ) );
        //console.log('post data: %s', p_data);
    
        let  postReq = http.request(opt, res => {
            let  inText = '';
            res.setEncoding('UTF-8');

            res.on('data', chunk => inText += chunk);

            res.on('end', () => {
                handler( null, inText);
            });
        });
    
        postReq.on('error', function(e) {
            console.log( e.stack );
            handler( e );
        });
    
        // post the data
        postReq.write(p_data);
        postReq.end();
    };
}

module.exports = PaletCache;


function  validateCache(cache, type, paName, curr)  {
    let  palet = cache.get( paName );

    if (palet)  {
        if (type === 'palet.html')  {
            if (palet.htmlTime <= curr.mtime.getTime())
                cache.del( paName );
        }
        else  if (type === 'palet.phrases')  {
            if (palet.phTime <= curr.mtime.getTime())
                cache.del( paName );
        }
    }
}