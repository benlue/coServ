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
>	<% your javascript code or coServ directives htere %>

To access values of variables, do this:
>    <% variable %>

So in terms of syntax, it's very much like EJS.
    
#### 2. Directives
You can do more than embedding Javascript code in a template. You can also use built-in directives in a template. Below are built-in diretives supported by coServ:
+ **includeCss()**: Search for included CSS files which can be specified in page template, regions or blocks, and list those CSS files in the format of &lt;link rel=...&gt; on a HTML page. This directive should only be used in the page template.

+ **includeJs()**: Search for included js files which can be specified in page template, regions or blocks, and list those js files in the format of &lt;script type="text/javascript" source="..."&gt;&lt;/script&gt; on a HTML page. This directive should only be used in the page template. 

+ **css()**:  Lump sum all the CSS rules which have been specified in page template, regions and blcoks. This directive should only be used in the page tempate.

+ **js()**:  Lump sum all the Javascript code snippets which have been specified in page template, regions and blcoks. This directive, too, should only be used in the page tempate.

+ **region(region_path)**: Include a region. A region is like a container which can have its own style decorations and include other regions or blocks. With this directive you can reuse existing regions. 'region_path' points to the directory where all files defining a region (HTML, js, css, include file and language resource bundle) are located. If 'region_path' is a relative path (starts with ./), it will be relative to the directory where the region() directive is called. Otherwise, it will refer to a 'shared' region which will be located in the 'www/themes/shared/views' directory.

+ **block(blockName, option)**: Invoke a block. Unlike regions, blocks is not a container but a content-view generator. Blocks are defined in the 'www/themes/[Your_Website_Code]/blocks' directory. 'blockName' specifies which block will be invoked.
 
#### 3. Block Variables
Each block has its own built-in variables which could be helpful in content generation:
+ uri: URI of the block.
+ query: query parameters fed to this block.
+ intPath: similar to 'uri', but the 'id' portion has been removed.
+ service: if the block relies on a COIMOTION API service to provide data, this variable shows what API service is used.
+ viewPath: the directory where all view files (HTML, Javascript, CSS, include file and language resource bundle) of this block reside.

#### 4. Examples
(To be completed)

### Block Modules
(To be completed)
