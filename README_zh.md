# coServ

coServ 是以 node.js 實作的一個非常精簡的 web server。以一千多行的程式碼，coServ 支援了 MVC 架構、網頁版型設計模式、幾乎無所不能的樣板引擎、快速簡易的多國語言生成、類似 SASS 的 CSS 前置處理器等等功能。coServ 的設計目的是為 node.js 的開發者帶來友善的 web 開發環境。

不論是只有幾篇靜態網頁的小網站，或是結構複雜的網路應用（web app），coServ 都可勝任愉快。coServ 用以 Javascript 為基礎的樣板引擎，協助網站開發者將內容和視覺設計做有效的分離。很特別的是，coServ 的樣板引擎不僅可以將 Javascript 程式碼嵌入 HTML，也可以把 Javascript 嵌入 CSS、甚至 Javascript 中。此外，coServ 將網頁分解成較小的區塊，而這些內容區塊可以被動態的載入。如此一來，不僅網站開發的時間會大幅減低，單頁式網站也很容易以 coServ 實作出來。

coServ 試著盡量不去更動 CSS 或是 Javascript 的語法。它沒有創造一套全新的技術系統讓開發者必須花許多時間去學習後才能寫出任何程式。使用 coServ，你不必學習新的語法，但你確實會以不同的角度來看待網路應用程式的開發。藉由不同的視野和觀點，網路應用的開發可以容易的多，也有趣的多。

##  功能特色

+ 比網站樣板更強大的「頁型」系統，使前端設計更為簡便。

+ 將網頁分解成區域和區塊。設計時只需專注於小規模的區塊，coServ 會自動將網頁組合好。每個區塊可以重複使用在不同的網頁中，並可以被動態的載入頁面中而不影響頁面的其他部分。

+ 可將 Javascript 程式碼嵌入 HTML, CSS 甚至 Javascript 中，使所謂 MVC 模式中的 view 和 controller 更有彈性。

+ 一個比 SASS 更靈活、更有彈性的 CSS 前置處理器

+ 利用 node.js 的模組來提供網站客製化的功能。

+ 如果你不想再花那麼多時間和精力去搞定資料庫，coServ 能自動從 COIMOTION API 服務中讀寫資料來取代資料庫或檔案系統的功能。

+ 單一的 coServ 可以支援多個網站，而且非常簡單。只需簡單的設定碼就可搞定。

+ 利用語系資源套件來支援多國語系。支援多國語言只需單一的 HTML 原始檔。


## 開發者文件
關於版本說明，請參考[這裡](https://github.com/coimotion/coServ/blob/master/ReleaseNote.txt)。更多關於 coServ 的說明與技術文件，請參考[這裡](http://coimotion.github.io/coServ/zh/index.html)

## 如何安裝
從 0.8.8 版起，coServ 開始支援 SASS。其中使用了 node-sass 這個模組，而這個模組需要 super-user 的權限才能安裝。因此在 Linux 或是 Mac 上請用以下的指令安裝：

    sudo npm install coserv
    
若是在 Windows 上，必須用 adminstrator 的權限來執行以下的指令：

    npm install coserv

## 如何使用
1. 安裝完成後到 coServ 目錄底下執行 'node coServ.js' 即可。Server 預設跑在 8080 port。

2. 如果你希望 server 跑在其他的埠號（例如 80），可以直接修改 coServ.js 的最後一行。

3. 如果你要指定網域給 server，那麼只需修改 'www/sites.json' 這個檔。把裡面的 IP 網址 127.0.0.1 改成你所要的網域即可（當然你要先取得網域，並將 DNS 指向 coServ 所在的位置）。

4. 試著在網路瀏覽器上輸入' http://127.0.0.1:808'0（如果你已指定了網域，那就改用 'http://www.yourDomain.com'）。如果設定都正確，你就會看到預設的首頁。

## 建立自己的網站
從範例開始改大概是最快的方法。假設你用下載內容中的 'demoApp'做基礎，以下說明所需的步驟：

1. 到 coServ/www/themes 目錄底下複製整個 'index'的目錄，並為新的目錄取個名。假設這個新網站的代碼名稱為 'foo'。

2. 所有網站的一切（外觀、行為）都是由'www/themes/foo'目錄底下的檔案所決定，沒其他地方了。關於檔案的放置位置和用法，請參考這篇[文章](http://coimotion.github.io/coServ/zh/structure.html)。

從 0.8.6 版起，coServ 有了 command line 的介面來簡化新增網站以及新增網頁的工作。你不再需要手動建立相關的檔案了。要新增網站可以用：

    > node clie/addSite.js your_web_site web_domain

第一個參數是網站代碼，而第二個參數是網域名稱。第二個參數可以不給，若不給會被預設成 '127.0.0.1'。若要為網站新增網頁，可以使用下列的命令：

    > node cli/addPage.js web_site page_name

當你要使用 coServ 架站時，我們極度建議你先參考這篇[文章](http://coimotion.github.io/coServ/zh/index.html)。這將會節省你很多時間。

### 管理你的網站設計檔
不論你在一個 coServ 上掛了幾個網站，所有的網站資料都是放置在 'www' 這個目錄下。當你安裝 coServ 時，'www' 目錄預設是放在 coServ 裡面的。不過你可以將 'www' 這個目錄放在任何你想要的位置，你只需將 'www' 目錄所在的位置設定到 config.json 檔案中的 'wwwPath' 屬性即可。例如你的 'www' 目錄是放在 /Users/john/www 中，那麼你的 config.json 檔應該是像以下的樣子：

    {
	    "apiEngine": {
		    "host": "coimapi.tw",
		    "port": 80,
		    "method": "POST"
	    },
	    "wwwPath": "/Users/john/www"
    }
    
有了這個功能，以後在更新 coServ 版本時就不用再擔心原有的網站設計被覆寫掉了。

### 樣板引擎
使用 coServ 開發，開發者會常將 Javascript 程式碼嵌入 HTML, CSS 甚或 Javascript 中。嵌入 Javascript 程式碼是透過樣板引擎 (template engine) 來達成。

#### 1. 語法
要引用coServ指令或Javascript程式碼，可以用：

    <% your javascript code or coServ directives here %>

要取得變數值或函式回傳值，則使用：

    <%= variable %>
    <%= foo_func(); %>

其中 _foo_func()_ 的回傳值必須是字串。

#### 2. 指令
除了嵌入 Javascript 程式碼到樣板中外，你也可以使用 coServ 的指令。coServ 的指令說明如下：

+ **region(region_path)**: 嵌入一個區域。區域像是一個容器，除了可以有自己的樣式設定外，區域主要的功能是用來包含其他的區域和區塊，方便做小範圍的排版。'region_path' 是用來指向定義區域的目錄。這個路徑的內容若是相對路徑（以 ./ 開頭），是相對於目前呼叫的區域所在目錄。如不是相對路徑，則表示要是用共用區域。共用區域一律存放在 'www/themes/share/views' 這個目錄底下。

+ **block(blockName, option)**: 嵌入一個區塊。區塊不項區域是個容器，而是會產生實際的內容。區塊的顯示方式會定義在 'www/themes/[Your_Website_Code]/blocks' 這個目錄下。'blockName' 這個參數表示區塊的名稱。

另外還有四個不常用到的指令，它們只有在設計版型時才會用到：

+ **includeCss()**: 這個指令會找出頁型、區域和區塊中所引用的 CSS 檔，並加以整合後輸出。這個指令應該只用在頁型中，用來列出所有的 CSS 檔，如 &lt;link rel=...&gt;

+ **includeJs()**: 這個指令會找出頁型、區域和區塊中所引用的 js 檔，並加以整合後輸出。這個指令應該只用在頁型中，用來列出所有的 js 檔，如 &lt;script type="text/javascript" source="..."&gt;&lt;/script&gt;

+ **css()**: 這個指令會把頁型、區域和區塊中所有的 CSS 規則整合起來，並加以輸出。這個指令應該只用在頁型中用來輸出 &lt;head&gt;&lt;style&gt;...&lt;/style&gt;&lt;/head&gt; 的內容。

+ **js()**: 這個指令會把頁型、區域和區塊中所有的 js 程式碼整合起來，並加以輸出。這個指令應該只用在頁型中用來輸出&lt;head&gt;&lt;script&gt;...&lt;/script&gt;&lt;/head&gt;的內容。



#### 3. 內建變數
樣板引擎本身提供了內建變數。這些內建變數在生成網頁時常會使用到。內建變數可以分成以下幾類：回傳變數、區塊變數、環境變數、片語和一個特殊的'ctrl'變數。

##### i. 回傳變數
回傳變數是在執行一個區塊時所產生的資料。這可能是呼叫一個遠端的 API 所回傳的結果（主要是呼叫COIMOTION API），或是執行一個本地端的區塊模組的傳回值。以下是一些範例：

    <%= value.title %>
    

可用來取得 title 的欄位，

    <% value.list.forEach(function(item) { %>
        <li><%= item.title %></li>
    <% }); %>
    
上面這個範例則是將傳回值中的 list 陣列，內容值的標題欄位一一取出。從以上的範例可以看出，'value' 就是用來取的回傳值的變數名稱。

##### ii. 區塊變數
每個區塊有自己的區塊變數。這些變數在內容生成時有時會用到：

+ uri: 區塊的引用網址

+ query: 引用區塊時所輸入的參數

+ service: 如果區塊是呼叫 COIMOTION API 來取的資料或內容，這個變數顯示 API 的呼叫網址。

+ viewPath: 這個區塊的顯示檔（包含HTML, Javascript, CSS, 包含檔和多語資源套件）所在的檔案目錄路徑。

##### iii. 環境變數
環境變數包含了與整個網頁（不只是個別區塊）相關的資訊：

+ locID: 網頁所使用的語系識別碼。

+ title: 網頁的標題文字。

+ description: 網頁的說明文字。可以用在 HTML 描述網頁的 meta tag 中。

##### iv. 片語
如果你的網站需要支援多國語系，只需在網頁上使用片語，並在多語資源套件檔中加上該片語的各國語言翻譯即可。例如：

    <%= ph.addr %>
    
會把 'addr' 這個片語轉成使用者所虛妄的語系文字。

##### v. ctrl變數
區塊重複使用是coServ一個非常重要的功能。但如何在 HTML 中辨識每個區塊，尤其是如何呼叫區塊的 controller 呢（指 MVC 架構中的 controller）？ coServ 提供了一個 'ctrl' 的變數，可協助開發者在 HTML 中取得區塊的 controller 。以下是個範例：


    <a onclick="<%=ctrl%>.clickLink(this);">...</a>
    
在這個例子中，使用者點選連結時，controller 的 clickLink() 這個方法就會被呼叫。

#### 4. 範例
利用樣板來產生 HTML 的內容是最常見的用法。下列的例子可以用來設定網頁的標題：

    <title><%=ctx.title%></title>
    
你也可以將一個 Javascript 程式改用樣板的方式來撰寫：

    if (<%= value.isValid %>)
        // 執行結果是有效的，顯示結果
    else
        // 對使用者提出警告
        
甚至 CSS 也可以用樣板來生成：

    ul.news {
        <% if (value.isImportant) { %>
        color: #red;
        <% } else { %>
        color: #black;
        <% } %>
    }
    


### 區塊模組
區塊模組是用來供給區塊資料的（如果你不是用 COIMOTON API 來取的資料）。它讓開發者可以提供客製的功能。區塊模組基本上就是一個 nodejs 的模組，但是必須實作 run() 這個函數。以下是個簡單的範例：

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

_run()_ 這個函式接受二個參數：_inData_ 包含了 HTTP request 的輸入參數（如果是 HTTP GET, 那麼 coServ 會將 query string 解析後放入 _inData_ 這個物件中； 如果是 HTTP POST, _inData_ 就是 POST 的內容），而 _callback_ 則是用來反還執行結果。

### JASS
coServ 0.9.0 最讓人興奮的功能就是 JASS 了。JASS 讓開發者用 Javascript 物件來儲存管理 CSS 屬性，再加上嵌入 Javascript 程式碼到 CSS 中的能力，使開發者有了一個很強大的工具來管理 CSS。

JASS 提供了二個特別的函式來處理 CSS：_jass.p()_ 用來印出 CSS 規則或屬性，而 _jass.r()_ 則可以產生一個 CSS 規則物件。如果你喜歡短一點的表示法，也可以用 _$.p()_ 和 _$.r()_ 來代替。

+ **jass.p(sel, prop)** : 列出一條 CSS 規則。其中 _sel_ 是選擇器字串 (selector string)，而 _prop_ 則是代表 CSS 屬性的 Javascript 物件。

+ **jass.p(prop)** : 把 _prop_ 這個 Javascript 物件當做 CSS 屬性並印出。

+ **jass.p(r)** : 印出一條 CSS 規則，其中 _r_ 是以 _jass.r()_ 所產生的 CSS 規則物件。

+ **jass.r(sel, prop)** : 產生一個 CSS 規則物件，其中 _sel_ 是選擇器字串 (selector string)，而 _prop_ 則是代表 CSS 屬性的 Javascript 物件。

對於每一個由 _jass.r()_ 所產生的規則物件，裡面也有一些常用的函式：

+ **add(prop)** : 增加一組 CSS 屬性到 CSS 規則中，其中 _prop_ 是代表 CSS 屬性的 Javascript 物件。

+ **add(rules)** : 串接一條或多條規則到現有的規則下，其中 _rules_ 可以是一個 CSS 規則物件，也可以是一個包含規則物件的陣列來同時串接多條規則。

+ **toString()** : 以 CSS 的格式將一個 CSS 規則物件列印出來。

如果想知道更多 JASS 的設計理念以及 JASS 和 SASS 的比較，可以參考 [這篇文章](http://coimotion.github.io/coServ/zh/jass.html)。