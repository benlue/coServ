# coServ

## 為什麼會有 coServ 誕生

這幾年來因為網路應用越來重視流暢的使用者經驗，加上網站功能也越來越複雜，使得網站開發的工作變得非常具有挑戰性。許多新的網站平台 (web framework) 被設計出來解決這些新的挑戰。可惜的是，許多 framework 本身就是問題。現有的 framework 不是未能簡化開發工作的複雜度，就是自創一些新的語法和規格讓開發工作變得更複雜。事實上網路技術的三元素 (HTML, CSS 和 Javascript) 進化到今日已足以滿足多數網路應用的需要。平台所要做的是協助開發者有效的應用這三元素，而不是自創一套標準讓開發者重新去學習。基於現有各家 web framework 在開發方向上有一些基本的偏差，我們設計了 coServ 希望能幫助開發者把時間和精力用在刀口上。coServ 有三個主要的設計原則：

+ 讓開發者的時間花在思考、設計和實作上，而不是花在學習、記憶技術平台本身的使用方式或規則上。

+ 避免讓開發者重複相同的工作。

+ 利用適當的工具與設計模式，讓開發者可以充分發揮 HTML, CSS 和 Javascript 的功能。

##  coServ 的特色與功能

+ 不論開發者要實作後端功能或是編寫前端的樣板，都可以用單一語言（Javascript）達成。

+ 除了 HTML, CSS 和 Javascript，開發者不需要學習任何新的語法。

+ 讓開發者可以進行 HTML 重構 (refactoring)，並自動進行 CSS 防護 (CSS encapsulation)。

+ 協助開發者將網頁拆解成較小的區塊，每次專注在較小的區塊上。

+ 可能是現有任何方法中最簡單的多國語系支援。

+ 單一 coServ server 可以執行多個網站，而且非常容易管理。

+ 提供了一個比 SASS 更強大的 CSS 前置處理方案 (JASS)。

## 最新版本
coServ 目前的最新版本是 0.10.2。以下是最近版本所提供的新功能或改進：

+ [v0.10.0] 新增了網頁元件 (wcomp) 的功能，細節請參考[網頁元件](#wcomp)一節。網站的檔案結構也做了調整，使多網站的管理更方便。另外透過管理工具，現在可以將整個網站匯入或匯出。另外「region」的功能已退役，不建議再使用。

+ [v0.9.9] 除了一些小 bug 的修正，這個版本最大的變化就是新增了一個網站介面來管理以及協助開發者設計網站。詳細內容請詳以下「管理工具」一節。

+ [v0.9.8] 一些小問題的修正。此外，wFront.js 檔在此版本做了一些修正。如果你不是使用預設的 '/www' 目錄，記得將 wFront.js 檔複製到你的自定網站目錄中 (/www/cont/shared/js/wFront.js)。

+ [v0.9.6] 在 coServ 0.9.6 版中支援 server side redirect 的功能。

+ [v0.9.3] 當你修改網站的任何一個檔案時（HTML, CSS 或 Javascript），coServ 會自動將網路瀏覽器上的頁面更新（live reload）。這個功能是以 [gulp](http://gulpjs.com) 達成。0.9.3 版提供了所需的gulpfile.js。

+ 現在 server 的埠號（port number）以及 node.js http 對 concurrent socket 總數的限制可以在 config.json 檔案中設定。關於 http concurrent socket 的限制，在 node.js 文件中有說明。如果你將 coServ 應用在 production 的環境中，把 server.maxSockets 設為 20 ~ 100 之間都算是合理的數字。

更多版本更新資訊請參考 [ReleaseNote](https://github.com/coimotion/coServ/blob/master/ReleaseNote.md)。

## 管理工具
coServ 許多先進的構想讓網站設計可以有效的化繁為簡。不過因為 coServ 的觀念新穎，有些開發者一開始上手時不易了解或駕馭這個新的概念。從 0.9.9 版起，一個網頁介面的管理工具被創造出來，協助開發者更有效率的使用 coServ 去建置網站。

使用管理工具很容易，當你安裝好並啟動 coServ 之後，只需把你的網路瀏覽器指向


    http://localhost:8080
    
就可以開始使用管理工具的各項功能。

<a name="wcomp"></a>
## 網頁元件
從 0.10.0 版開始，coServ 新增了網頁元件的功能。透過網頁元件，你可以將複雜的網頁 UI 設計包裝成一個元件，然後在不同的網頁、甚至不同的網站中重複使用。

在概念上，網頁元件和 [web components](http://webcomponents.org/) 是很類似的。只是網頁元件不需要使用 shadow DOM，也不需要使用 polyfill 才能在不同的瀏覽器中工作。至於網頁元件和 coServ 原來所支援的「區塊」間有什麼不同呢？基本的差異在網頁元件不會預先綁定在任何資料模式上 (data model)。以 MVC 的設計模式來說，網頁元件只實作了 view 和 controller 的部份，而開放了資料模式端。所以更有利於元件的重複使用。

## 技術文件

使用指南請參考[這裡](https://benlue.gitbooks.io/coserv-user-guide/content/)。相關的部落格文章請參考[這裡](http://www.coservjs.org/coserv/doc?_loc=zh)。
