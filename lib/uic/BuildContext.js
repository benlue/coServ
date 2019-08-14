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

    childContext(srvURI, params)  {
        params = params || {};
        if (params.hasOwnProperty('_id'))
            srvURI += '/' + params._id

        let  webSite = this.webSite,
             srvObj = this.srvObj,
			 cmReq = {
				uri: srvURI,
				inData: params,
				cookies: srvObj.cookies,
				headers: srvObj['http-headers'],
				client: srvObj.client,
				locale: srvObj.locale
			 },
             nSrvObj = webSite.verifyURI(cmReq);

        if (!nSrvObj.locale)  {
            // this is really patchy!
            nSrvObj.client = srvObj.client;
            nSrvObj.locale = srvObj.locale;
        }

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