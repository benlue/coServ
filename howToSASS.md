關於SASS
======

[如何使用SASS][3]

[3]: <http://sass-lang.com/guide>



SCSS檔特色

變數

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$font-size: 18px;
$font-stack: Helvetica, sans-serif;
body {
    font: $font-size $font-stack;
    color: red;
}
----
body {
    font: 18px Helvetica, sans-serif;
    color: red;
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



巢狀

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ul {
    list-decoration: none;
    li {
        font-size: 100%;
        color: red;
    }
}
----
ul {
    list-decoration: none;
}
ul li {
    font-size: 100%;
    color: red;
}

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



mixin

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
@mixin border-radius($radius) {
    -webkit-border-radius($radius);
       -moz-border-radius($radius);
        -ms-border-radius($radius);
         -o-border-radius($radius);
            border-radius($radius);
}
button {
    @include border-radius(5px);
}
----
button {
    -webkit-border-radius(5px);
       -moz-border-radius(5px);
        -ms-border-radius(5px);
         -o-border-radius(5px);
            border-radius(5px);
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



extend

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
.message {
    font-size: 18px;
    color: #333;
}
.success {
    @extend .message;
    color: green;
}
.error {
    @extend .message;
    color: red;
}
----
.message, .success, .error {
    font-size: 18px;
    color: #333;
}
.success {
    color: green;
}
.error {
    color: red;
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



計算

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
nav {
    width: 200px / 300px * 100%;
}
----
nav {
    width: 66.66666666666%;
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



如何使用
====

在coServ，SASS可以放在兩個地方 - Blcoks & Cont



### Blocks ( 部分使用)

網頁切板常以區塊區分，這也是coServ載入頁面的最小單位，而一個block 會有這些檔案

    blocks

        views

            myBlock

                myBlock.html

                myBlock.css

                myBlock.js

                myBlock.lang  /\* 多國語言設定檔 \*/

                myBlock.scss  /\* Here! \*/

  
你可能會有疑問，有CSS又有SCSS，那coServ會怎麼載入呢 ？

答案是css。coServ先找Blocks內的.css，沒有？載入.scss。

但coServ直接幫你在網頁加上sass編譯完成的css code，而不用另存新檔。



### Cont (共用)

實際上是cont/shared/sass，適合放mixin library或自定的mixin.scss，讓myBlock.scss引用



### 擴充Mixin - Bourbon

Mixin Library百百種 - [Compass][1], [Bourbon][2]...等

[1]: <http://compass-style.org>

[2]: <http://bourbon.io>

Bourbon是其中之一受歡迎的，我們也將拿它示範coServ如何擴充，拿高手的mixin簡化css開發流程。

    1.  安裝node-bourbon模組

        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        npm install node-bourbon --save
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    2.  移除WebView.js 註解處 //drink bourbon

    3.  myBlock.scss

        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        /* myBlock.scss */
        @import "bourbon"; /* 載入bourbon mixin*/

        ....
        .
        .
        ....[your sass code]
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

這樣就能使用Bourbon的mixin了！(參閱我們的範例: sass/view)
