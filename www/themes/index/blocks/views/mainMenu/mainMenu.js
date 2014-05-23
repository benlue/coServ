ctrl.startup = function()  {
    ctrl.sel('#mmenu1').on('show.bs.collapse', function()  {
        getBodyCtrl().reload('/index');
    });

    ctrl.sel('#mmenu2').on('show.bs.collapse', function()  {
        getBodyCtrl().reload('/co/rss', {params: {url: 'http://feeds.bbci.co.uk/news/rss.xml'}});
    });

    ctrl.sel('#mmenu3').on('show.bs.collapse', function()  {
        getBodyCtrl().reload('/reuse');
    });
};


function  getBodyCtrl()  {
    var  bodyBkID = $('#_mainC').children('div').first().attr('id'),
         bodyCtrl = __.getCtrl(bodyBkID);

    return  bodyCtrl;
};
