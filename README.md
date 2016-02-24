# coServ

## Why coServ
Offering smooth user experiences is becoming the norm of web applications. However, it's not a simple task. Compounded with the problems that today's web applications are much more complicated than they used to be, web developers need better web platforms to meet the challenge. Many platforms have been developed for the quest. Unfortunately, most platforms present more problems than solving them.

With the arrival of HTML5, CSS3 and ES5/ES6, developers actually have enough facilities to tackle the problems. The focus should not be on creating yet another web design technology, but on effectively utilizing those three fundamental facilities. We've seen many web platforms inventing new syntax or extensions on top of those standards, but do little to help developers fully utilize them. That does not seem to be the right direction, so we decided to show an alternative. Below are the major design guidelines of **coServ**:

+ Developers should spend time on designing/coding rather than learning or harnessing the platform itself.

+ Help developers not to repeat themselves.

+ Help developers to fully utilize HTML, CSS and Javascript. Besides HTML, CSS and Javascript, developers don't have to learn anything more.

##  Features

+ Regardless it's backend or front-end, developers can use one single language (Javascript) to do them all.

+ Help developers to divide web pages into smaller blocks and wcomps, so ti's easier to work on (the **divide and conquer** strategy).

+ HTML refactoring &amp; reuse + CSS encapsulation.

+ HTML, CSS and JS can all be formulated as templates.

+ An extremely easy and elegant way to provide multi-lingual support.

+ A single coServ server can host multiple websites, and it's very easy to manage them.

+ Support a very powerful CSS preprocessor called JASS.

## Get started
The easiest way is probably to try the [one page demo](https://github.com/benlue/cows-onePage). You'll find how easily a one page RWD website can be built using coServ.

## What's new
Below are highlights of recent releases. More details in [release notes](https://github.com/coimotion/coServ/blob/master/ReleaseNote.md).

+ [v0.10.3] coServ now can be deployed to Heroku right out of box without any modifications required. The "region" feature is officially removed.

+ [v0.10.0] A new feature called **wcomp** was introduced (see [below](#wcomp) for more explanations). A more managable websit file structure was introduced and the design console can import &amp; export websites. Also the "region" feature is deprecated.

+ [v0.9.9] A web interface (coServ design console) has been added to manage & design websites running on a coServ server. For details, check the "Design Console" section below.

+ [v0.9.8] wFront.js was updated (wFront.js is the main controller of coServ on the client side). If you do not use the default web directory ('/www'), remember to copy the wFront.js file to your custom web directory (/www/cont/shared/js/wFront.js).

+ [v0.9.6] It's now possible to do server side redirect. This is how: create a block (without view) and make a customized module for the block. In the customized module, simply return {"_httpCode": 302, "_httpHeaders": {Location: 'the redirect URL'}} in the callback.

+ [v0.9.3] coServ now supports live reload via [gulp](http://gulpjs.com). The needed gulpfile.js is included in the release. To use live reload, both gulp and [browser-sync](http://www.browsersync.io) have to be installed.


## The Design Console
Starting from the 0.9.9 release, a web interface called "design console" was added to the release bundle. The design console can help developers to easily manage or design websites. It's a great tool to get things started.

To play with the design console, simply start coServ (node coServ) and point your browser to "localhost:8080". The website you're working on can be assigned to "127.0.0.1". That's a small trick to host two websites on your local machine.

*Note*: the design console is only tested on chrome and safari. Sorry I don't have that much time to make it ready on all browsers.

<a name="wcomp"></a>
## Wcomps
A new concept called **wcomp** was introduced in v0.10.0. With **wcomps**, you can package sophisticated UI designs into a component which is ready to be re-used anywhere in your websites.

Conceptually, wcomps are very similar to [web components](http://webcomponents.org/) except that wcomps do not use shadow DOM and do not require polyfill or native support from browsers. Wcomps are also similar to blocks. The main difference between **wcomps** and **blocks** is that wcomps are not bound to any specific contents.


## Documentation
An [user guide](https://benlue.gitbooks.io/coserv-user-guide/content/) is now available on gitbook. A few more articles can be found [here](http://www.coservjs.org/coserv/doc).
