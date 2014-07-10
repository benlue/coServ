ctrl.startup = function()  {
    ctrl.sel('#mmenu1').on('show.bs.collapse', function()  {
        getBodyCtrl().reload('/index', {params: {_loc: '<%=bi.locale%>'}});
    });

    ctrl.sel('#mmenu2').on('show.bs.collapse', function()  {
        getBodyCtrl().reload('/co/rss', {params: {url: 'http://feeds.bbci.co.uk/news/rss.xml', _loc: '<%=bi.locale%>'}});
    });

    ctrl.sel('#mmenu3').on('show.bs.collapse', function()  {
        getBodyCtrl().reload('/reuse', {params: {_loc: '<%=bi.locale%>'}});
    });

    ctrl.sel('#mmenu4').on('show.bs.collapse', function()  {
        getBodyCtrl().reload('/user/login', {params: {_loc: '<%=bi.locale%>'}});
    });

    ctrl.sel('#mmenu5').on('show.bs.collapse', function()  {
        getBodyCtrl().reload('/blog/list', {params: {_loc: '<%=bi.locale%>'}});
    });
};

ctrl.selectLang = function(sel) {
    window.location = '/?_loc=' + $(sel).val();
};


function  getBodyCtrl()  {
    var  bodyBkID = $('#_mainC').children('div').first().attr('id'),
         bodyCtrl = __.getCtrl(bodyBkID);

    return  bodyCtrl;
};
