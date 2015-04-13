# coServ
## 最新版本
coServ 目前的最新版本是 0.9.6。0.9.6 版主要提供了以下的新功能或改進：

+ 在 coServ 0.9.6 版中支援 server side redirect 的功能。

+ 更新 coServ 在最新的 node.js 版本下執行(v0.12.2)，並將 coServ 所依賴的模組版本都升到最新版。

+ 當你修改網站的任何一個檔案時（HTML, CSS 或 Javascript），coServ 會自動將網路瀏覽器上的頁面更新（live reload）。這個功能是以 [gulp](http://gulpjs.com) 達成。0.9.3 版提供了所需的gulpfile.js。

+ 現在 server 的埠號（port number）以及 node.js http 對 concurrent socket 總數的限制可以在 config.json 檔案中設定。關於 http concurrent socket 的限制，在 node.js 文件中有說明。如果你將 coServ 應用在 production 的環境中，把 server.maxSockets 設為 20 ~ 100 之間都算是合理的數字。

+ 0.9.3 版也提供了不少 bug fix。細節請參考 [ReleaseNote.txt](https://github.com/coimotion/coServ/blob/master/ReleaseNote.txt)。

## 為什麼要開發 coServ

這幾年來因為網路應用越來重視流暢的使用者經驗，而功能本身卻越來越複雜，使得網站開發的工作也越來越有挑戰性。許多新的網站平台(web framework)被設計出來解決這些新的挑戰。可惜的是，許多 framework 本身就是問題。現有的 framework 不是未能簡化開發工作的複雜度，就是自創一些新的語法和規格讓開發工作變得更複雜。事實上網路技術的三元素(HTML, CSS 和 Javascript)進化到今日已足以滿足多數網路應用的需要。平台所要做的是協助開發者有效的應用這三元素，而不是自創一套標準讓開發者重新去學習。基於現有各家 web framework 在開發方向上有一些基本的偏差，我們設計了 coServ 希望能幫助開發者把時間和精力用在刀口上。coServ 有三個主要的設計原則：

+ 讓開發者的時間花在思考、設計和實作上，而不是花在學習、記憶技術平台本身的使用方式或規則上。

+ 避免讓開發者重複相同的工作。

+ 利用適當的工具與設計模式，讓開發者可以充分發揮 HTML, CSS 和 Javascript 的功能。

##  coServ 的特色與功能

+ 以 node.js 開發、實作。

+ 不論開發者要實作後端功能或是編寫前端的樣板，都可以用單一語言（Javascript）達成。

+ 除了 HTML, CSS 和 Javascript，開發者不需要學習任何新的語法。

+ 協助開發者將網頁拆解成較小的區塊，每次專注在較小的區塊上。

+ 可能是現有任何方法中最簡單的多國語系支援。

+ 單一 coServ server 可以執行多個網站，而且非常容易管理。

+ 提供了一個比 SASS 更強大的 CSS 前置處理方案。


## 技術文件

開發者指南請參考[這裡](http://www.coservjs.org/coserv/guide?_loc=zh)。相關的部落格文章請參考[這裡](http://www.coservjs.org/coserv/doc?_loc=zh)。
