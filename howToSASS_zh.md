# 關於在coServ中使用SASS

-----------------
以下引用 Sass 官網的一段話：

> Sass 是世界上最成熟、穩定和強大的專業級 CSS 擴充語言

不管你相不相信Sass官網上的這段話，Sass 目前確實受到不少前端工程師的歡迎。所以從 0.8.8 版開始，coServ 提供了對 Sass 第一級 (first class) 的支援。這表示在 coServ 上，你可以直接撰寫 Sass 的程式碼然後讓 coServ 自動為你編譯、然後輸出到 HTML。你不再像目前多數的前端工程師需要麻煩的儲存、編譯、複製所撰寫的 Sass 結果到目的路徑上。

對於尚不熟悉但有興趣認識 Sass 的開發者，可以前往 [Sass 官網](http://sass-lang.com) 來了解更多 Sass 詳情。

## 如何使用
在 coServ 中使用 SASS 是相當簡單的。你只要在區塊目錄下用 .scss 檔案取代原有的 .css 檔就可以了。「區塊目錄」是 coServ 用來儲存一個區塊所有設計檔的地方。如果你還不熟悉 coServ 如何存放檔案，請參考這篇[文章](http://coimotion.github.io/coServ/zh/structure.html)。

以下的示意圖可以幫助你更容易了解：

    blocks
       |
       + views
           |
           + myBlock
              |
              +  myBlock.html /* HTML 樣板 */
              |
              +  myBlock.css  /* CSS 樣板 */
              |
              +  myBlock.js   /* Javascript 樣板 */
              |
              +  myBlock.lang  /* 多語支援的資源套件 */
              |
              +  myBlock.scss  /* 就是這個... scss 程式檔 */

事實上你不需同時提供 .css 和 .scss 檔，你只需提供其中一個。如果二個檔同時存在，coServ 只會讀取 .css 檔，.scss檔會被忽略。

### Sass 的匯入路徑
在 Sass 中你可以用 @import 的指令來匯入其他的 Sass 檔。但是被匯入的檔從何而來呢？

在 coServ 中，要被匯入的 Sass 檔案應放置在以下的路徑中：

    www/themes/[site_code_name]/sass
    
或是

    www/cont/shared/sass

如果你放在第一個路徑，那麼其中的檔案只有對應的網站可以看到（匯入）。反之，如果你把 Sass 檔放在第二個路徑，那麼在 coServ 上所有的網站都能看到（匯入）。

了解了這些應該就可以在 coServ 上玩 Sass 的功能了。如果你需要參考一些範例，那麼請看我們所提供的 demo。
