/*!
 * Render: xs to HTML rendering utilities
 * authors: Ben Lue
 * Copyright(c) 2018 Gocharm Inc.
 */
const  emulator = require('../uic/EmulateUIC'),
       hasj = require('../uic/hAsJs');

var  _viewAutoID = 1;


exports.renderPage = function(uic, bdCtx, cb)  {
    let  page = bdCtx.webSite.readPageSource( bdCtx.srvObj.client.category, bdCtx.uicPath );
    
    emulator.interpretXS(page.html, bdCtx).then( pageUIC => {
        if (pageUIC.err)
            // the page layout itself has errors
            return  cb({body: pageUIC.err.toHTML()});

        page.compiled = pageUIC;
        renderPaletInLayout(page, uic, bdCtx, cb);
    });
}


function  renderPaletInLayout(page, uic, bdCtx, cb)  {
    let  pageUIC = page.compiled;

    if (uic.view)
        emulator.runXS(uic, 'mainBlk', bdCtx).then( body => {
            let  incList = emulator.convertInclude( pageUIC.include || [] );
            bdCtx.model = {
                value: {
                    include: incList,
                    css: page.css,
                    body: body
                }
            };

            // manually add body to the whole page UIC tree
            pageUIC.uicList.push( body );
            composePage(pageUIC, bdCtx, cb);
        })
        .catch( err => {
            console.log( err.stack );
            let  body = hasj.uic('div', 'Something wrong!');
            previewPage(pageUIC, bdCtx, body, cb);
        });
    else  {
        let  body = hasj.uic('h3', 'This is a headless page!');
        previewPage(pageUIC, bdCtx, body, cb);
    }
}


exports.renderPreview = function(uic, bdCtx, cb)  {
    let  page = bdCtx.webSite.readPageSource( bdCtx.srvObj.client.category, bdCtx.uicPath );

    emulator.interpretXS(page.html, bdCtx).then( pageUIC => {
        if (pageUIC.err)
            // the page layout itself has errors
            return  cb({body: pageUIC.err.toHTML()});        

        if (uic.view)
            emulator.runXS(uic, 'mainBlk', bdCtx).then( body => {
                let  incList = emulator.convertInclude( pageUIC.include || [] );
                bdCtx.model = {
                    value: {include: incList, body: hasj.html('div')}
                };

                // manually add body to the whole page UIC tree
                pageUIC.uicList.push( body );
                previewPage(pageUIC, bdCtx, body, cb);
            })
            .catch( err => {
                console.log( err.stack );
                let  body = hasj.uic('div', 'Something wrong!');
                previewPage(pageUIC, bdCtx, body, cb);
            });
        else  {
            let  body = hasj.uic('h3', 'This is a headless palet');
            previewPage(pageUIC, bdCtx, body, cb);
        }
    });
}


function  composePage(pageUIC, bdCtx, cb)  {
    let  space = bdCtx.webSite.siteInfo.isProduction  ?  0 : 2;

    emulator.runXS(pageUIC, 'xs_page', bdCtx).then( page => {
        let  head = page.c[0];
        if (typeof head === 'string')
            // if the layout has problems, bail out!
            throw  new Error( page.toHTML(space) );

        let  css = page.toCSS(space) + '\t._xsErr {background-color: white; color: red;}',
             js = page.toJS();
        if (js.trim())
             js = '__._xs_page = ' + js + '\n__.addToInit("xs_page");\n' +
                  '\n$(document).ready(function() {\n\t$.ajaxSetup({\n\t\tcache: false\n\t});\n\t__.initPage();\n});\n';
        
        head.add('style', {type: 'text/css'}, css)
            .add('script', js);

        let root = page,
            docType = page.attr('docType') === undefined  ?  '<!DOCTYPE HTML>\n' : (page.attr('docType') || '') + '\n';

        root.endpoint = null;	// so no wrapper div will be generated

        // if (root.attr('docType') !== undefined)
        //     docType = (root.attr('docType') || '') + '\n';

        cb({body: docType + root.toHTML(space)});
    })
    .catch( e => {
        let  html = '<body>Layout has errors as:<pre>' + (e.stack || e.message || e) + '</pre></body>';
        cb({body: html});
    });
}


function  previewPage(pageUIC, bdCtx, body, cb)  {
    emulator.runXS(pageUIC, 'xs_page', bdCtx).then( page => {
        let  head = page.c[0];
        if (typeof head === 'string')
            // if the layout has problems, bail out!
            throw  new Error( page.toHTML(2) );

        let  css = body.toCSS(2, '.' + body.clazName),
             js = body.toJS();
        if (js.trim())
             js = '__._xs_page = ' + js + '\n__.addToInit("xs_page");\n' +
                  '\n$(document).ready(function() {\n\t$.ajaxSetup({\n\t\tcache: false\n\t});\n\t__.initPage();\n});\n';
        
        head.add('style', {type: 'text/css'}, css)
            .add('script', js);

        let docType = '<!DOCTYPE HTML>\n',
            root = hasj.uic('html')
                       .add( head )
                       .add('body', body);

        if (page.attr('docType') !== undefined)
            docType = (page.attr('docType') || '') + '\n';

        cb({body: docType + root.toHTML(2)});
    })
    .catch( e => {
        let  html = '<body>Layout has errors as:<pre>' + (e.stack || e.message || e) + '</pre></body>';
        cb({body: html});
    });
}


exports.renderBlock = function(uic, bdCtx, cb)  {
    let  headers = bdCtx.srvObj['http-headers'],
         isReload = headers['x-xs-reload'] || false,
		 xs_blockID = headers['x-xs-blockid'],
         cssID = xs_blockID || genAutoID(),
         space = bdCtx.webSite.siteInfo.isProduction  ?  0 : 2;

    if (isReload == 'false' || isReload == '0')
        isReload = false;

    emulator.runXS(uic, cssID, bdCtx).then( xsElm => {
        try  {
            let  css = '';
            if (!isReload)
                css = '<style type="text/css">\n' + xsElm.toCSS(space) + '\n</style>\n';

            let  js = xsElm.toJS(isReload),
                 blkID = xsElm.id;

            if (xs_blockID)  {
                if (!isReload)
                    js = 'return  __._' + blkID + '=' + js;
            }
            else
                js = 'var _' + blkID + '__._' + blkID + '=' + js +
                     '\n__.addToInit("' + blkID + '");';

            let  htmlFG = css +
                          '<script type="text/javascript">\n' + js + '\n</script>\n' +
                          xsElm.toHTML(space);

            cb({body: htmlFG});
        }
        catch (err)  {
            console.log( err.stack );
            let  rtnObj = {
                body: hasj.reportError('view', util.format('Palet [%s] failed to create its view.', bdCtx.uicPath))
                            .add('pre', err.stack)
                            .toHTML()
            };
            cb( rtnObj );
        }
    })
    .catch ( (e) => {
        console.log( e.stack );
        let  rtnObj = {
            body: hasj.reportError('view', util.format('Failed to build palet [%s].', bdCtx.uicPath))
                        .add('pre', e.stack)
                        .toHTML()
        };
        cb( rtnObj );
    });
}


exports.renderError = function(bdCtx, body, cb)  {
    let  page = bdCtx.webSite.readPageSource( 'desktop', bdCtx.uicPath );

    emulator.interpretXS(page.html, bdCtx).then( pageUIC => {
        if (pageUIC.err)
            // the page layout itself has errors
            return  cb({body: pageUIC.err.toHTML()});

        let  incList = emulator.convertInclude( pageUIC.include || [] );
        bdCtx.model = {
            value: {include: incList, body: body}
        };

        // manually add body to the whole page UIC tree
        pageUIC.uicList.push( body );
        body.toCSS();

        emulator.runXS(pageUIC, 'xs_page', bdCtx).then( root => {
            let  head = root.c[0],
                 css = root.toCSS() + 
                        '\t._xsErr {background-color: white; color: red;}',
                 js = '__._xs_page = ' + root.toJS() + '\n__.addToInit("xs_page");' +
                      '\n$(document).ready(function() {\n\t$.ajaxSetup({\n\t\tcache: false\n\t});\n\t__.initPage();\n});\n';
            head.add('style', {type: 'text/css'}, css);
            head.add('script', js);

            root.endpoint = null;	// so no wrapper div will be generated
            cb({body: '<!DOCTYPE HTML>\n' + root.toHTML()});
        })
        .catch( e => {
            let  html = '<body>Layout has errors as:<pre>' + (e.stack || e.message || e) + '</pre></body>';
            cb({body: html});
        });
    });
}


/**
 * Generate CSS selector ID for each palet or region.
 *
 * @returns {String}
 */
function  genAutoID()  {
	return  'c' + _viewAutoID++;
};