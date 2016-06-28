var  autoList = <%= JSON.stringify(bi.query.autoList); %>;

ctrl.startup = function()  {
    var  list = [];
    for (var i in autoList)
        list[i] = autoList[i].title;
    
    ctrl.sel('.typeahead').typeahead({
        source: list
    });
    
    <% if (bi.query.bk)  { %>
    var  param = {
        caCode: '<%=bi.query.caCode%>',
        bkName: '<%=bi.query.bk%>'
    };
    ctrl.embed('#bkDetail', '/mainMenu/block/info', param);
    <% } %>
}


ctrl.enterBlock = function(e)  {
    if (e.keyCode == 13)  {
        var  param = {
            	caCode: '<%=bi.query.caCode%>',
            	bkName: $(e.target).val()
        	 };
        ctrl.embed('#bkDetail', '/mainMenu/block/info', param);
    }
}