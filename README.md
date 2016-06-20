# coServ

## Why coServ
Offering smooth user experiences is becoming the norm of web applications. However, it's not a simple task. Many platforms have been developed for the quest. Unfortunately, most platforms present more problems than solving them.

With the arrival of HTML5, CSS3 and ES5/ES6, developers actually have enough facilities to tackle the problems. All we need is probably just a neat and clean platform to fully utilize those three fundamental technologies. So here comes **coServ**, with the following design guidelines in mind:

+ Developers should spend time on designing/coding rather than learning or harnessing the platform itself.

+ Helping developers not to repeat themselves.

+ Helping developers to fully utilize HTML, CSS and Javascript. Besides those, there is nothing to learn (well, before the next exciting technologies coming out XD).

##  Features

+ Regardless it's backend or front-end, developers can use one single language (Javascript) to do them all.

+ Help developers to divide web pages into smaller blocks and wcomps, so ti's easier to work on (the **divide and conquer** strategy).

+ HTML refactoring &amp; reuse + CSS encapsulation.

+ HTML, CSS and JS can all be formulated as templates.

+ An extremely easy and elegant way to provide multi-lingual support.

+ A single coServ server can host multiple websites, and it's very easy to manage them.

+ Support a very powerful CSS preprocessor called JASS.

## Get started
To install

	npm install coserv

The easiest way is to get started is probably to try the [one page demo](https://github.com/benlue/cows-onePage). You can build a one page RWD website in minutes.


## What's new
Below are highlights of recent releases. More details in [release notes](https://github.com/coimotion/coServ/blob/master/ReleaseNote.md).

+ [v0.10.7] You can easily protect the whole or part of the website from unauthorized access. Check [here](https://benlue.gitbooks.io/coserv-user-guide/content/scenario#accProt) for details.

+ [v0.10.7] A wcomp can be displayed without the additional wrapper. Check [here](https://benlue.gitbooks.io/coserv-user-guide/content/chap5/chapter5.html#dspNoWrapper) for details.

+ [v0.10.4] wFront.js is the main (front-end) controller. This file can be updated with new coServ release, so it's better to be served from coServ than from websites (which may use older versions). This is enforced in v0.10.4.

+ [v0.10.3] coServ now can be [deployed to Heroku](https://benlue.gitbooks.io/coserv-user-guide/content/chap6/chapter6.html) with almost no modifications needed.

+ [v0.10.0] A new feature called **wcomp** was introduced (see [below](#wcomp) for more explanations). A more managable websit file structure was introduced and the design console can import &amp; export websites. Also the "region" feature is deprecated.

+ [v0.9.9] A web interface (coServ design console) has been added to manage & design websites running on a coServ server. For details, check the "Design Console" section below.

+ [v0.9.6] It's now possible to do server side redirect. This is how: create a block (without view) and make a customized module for the block. In the customized module, simply return {"_httpCode": 302, "_httpHeaders": {Location: 'the redirect URL'}} in the callback.

+ [v0.9.3] coServ now supports live reload via [gulp](http://gulpjs.com). The needed gulpfile.js is included in the release. To use live reload, both gulp and [browser-sync](http://www.browsersync.io) have to be installed.


## The Design Console
Starting from the 0.9.9 release, a web interface called "design console" was added to the release bundle. The design console can help developers to easily manage or design websites. It's a great tool to get things started.

To play with the design console, simply start coServ (node coServ) and point your browser to "localhost:8080". The website you're working on can be assigned to "127.0.0.1". That's a small trick to host two websites on your local machine.

**Note**: the design console is only tested on chrome and safari. Sorry I don't have that much time to make it ready on all browsers.

<a name="wcomp"></a>
## Wcomps
A new concept called **wcomp** was introduced in v0.10.0. With **wcomps**, you can package sophisticated UI designs into a component which is ready to be re-used anywhere in your websites.

Conceptually, wcomps are very similar to [web components](http://webcomponents.org/) except that wcomps do not use shadow DOM and do not require polyfill or native support from browsers. Wcomps are also similar to blocks. The main difference between **wcomps** and **blocks** is that wcomps are not bound to any specific contents.


## Issues about multiple websites
If you run multiple websites on coServ, you may have problems of loading images from other websites. That's because the root path of static files (such as images) from various websites are all pointed to '/'. coServ has no way to know '/' is belonging to which website.

v0.10.4 has a solution for this. If you're hosting multiple websites on coServ, you should refer to images (and other static files) with the '/**$website_code_name**/cont/' prefix and that should solve the problem.


## Documentation

+ [The coServ User Guide](https://benlue.gitbooks.io/coserv-user-guide/content/): good for first time users or beginners.
+ [The coServ Block Programming Guide](https://benlue.gitbooks.io/the-coserv-programming-guide/content/): can be used as a reference for coding blocks.
+ Some [articles](http://www.coservjs.org/coserv/doc). These could be out of dated, though.
