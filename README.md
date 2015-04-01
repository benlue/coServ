# coServ
## The Latest Release
The latest release is 0.9.5 with the following features/improvements:

+ Upgraded coServ dependencies. It's recommended to run coServ with the latest version (v0.12.2) of node.js.

+ coServ now supports live reload via [gulp](http://gulpjs.com). The needed gulpfile.js is included in the release. To use live reload, both gulp and [browser-sync](http://www.browsersync.io) have to be installed.

+ Both the server port number and node.js max socket pooling settings (http.agent.maxSockets) can now be specified in the config.json file. Developers no longer have to manually modify the coServ.js file to do the settings.

+ Quite a few bug fixes. For details, please refer to [ReleaseNote.txt](https://github.com/coimotion/coServ/blob/master/ReleaseNote.txt).

## Why coServ
Offering smooth or even exceptional user experiences is becoming the norm of web applications. However, it's definitely not a simple task. Compounded with the problems that today's web applications are much more complicated than they used to be, web developers need better web platforms to meet the challenge. Many platforms have been developed for the quest. Unfortunately, most platforms present more challenges than solving them.

With the arrival of HTML5, CSS3 and ES5 (or the coming ES6), developers actually have enough facilities to tackle web application problems. The focus should not be creating a more powerful tool, but effectively utilizing those three fundamental technologies. We've seen many web platforms inventing new syntax or extensions on top of those standards, but do little to help developers fully utilize the three fundamental yet powerful technologies. That does not seem to be the right direction, so we decided to show an alternative approach by building coServ. Below are the major design guide lines of coServ:

+ Developers should spend time on designing and coding rather than spend time on learning or harnessing the platform itself.

+ Help developers not to repeat themselves.

+ Help developers to fully utilize HTML, CSS and Javascript.

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
