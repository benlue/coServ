# About Using Sass In coServ

-----------------

According to the Sass website

> Sass is the most mature, stable, and powerful professional grade CSS extension language in the world.
    
Take it or not, Sass is indeed a popular CSS extension among front-end developers. So starting from version 0.8.8, coServ provides the first class support for Sass. That means you can write Sass source code and coServ will automatically compile and apply it to the HTML output. You no longer have to manually compile your Sass file as most front-end developers have to today.

For those who are interested to know about Sass, please refer to [this](http://sass-lang.com/guide).


## How To
Using Sass on coServ is fairly easy. You simply use your .scss file to replace the .css file in the block directory, and that will do the work. The block directory is where you save all the related files of a block (if you're still not familiar with how coServ arranges files, please refer to [this article](https://github.com/coimotion/coServ/wiki/File-Structure)). 

The following diargram could be more explanatory:


    blocks
       |
       + views
           |
           + myBlock
              |
              +  myBlock.html /* the HTML template */
              |
              +  myBlock.css  /* the CSS template */
              |
              +  myBlock.js   /* the Javascript template */
              |
              +  myBlock.lang  /* multi-lingual reource bundle */
              |
              +  myBlock.scss  /* Here it is... the scss file */

  
Actually you don't need both the .css and .scss file. You just need one of them. If you provide both files for a block, only the .css file will be processed. The .scss file will be ignored in such a case.

### The Sass Import Path
In Sass, you can import other Sass files using the @import directive. In coServ, where can those imported files be found?

You can put your Sass mixins or libraries in the following directories and use the @import directive to import them:

    www/themes/[site_code_name]/sass
    
or

    www/cont/shared/sass

If you put Sass files in the first directory of the two, those files will only be visible to that website. If you put Sass files in the other directory, they'll be visible to ALL websites hosted on coServ.    

That should do it. If you would like to see some examples, you can find one in the demo.
