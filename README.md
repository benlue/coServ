# coServ

## Why coServ
Web applications are getting complicated day by day. Without a proper platofrm, web app developement could be a very time consuming task. So choosing the "right" plaftorm may be the #1 issue before you even start any coding efforts. If you're not satisfied with the existing platforms, you may be looking for a web platform like coServ.

coServ intends to minimize any programming overhead by reducing repetition, removing extra rounds of code generation or compilation, and shortening the development pipeline. Every development construct is intutive and requires skills nohting more than HTML, CSS or Javascript.

coServ offers the following features that could be good for developer's health:

* The practice of HTML codeing becomes the same as node.js coding. Developers use modules, libraries or functions to render HTML codes.

* Web pages are divided into smaller HTML fragments rendered by special node.js modules call palets.

* Palets are less complicated and easier to be implemented than a whole page. Also, palets can be reused.

* Because of palets, HTML refactoring is possible and actually encouraged.

* CSS encapsulation is automatic. Any css decorations inside a palet is not visisble to other palets or pages.

* The model, view and control of a palet are coded in the same node.js module (program).

* Regardless it's backend or front-end, use one single language (Javascript) to do both.


## Get started
To install

	npm install coserv

A three parts tutorial using a TODO list web app can quickly get you started.

* Part I: [Using a command line tool to quickly create web apps](https://medium.com/@benlue3/coserv-tutorial-part-i-5b4f76c016f3).

* Part II: [Adding the controller and re-using palets](https://medium.com/@benlue3/coserv-tutorial-part-ii-979418449a9)

* Part III: [How MVC is implemented in coServ](https://medium.com/@benlue3/coserv-tutorial-part-iii-6801635285ab)

## Differences between the current and earlier releases
For those who have been the users of the ealier versions of coServ, you'll notice that this official release (v1.0) is not compatible with the older versions. However, the core concepts and principles of how a web app is constructed and organized remain the same.

Below are highlights of the major differences:

* HTML code generation was done by template literals, while now it's done by node.js modules.

* coServ divides up a web page to smaller fragments. Earlier versions call those HTML fragments as "blocks" while the official release calls it "palet".

* "Blocks" are made up of at most four files (HTML, CSS, Javascript and a language resource file), while a palet is defined by a single node.js program (module).

* A new application construct UIC (UI Components) is introduced to further facilitate HTML componentization and refactoring.

* The file structure of a web application remains relatively the same. There are just some minor directory name changes.