# coServ

## Why coServ
Offering smooth user experiences is becoming the norm of web applications. However, it's not a simple task. Many platforms have been developed for the quest. Unfortunately, most platforms seem to present more problems than solving them.

With the arrival of HTML5, CSS3 and ES5/ES6, developers actually have enough facilities to tackle the problems. All we need is just a neat and clean platform to fully utilize those essential technologies. So here comes **coServ**, with the following amazing features:

+ **HTML refactoring** &amp; reuse

+ **Transparent CSS encapsulation**. It's automatic and you don't have to do anything to make that happen.

+ Regardless it's backend or front-end, use one single language (Javascript) to do them all.

+ HTML, CSS and JS can all be formulated as templates, and you have the full power of Javascript to work with templates rather than just a very limited subset.

+ Support a very powerful CSS preprocessor called JASS.

In the end, you may find there is really just one thing that matters: be able to focus on coding and have fun. So why spending numerous hours to learn to harness a platform just to get things going? Be simple and be coServ!


## Get started
To install

	npm install coserv

The easiest way is to get started is probably to try the [one page demo](https://github.com/benlue/cows-onePage). You can build a one page RWD website in minutes.

## Documentation

+ [The coServ User Guide](https://benlue.gitbooks.io/coserv-user-guide/content/): good for first time users or beginners.
+ [The coServ Block Programming Guide](https://benlue.gitbooks.io/the-coserv-programming-guide/content/): can be used as a reference for coding blocks.
+ Some [articles](http://www.coservjs.org/coserv/doc). These could be out of dated, though.


## What's new
Below are highlights of recent releases. More details in [release notes](https://github.com/coimotion/coServ/blob/master/ReleaseNote.md).

+ [v0.12.2] Improved the SSE implementation.

+ [v0.12.0] Markdown can be displayed directly. It's supported as the first class content annotation tool just like HTML.

+ [v0.11.1] A print() function is supported to make HTML template much more concise and easier to read. For deatils, check [here](https://benlue.gitbooks.io/the-coserv-programming-guide/content/chap1/chapter1.html#print)

+ [v0.11.0] Input parameters to a block can be explicitly specified. More details can be found [here](#blkInput).

+ [v0.10.7] You can easily protect the whole or part of the website from unauthorized access. Check [here](https://benlue.gitbooks.io/coserv-user-guide/content/scenario#accProt) for details.

+ [v0.10.3] coServ now can be [deployed to Heroku](https://benlue.gitbooks.io/coserv-user-guide/content/chap6/chapter6.html) with almost no modifications needed.

+ [v0.10.0] A new feature called **wcomp** was introduced (see [below](#wcomp) for more explanations). A more managable websit file structure was introduced and the design console can import &amp; export websites. Also the "region" feature is deprecated.

+ [v0.9.9] A web interface (coServ design console) has been added to manage & design websites running on a coServ server. For details, check the "Design Console" section below.

+ [v0.9.6] It's now possible to do server side redirect. This is how: create a block (without view) and make a customized module for the block. In the customized module, simply return {"_httpCode": 302, "_httpHeaders": {Location: 'the redirect URL'}} in the callback.

+ [v0.9.3] coServ now supports live reload via [gulp](http://gulpjs.com). The needed gulpfile.js is included in the release. To use live reload, both gulp and [browser-sync](http://www.browsersync.io) have to be installed.


## The Design Console
Starting from the 0.9.9 release, a web interface called "design console" was added to the release bundle. The design console can help developers to easily manage or design websites. It's a great tool to get things started.

To play with the design console, simply start coServ (node coServ) and point your browser to "localhost:8080". The website you're working on can be assigned to "127.0.0.1". That's a small trick to host two websites on your local machine.

**Note**: the design console is only tested on chrome and safari.

<a name="blkInput"></a>
## Specifying block input
Unlike most programming languages, HTML does not have a way to specify input to a page (well, HTML was invented to present static contents rather than dynamic apps. No reason to blame HTML for that.) In the latest release of coServ, we have a solution for that. You can specify input parameters to a block. That can be done by manually edit the "siteURI.json" file or using the design console. Now with HTML refactoring and explicit input specification, the methodology we adopt in software development can be applied to HTML as well.

<a name="wcomp"></a>
## Wcomps
A new concept called **wcomp** was introduced in v0.10.0. With **wcomps**, you can package sophisticated UI designs into a component which is ready to be re-used anywhere in your websites.

Conceptually, wcomps are very similar to [web components](http://webcomponents.org/) except that wcomps do not use shadow DOM and do not require polyfill or native support from browsers. Wcomps are also similar to blocks. The main difference between **wcomps** and **blocks** is that wcomps are not bound to any specific contents.


## Issues about multiple websites
If you run multiple websites on coServ, you may have problems of loading images from other websites. That's because the root path of static files (such as images) from various websites are all pointed to '/'. coServ has no way to know '/' is belonging to which website.

v0.10.4 has a solution for this. If you're hosting multiple websites on coServ, you should refer to images (and other static files) with the '/**$website_code_name**/cont/' prefix and that should solve the problem.

