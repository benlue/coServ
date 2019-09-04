/*!
 * BuildContext: context for building xs palets
 * authors: Ben Lue
 * Copyright(c) 2018 Gocharm Inc.
 */
'use strict';

class BuildContext {
    constructor(srvObj, webSite) {
        this.srvObj = srvObj;
        this.webSite = webSite;
        this.endpID = srvObj.hasOwnProperty('id')  ? srvObj.id : null;
    }

    getLocale()  {
        return  this.srvObj.locale;
    }

    get input()  {
        return  this._input;
    }

    set input(m)  {
        this._input = m;
    }

    get model()  {
        return  this._model || {};
    }

    set model(m)  {
        this._model = m;
    }

    get blockRoot()  {
        return  this._bkRoot;
    }

    set blockRoot(broot)  {
        this._bkRoot = broot;
    }

    get  deviceType()  {
        if (this._deviceType === undefined)
            this._deviceType = this.srvObj.client  ?  this.srvObj.client.category : 'desktop';

        return  this._deviceType;
    }

    /**
     * Return the URL of a palet
     */
    get uicPath()  {
        return  this._uicPath;
    }

    set uicPath(upth)  {
        this._uicPath = upth;
    }

    /**
     * return the full file path of a palet (source)
     */
    get srcPath()  {
        return  this._srcPath;
    }

    set srcPath(sp)  {
        this._srcPath = sp;
    }

    childContext(srvURI, params, isUIC)  {
        params = params || {};
        if (params.hasOwnProperty('_id'))
            srvURI += '/' + params._id

        let  webSite = this.webSite,
             srvObj = this.srvObj,
             nSrvObj

        if (isUIC)
            // UIC can't go through website.verifyURI() as it can't be recognized as a palet
            nSrvObj = {
                uri: srvURI, query: params, cookies: srvObj.cookies,
                'http-headers': srvObj['http-headers'],
				client: srvObj.client,
				locale: srvObj.locale,
				txEncode: 'utf-8',		// TODO: should not be hard-coded
				isAuthorized: srvObj.isAuthorized,
				isValid: true
			}
        else  {
            let  cmReq = {
                    uri: srvURI,
                    inData: params,
                    cookies: srvObj.cookies,
                    headers: srvObj['http-headers'],
                    client: srvObj.client,
                    locale: srvObj.locale
                 }
            nSrvObj = webSite.verifyURI(cmReq)
        }

        /* do we still need this?
        if (!nSrvObj.locale)  {
            // this is really patchy!
            nSrvObj.client = srvObj.client;
            nSrvObj.locale = srvObj.locale;
        }
        */
        // console.log('UIC cookies:\n' + JSON.stringify(nSrvObj.cookies, null, 4))

        let  nx = new BuildContext(nSrvObj, webSite);
        nx.blockRoot = this.blockRoot;
        return  nx;
    }

    createCtx(id, isUICCtx)  {
        let  srvObj = this.srvObj,
             webSite = this.webSite,
             ctx,
             appCode = webSite.siteInfo.caCode,
             currentApp = appCode;

        if (srvObj.cookies && srvObj.cookies.appCode)
            currentApp = srvObj.cookies.appCode;

        if (isUICCtx)
            ctx = {
                id: id,
                appCode: appCode,
                currentApp: currentApp,
                cookies: srvObj.cookies,
                locale: srvObj.locale,
                client: srvObj.client
            };
        else
            ctx = {
                id: id,
                uri: srvObj.uri.replace(/\\/g, "/"),
                endpID: srvObj.hasOwnProperty('id')  ? srvObj.id : null,
                inData: srvObj.query,
                query: srvObj.query,
                themeRoot: webSite.getThemeRoot(srvObj.client  ?  srvObj.client.category : 'desktop'),
                title: srvObj.title || srvObj.uri,
                description: srvObj.description,
                postfix: srvObj.postFix,
                appCode: appCode,
                currentApp: currentApp,
                cookies: srvObj.cookies,
                locale: srvObj.locale,
                client: srvObj.client
            };
    
        return  ctx;
    }
}

module.exports = BuildContext;