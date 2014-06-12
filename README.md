# coServ

coServ is a tidy web server implemented in Node.js. It is intended to be a server facade which could draw data or contents from multiple sources. Mesh up content from multiple sources can be done easily.

coServ can be used to build simple websites with just a few static pages or extremely complicated web applications. coServ helps developers to decouple contents from presentations by a EJS-like template engine. HTML, Javascript and CSS files can all run through the template engine. coServ also breaks up web pages into reusable blocks. By reusing and embedding blocks, single-page web applications can be easily built.

coServ is created in the view of the "internet of servers" paradigm. Servers crossing domains can interact with each other and co-produce contents that can best service their users. coServ is also created to help web site builders to leverage the COIMOTION API services.


##  Features

+ Support page-layout to simplify web page design.

+ Decomposing web pages into regions and blocks. Blocks can be dynamically embedded or reloaded without affecting other regions/blocks on a page.

+ A EJS-like template engine to compose HTML, Javascript and CSS (yes, you can even apply templates on JS and CSS files).

+ Using node modules to customizing web applications (or websites).

+ If you prefer BaaS to manage contents, coServ can automatically pushing/pulling data to and from the COIMOTION API engine.

+ Hosting multiple web sites on a single coServ server. It's extremely easy to do so.

+ Multi-lingual support with language resource bundles.

## Development Guides
Release notes can be found [here](https://github.com/coimotion/coServ/blob/master/ReleaseNote.txt). Articles and guides can be found [here](https://github.com/coimotion/coServ/wiki).


## Install
npm install coserv


## Usage
1. Go to the module directory (coServ) and run 'node coServ.js'. That should start the server at port 8080.

2. If you want to start the server at other port (say 80), you can go to the coServ.js file and look for the last line. You can change the port number there.

3. If you have assigned a domain name to this server, you can modify the 'www/sites.json' file to allow coServ recognizing the designated domain. Replace '127.0.0.1' with the domain name of your website.

4. Try http://127.0.0.1:8080 (or http://www.yourdomain.com if you've modified the sites.json file) on your browser. If everything works fine, you should see the index page of the demo app.
  
  
## Build Your Own Site
Learning from examples can always save us lots of time. If you want to start building your own site, here are a few steps that we recommand:

1. Go to coServ/www/themes, duplicate the 'demoApp' directory. Assuming 'foo' is the name of your website, then rename the newly created directory to 'foo'.

2. Now everything thing under the 'www/themes/foo' directory produces the look and feel of the'foo' website. For details about how files are organized for a website, please check this [article](https://github.com/coimotion/coServ/wiki/File-Structure).

Starting from release 0.8.6, a command line interface (CLI) can be used to create new sites and add new pages to websites. To create a new site, you can try:

    > node clie/addSite.js your_web_site web_domain
    
The second parameter (domain name) is optional. If web domain is not given, the new website will be assigned to '127.0.0.1'. To add a new page to a website, the following command can be handy:

    > node cli/addPage.js web_site page_name

The above command will add a new page to the specified website.

### The Template Engine
#### 1. Syntax
To include directives or Javascript code, use

    <% your javascript code or coServ directives %>

To access values of variables, do this:

    <%= variable %>

So in terms of syntax, it's very much like EJS.
    
#### 2. Directives
On coServ, you can do more than embedding Javascript codes in templates: you can also use built-in directives. Below are built-in diretives supported by coServ:

+ **includeCss()**: Ask coServ to search for included CSS files which are specified in page template, regions or blocks, and aggregate those CSS file listings in the format of &lt;link rel=...&gt; on a HTML page. This directive should only be used in the page template.

+ **includeJs()**: Ask coServ to search for included js files which are specified in page template, regions or blocks, and aggregate those js file listings in the format of &lt;script type="text/javascript" source="..."&gt;&lt;/script&gt; on a HTML page. This directive should only be used in the page template. 

+ **css()**:  Lump sum all the CSS rules which have been specified in page template, regions and blcoks. This directive should only be used in the page tempate.

+ **js()**:  Lump sum all the Javascript code snippets which have been specified in page template, regions and blcoks. This directive, too, should only be used in the page tempate.

+ **region(region_path)**: Include a region. A region is like a container which can have its own style decorations and can include other regions or blocks. With this directive you can reuse existing regions. 'region_path' points to the directory where all files defining a region (HTML, js, css, include file and language resource bundle) are located. If 'region_path' is a relative path (starts with ./), it will be relative to the directory where the region() directive is called. Otherwise, it will refer to a 'shared' region which will be located in the 'www/themes/shared/views' directory.

+ **block(blockName, option)**: Invoke a block. Unlike regions, blocks is not a container but a content-view generator. Blocks are defined in the 'www/themes/[Your_Website_Code]/blocks' directory. 'blockName' specifies which block will be invoked.

TO know more about regions and blocks, please refer to this [article](https://github.com/coimotion/coServ/wiki/Layout-Scheme).

#### 3. Variables
coServ provides variables to help developers accessing data or auxiliary information which could be useful in producing contents. Variables include service value, block variables, context variables, phrases and a special 'ctrl' variable.

##### i. Service Value
Service value is the raw data generated by executing a block. The service value can be returned by a remote API service call (such as the COIMOTION service) or by a local module. Below are some examples of utilizing service values in a template:

    <%= value.title %>

to get the "title" field of the return value. Or

    <% value.list.forEach(function(item) { %>
        <li><%= item.title %></li>
    <% }); %>

to loop through a returned list.

##### ii. Block Variables
Each block has its own built-in variables which could be helpful in content generation:

+ uri: URI of the block.
+ query: query parameters fed to this block.
+ intPath: similar to 'uri', but the 'id' portion has been removed.
+ service: if the block relies on a COIMOTION API service to provide data, this variable shows what API service is used.
+ viewPath: the directory where all view files (HTML, Javascript, CSS, include file and language resource bundle) of this block reside.

##### iii. Context Variables
Context variables provide information about the whole page:

+ locID: locale ID. Indicate which locale is used.
+ title: title of the page.
+ description: descripton of the page. Can be use in the description meta tag in the HTML header.

##### iv. Phrases
If you need to support multiple languages on web pages, simply add phrases in the language resource bundle and invoke them on the page as following:

    <%= ph.addr %>

The above example will ask the template engine to look for the 'addr' phrase in the language resource bundle, and replace it with the proper locale.

##### v. The Ctrl Variable
The idea of reusable blocks is a very essential part of coServ. To allow developers to throw any block in a page as they wish, each block must be dynamically assigned an ID. One can use a block ID to retrieve the controller (coServ follows the MVC design pattern) of a block. Unfortunately, developers can not know the block ID at the time when they're coding HTML since the block ID is not generated until the block is rendered. As a result, the 'ctrl' variable is provided. Here is an example:


    <a onclick="<%=ctrl%>.clickLink(this);">...</a>

When users click on the link, the clickLink() method of the block controller will be invoked.


#### 4. Examples
Use template is applied to HTML. Below is an example to set up a page title:

    <title><%=ctx.title%></title>

You can translate a Javascript file into a template to make it more powerful:

    if (<%= value.isValid %>)
        // this request is valid, do something decent
    else
        // issue an warning

Or you can even apply templates on CSS:

    ul.news {
        <% if (value.isImportant) { %>
        color: #red;
        <% } else { %>
        color: #black;
        <% } %>
    }
    
### Block Modules
A block module can be used to provide data for a block. It's a node.js module and it has to implement a 'run' function. Below is an example:

    var  EventEmitter = require('events').EventEmitter;
    
    var  hotMod = new EventEmitter();
    
    hotMod.run = function run(inData)  {
        var  result = {
    				    "value": {
    				    "list": [{"title": "COIMOTION Is An Amazing API Service Engine."},
    						     {"title": "coServ Help You Manage A Big WebSite With Ease."}]
    					         }
    				 };
        hotMod.emit('done', result);
    };
    
    module.exports = hotMod;


