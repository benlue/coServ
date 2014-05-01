

# coServ

coServ is a tidy web server implemented in Node.js. It is intended to be a server facade which could draw data or contents from multiple sources. Mesh up content from multiple sources can be done easily.

coServ can be used to build tiny websites with a few static pages or extremely complicated web applications. coServ help developers to decouple contents with presentations by a EJS-like template engine. HTML, Javascript and CSS files can all run through the template engine. Web front end designers can write much more flexible codes and easily reuse them repeatedly.

coServ is created in the view of the "internet of servers" paradigm. Servers crossing domains can interact with each other and co-produce contents that can best service their users. coServ is also created to help web site builders to leverage the COIMOTION API services.


##  Features

+ Support page-layout to simplify web page design.

+ A web page can be decomposed into regions and (functional) blocks. Functional blocks can be reused on various pages.

+ A EJS-like template engine to compose HTML, Javascript and CSS (yes, you can apply templates on JS and CSS files).

+ Automatically pulling data from the COIMOTION API engine. Using 'modules' to access contents from other websites or data sources.

+ Hosting multiple web sites on a single coServ server. It's extremely easy.

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