# coServ

coServ is a tidy web server implemented in Node.js. It is intended to be a server facade which could draw data or contents from multiple sources. Mesh up content from multiple sources can be done easily.

coServ can be used to build tiny websites with a few static pages or extremely complicated web applications. coServ helps developers to decouple contents from presentations by a EJS-like template engine. HTML, Javascript and CSS files can all run through the template engine. Web front end designers can write much more flexible codes and easily reuse them repeatedly.

coServ is created in the view of the "internet of servers" paradigm. Servers crossing domains can interact with each other and co-produce contents that can best service their users. coServ is also created to help web site builders to leverage the COIMOTION API services.


##  Features

+ Support page-layout to simplify web page design.

+ A web page can be decomposed into regions and (functional) blocks. Functional blocks can be reused on various pages.

+ A EJS-like template engine to compose HTML, Javascript and CSS (yes, you can apply templates on JS and CSS files).

+ Automatically pulling data from the COIMOTION API engine.

+ Using 'modules' to access contents from other websites or data sources.

+ Multi-lingual support with language resource bundles.

+ Hosting multiple web sites on a single coServ server. It's extremely easy to do so.

## Development Guides
Articles and guides can be found [here](https://github.com/coimotion/coServ/wiki).


## Install
npm install coserv


## Usage
1. Go to the module directory (coServ) and run 'node coServ.js'. That should start the server at port 8080.

2. If you want to start the server at other port (say 80), you can go to the coServ.js file and look for the last line. You can change the port number there.

3. If you have assigned a domain name to this server, you can modify the 'www/sites.json' file to allow coServ to recognize the designated domain. Replace '127.0.0.1' with the domain name of your website.

4. Try http://127.0.0.1:8080 (or http://www.yourdomain.com if you've modified the sites.json file) on your browser. If everything works fine, you should see the index page.
  
  
## Build Your Own Site
Learning from examples can always save us lots of time. If you want to start building your own site, here are a few steps that we recommand:

1. Go to coServ/www/themes, duplicate teh 'demoApp' directory. Assuming 'foo' is the name of your website, then rename the newly created directory to 'foo'.

2. Now everything thing under the 'foo' directory produces the look and feel of the'foo' website. The siteURI.json file manifests valid URLs of this website. The layoutMap.json file specifies what page layout should be used for various URLs. The 'layout' directory include all page layouts of a website (a website can have multiple page layouts and which layout should be used is specified in the 'layoutMap.json' file).

3. You should also modify the 'www/sites.json' file to assign an IP (or domain) to your newly created website.

### The Template Engine
#### 1. Syntax
To include directives or Javascript code, use

    <% your javascript code or coServ directives %>

To access values of variables, do this:

    <%= variable %>

So in terms of syntax, it's very much like EJS.
    
#### 2. Directives
You can do more than embedding Javascript code in a template. You can also use built-in directives in a template. Below are built-in diretives supported by coServ:
+ **includeCss()**: Search for included CSS files which can be specified in page template, regions or blocks, and list those CSS files in the format of &lt;link rel=...&gt; on a HTML page. This directive should only be used in the page template.

+ **includeJs()**: Search for included js files which can be specified in page template, regions or blocks, and list those js files in the format of &lt;script type="text/javascript" source="..."&gt;&lt;/script&gt; on a HTML page. This directive should only be used in the page template. 

+ **css()**:  Lump sum all the CSS rules which have been specified in page template, regions and blcoks. This directive should only be used in the page tempate.

+ **js()**:  Lump sum all the Javascript code snippets which have been specified in page template, regions and blcoks. This directive, too, should only be used in the page tempate.

+ **region(region_path)**: Include a region. A region is like a container which can have its own style decorations and include other regions or blocks. With this directive you can reuse existing regions. 'region_path' points to the directory where all files defining a region (HTML, js, css, include file and language resource bundle) are located. If 'region_path' is a relative path (starts with ./), it will be relative to the directory where the region() directive is called. Otherwise, it will refer to a 'shared' region which will be located in the 'www/themes/shared/views' directory.

+ **block(blockName, option)**: Invoke a block. Unlike regions, blocks is not a container but a content-view generator. Blocks are defined in the 'www/themes/[Your_Website_Code]/blocks' directory. 'blockName' specifies which block will be invoked.
 
#### 3. Variables
coServ provides variables to help developers to access data or auxiliary information which could be useful in creating contents. These variables include service value, block variables, context variables, phrases and a special 'ctrl' variable.

##### i. Service Value
Service value is the raw data generated by running a block. The service value can be returned by invoking a remote API service (such as the COIMOTION service) or by executing a local module. Below are some examples of utilizing the service value in a template:
>    <%= value.title %>

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

>    <%= ph.addr %>

The above example will ask the template engine to look for the 'addr' phrase in the language resource bundle, and replace it with the proper locale.

##### v. The Ctrl Variable
The idea of reusable blocks is a very essential part of coServ. To allow developers to throw any block in a page as they wish, each block must be dynamically assigned an ID. One can use a block ID to retrieve the controller (coServ follows the MVC design pattern) of a block. Unfortunately, developers can not know the block ID at the time when they're coding HTML since the block ID is not generated until the block is rendered. As a result, the 'ctrl' variable is provided. Here is an example:


    <a onclick="<%=ctrl%>.clickLink(this);">...</a>

When users click on the link, the clickLink() method of the block controller will be invoked.


#### 4. Examples
Use template is applied to HTML. Below is an example to set up a page title:

>    <title><%=ctx.title%></title>

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
    								         {"title": "coServ Help You Manage A Big WebSite With Ease."}
    								        ]
    					   }
    				 };
        hotMod.emit('done', result);
    };
    
    module.exports = hotMod;


