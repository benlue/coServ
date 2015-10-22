# coServ

## Why coServ
Offering smooth or even exceptional user experiences is becoming the norm of web applications. However, it's not a simple task. Compounded with the problems that today's web applications are much more complicated than they used to be, web developers need better web platforms to meet the challenge. Many platforms have been developed for the quest. Unfortunately, most platforms present more problems than solving them.

With the arrival of HTML5, CSS3 and ES5/ES6, developers actually have enough facilities to tackle the problems. The focus should not be on creating a more powerful tool, but effectively utilizing those three fundamental technologies. We've seen many web platforms inventing new syntax or extensions on top of those standards, but do little to help developers fully utilize the three fundamental yet powerful technologies. That does not seem to be the right direction, so we decided to show an alternative approach by building coServ. Below are the major design guide lines of coServ:

+ Developers should spend time on designing and coding rather than spend time on learning or harnessing the platform itself.

+ Help developers not to repeat themselves.

+ Help developers to fully utilize HTML, CSS and Javascript.

## The Latest Release
Below are highlights of recent releases:

+ [v0.9.8] wFront.js was updated (wFront.js is the main controller of coServ on the client side). If you do not use the default web directory ('/www'), remember to copy the wFront.js file to your custom web directory (/www/cont/shared/js/wFront.js).

+ [v0.9.7] Cleaned up the code base and many codes have been written. This release can be regarded as the release candidate of v1.0. More test cases will be added before release 1.0.

+ [v0.9.6] It's now possible to do server side redirect. This is how: create a block (without view) and make a customized module for the block. In the customized module, simply return {"_httpCode": 302, "_httpHeaders": {Location: 'the redirect URL'}} in the callback.

+ [v0.9.5] Upgraded coServ dependencies. It's recommended to run coServ with the latest version (v0.12.2) of node.js.

+ [v0.9.3] coServ now supports live reload via [gulp](http://gulpjs.com). The needed gulpfile.js is included in the release. To use live reload, both gulp and [browser-sync](http://www.browsersync.io) have to be installed.

##  Features

+ Implemented in node.js.

+ Regardless it's backend functions or front-end templates, developers can use one single language (Javascript) to do them all.

+ Besides HTML, CSS and Javascript, developers don't have to learn anything new to build web applications.

+ Help developers to divide web pages into smaller regions and blocks, and to focus on those smaller parts (the **divide and conquer** strategy).

+ An extremely easy and elegant way to provide multi-lingual support.

+ A single coServ server can host multiple websites, and it's very easy to manage them.

+ Support a very powerful CSS preprocessor called JASS.


## Documentation
A complete developer guide can be found [here](http://www.coservjs.org/coserv/guide). A few more articles can be found [here](http://www.coservjs.org/coserv/doc).
