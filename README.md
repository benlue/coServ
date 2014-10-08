# 0.9.0 Released
The main attraction of the latest coServ release is JASS. JASS is the SASS counterpart in node.js, or even more powerful. To know what JASS is, please refer to this [article](https://github.com/coimotion/coServ/wiki/JASS:-Just-Awesome-Style-Sheet).

# coServ

coServ is a light weight web framework implemented in node.js. With less than 2 kloc, it supports the MVC paradigm, a convenient page layout scheme, a very versatile template engine, multi-lingual page generation, a SASS like CSS pre-processor, and more. It is intended to bring a friendly web development environment to node developers.

coServ can be used to build simple websites with just a few static pages or extremely complicated web applications. coServ helps developers to decouple contents from presentations by embedding Javascript code into HTML, CSS or even Javascript files. coServ also breaks up web pages into reusable blocks. By assembling web pages with blocks, development time can be cut down dramatically and single-page web applications can be easily built as well.

coServ does not try to tweak CSS or Javascript. It does not invent a whole new system for you to digest before you can do anything. There are no new syntex to learn, though coServ may ask you to think of web applications in a different way. By thinking differently, web development can be much easier and more interesting.


##  Features

+ Using page layout to simplify web page design.

+ Decomposing web pages into regions and blocks. Blocks can be dynamically embedded or reloaded without affecting other regions/blocks in the same page.

+ Embedding Javascript code in HTML, CSS or even Javascript itself.

+ A CSS pre-processor to harness CSS.

+ Using node modules to customize web applications (or websites).

+ If you have enough of the hassle of dealing with databases, coServ has the first-class support for the COIMOTION API services to manage your contents.

+ Hosting multiple web sites on a single coServ server. It's extremely easy to do so.

+ Multi-lingual support with language resource bundles.

Yes, it's all done with just over one thousand lines of code.

## Development Guides
Release notes can be found [here](https://github.com/coimotion/coServ/blob/master/ReleaseNote.txt). Articles and guides can be found [here](https://github.com/coimotion/coServ/wiki).


## Install
Since release 0.8.8, the node-sass module has become one of the coServ dependencies and the node-sass module requires super-user privileges to install. Therefore, on Linux or Mac please try:

    sudo npm install coserv

On Windows, you should install with the administrative role:

    npm install coserv

## Usage
1. Go to the module directory (coServ) and run 'node coServ.js'. That should start the server at port 8080.

2. If you want to start the server at other port (say 80), you can go to the coServ.js file and look for the last line. You can change the port number there.

3. If you have assigned a domain name to this server, you can modify the 'www/sites.json' file to allow coServ recognizing the designated domain. Replace '127.0.0.1' with the domain name of your website.

4. Try http://127.0.0.1:8080 (or http://www.yourdomain.com if you've modified the sites.json file) on your browser. If everything works fine, you should see the index page of the demo app.
  
  
## Build Your Own Site
Learning from examples can always save us lots of time. If you want to start building your own site, here are a few steps that we recommand:

1. Go to coServ/www/themes, duplicate the 'index' directory. Assuming 'foo' is the name of your website, then rename the newly created directory to 'foo'.

2. Now everything thing under the 'www/themes/foo' directory produces the look and feel of the'foo' website. For details about how files are organized for a website, please check this [article](https://github.com/coimotion/coServ/wiki/File-Structure).

Starting from release 0.8.6, a command line interface (CLI) can be used to create new sites and add new pages to websites. To create a new site, you can try:

    > node clie/addSite.js your_web_site web_domain
    
The second parameter (domain name) is optional. If web domain is not given, the new website will be assigned to '127.0.0.1'. To add a new page to a website, the following command can be handy:

    > node cli/addPage.js web_site page_name

The above command will add a new page to the specified website.

### Manage Your Sites
Regardless how many websites are hosted in a single coServ, all website files are put inside the 'www' directory. The 'www' directory is bundled in the coServ package by default, but you can move it anywhere you want. All you have to do is to specify the path of your 'www' directory in the config.json file. For example, if your 'www' path is in the /Users/john/www directory, then you can modify the config.json file like this:

    {
	    "apiEngine": {
		    "host": "coimapi.tw",
		    "port": 80,
		    "method": "POST"
	    },
	    "wwwPath": "/Users/john/www"
    }

By doing so, you can upgrade coServ to the latest version without damaging your existing websites.

### The Template Engine
It's a common practice to embed Javascript code in HTML, CSS or even Javascript when developing with coServ. It's done by a EJS-like template engine.

#### 1. Syntax
To include directives or Javascript code, use

    <% your javascript code or coServ directives %>

To print out variable values or the return values of functions, do this:

    <%= variable %>
    <%= foo_func(); %>

where _foo_func()_ is a javascript function which return a string value.
    
#### 2. Directives
On coServ, you can do more than embedding Javascript codes in templates: you can also use built-in directives. Below are built-in diretives supported by coServ:

+ **region(region_path)**: Include a region. A region is like a container which can have its own style decorations and can include other regions or blocks. With this directive you can reuse existing regions. 'region_path' points to the directory where all files defining a region (HTML, js, css, include file and language resource bundle) are located. If 'region_path' is a relative path (starts with ./), it will be relative to the directory where the region() directive is called. Otherwise, it will refer to a 'shared' region which will be located in the 'www/themes/shared/views' directory.

+ **block(blockName, option)**: Invoke a block. Unlike regions, blocks is not a container but a content-view generator. Blocks are defined in the 'www/themes/[Your_Website_Code]/blocks' directory. 'blockName' specifies which block will be invoked.

The following four directives are rarely used unless you want to customize you own page layout. They are listed below for completeness:

+ **includeCss()**: Ask coServ to search for included CSS files which are specified in page template, regions or blocks, and aggregate those CSS file listings in the format of &lt;link rel=...&gt; on a HTML page. This directive should only be used in the page template.

+ **includeJs()**: Ask coServ to search for included js files which are specified in page template, regions or blocks, and aggregate those js file listings in the format of &lt;script type="text/javascript" source="..."&gt;&lt;/script&gt; on a HTML page. This directive should only be used in the page template. 

+ **css()**:  Lump sum all the CSS rules which have been specified in page template, regions and blcoks. This directive should only be used in the page tempate.

+ **js()**:  Lump sum all the Javascript code snippets which have been specified in page template, regions and blcoks. This directive, too, should only be used in the page tempate.

To know more about regions and blocks, please refer to this [article](https://github.com/coimotion/coServ/wiki/Layout-Scheme).

#### 3. Built-In Variables
coServ provides bulit-in variables to help developers accessing framework data which could be useful in producing contents. Built-in variables include service return values, block variables, context variables, phrases and a special 'ctrl' variable.

##### i. Service Return Values
Service return value is the raw data generated by fullfilling a block. The service return value can be returned by a remote API service call (such as the COIMOTION service) or by a local module. Below are some examples of utilizing service values in a template:

    <%= value.title %>
    
to get the "title" field of the return value. Or

    <% value.list.forEach(function(item) { %>
        <li><%= item.title %></li>
    <% }); %>

to loop through a returned list.

As you can see from the above exemples, 'value' is the variable name to access the result.

##### ii. Block Variables
Each block has its own built-in variable with the following fields which could be helpful in content generation:

+ uri: URI of the block.

+ query: query parameters fed to this block.

+ service: if the block relies on a COIMOTION API service to provide data, this variable shows what API service is used.

+ viewPath: the directory where all view files (HTML, Javascript, CSS, include file and language resource bundle) of this block reside.

##### iii. Context Variables
Context variables provide information about the whole page:

+ locID: locale ID. Indicate what locale is used.

+ title: title of the page.

+ description: descripton of the page. Can be use in the description meta tag in the HTML header.

##### iv. Phrases
If you need to support multiple languages on web pages, simply add phrases in the language resource bundle and invoke them on the page as following:

    <%= ph.addr %>

The above example will ask the template engine to look for the 'addr' phrase in the language resource bundle, and replace it with the proper locale.

##### v. The ctrl Variable
Reusable blocks is the essential part of coServ. To allow developers to throw any block in a page as they wish, each block will be automatically assigned an ID and developers can use the block ID to access the controller (the 'controller' in the MVC model) of a block. Everything seems fine except for a problem: developers can not know the block ID at the time when they're coding HTML since the block ID is not generated until the block is rendered. To solve the problem, the 'ctrl' variable is provided. Here is an example:


    <a onclick="<%=ctrl%>.clickLink(this);">...</a>

When users click on the link, the clickLink() method of the block controller will be invoked.


#### 4. Examples
Below is an example showing how to set up a page title:

    <title><%=ctx.title%></title>

You can embed Javascript code to a Javascript file:

    if (<%= value.isValid %>)
        // this request is valid, do something decent
    else
        // issue an warning

You can also embed Javascript code in CSS:

    ul.news {
        <% if (value.isImportant) { %>
        color: #red;
        <% } else { %>
        color: #black;
        <% } %>
    }
    
### Block Modules
A block module is to provide data (contents) to a block for rendering. It's a node.js module and it has to implement a 'run' function. Below is an example:

    exports.run = function run(inData, callback)  {
        var  rtnList = [
                    {"title": "COIMOTION Is An Amazing API Service"},
    			    {"title": "coServ Helps You Manage Big WebSites"}];
        callback({
            errCode: 0,
            message: 'Ok',
            value: rtnList
        });
    };
    
The _run()_ function takes two parameters: _inData_ contains input parameters of a HTTP request (for HTTP GET, coServ will parse the query string and put the result in _inData_; for HTTP POST, coServ will parse the post body) while _callback_ should be invoked when a block module has done its job.

### JASS
Without proper management, CSS can easily go wild. Ruby developers have been happy to have SASS. How about node.js developers?

JASS is node's answer to the CSS design and management issues. JASS allows developers to treat CSS properties as Javascript objects and embed Javascript code in CSS. The result is a very powerful tool to harness CSS.

JASS provides two functions to deal with CSS: _jass.p()_ to print out CSS rules or properties and _jass.r()_ to create CSS rules. If you prefer less typing, _$.p()_ and _$.r()_ are the shorter version.

+ **jass.p(sel, prop)** : print out a CSS rule where _sel_ is a selector string and _prop_ is a Javascript object storing CSS properties.

+ **jass.p(prop)** : print out _prop_ (a Javascript object) as CSS properties.

+ **jass.p(r)** : print out a CSS rule where _r_ is a CSS rule object created by the _jass.r()_ function.

+ **jass.r(sel, prop)** : create a CSS rule where _sel_ is the selector string and _prop_ is a Javascript object storing CSS properties. The _prop_ parameter is optional.

For each CSS rule object created by the _jass.r()_ function, there are a few useful functions:

+ **add(prop)** : add a set of properties to a rule where _prop_ is a Javascript object containing the CSS properties.

+ **add(rules)** : add a nested rule (or rules) to the current CSS rule. Multiple rules can be added by passing an array of rule objects.

+ **toString()** : print out the rule in the CSS format.

For JASS design concepts and comparisons between JASS/SASS, please refer to [this](https://github.com/coimotion/coServ/wiki/JASS:-Just-Awesome-Style-Sheet).