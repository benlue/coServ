$(window).resize(adjustHeight);

window.setTimeout(function() {
    adjustHeight();
}, 200);

var  paramBlkID = 'pvParams';

ctrl.startup = function()  {
    var  //menuCtrl = __.getCtrl('pgMainMenu'),
         param = {
            caCode: '<%=bi.query.caCode%>',
            bk: '<%=bi.query.url%>'
         },
         pdata = {
             params: param,
             knownAs: paramBlkID
         };
    
    ctrl.embed('#paramContainer', '/workArea/block/param', pdata, function(pmCtrl)  {
        pmCtrl.addHandler('reqIssued', refreshIframe);
    });
}

ctrl.refreshBlock = function() {
    var  pmCtrl = __.getCtrl( paramBlkID ),
         params = pmCtrl.getParameters();

    refreshIframe( params );
}


function  refreshIframe(params)  {
    var  port = ctrl.sel('#portNo').val() || '8080',
         url = 'http://<%=value.domain%>:' + port + '<%=bi.query.url%>.hf?_dev=1';

    $('body').append('<form action="' + url + '" method="post" target="pvFrame" id="postToIframe"></form>');
    $.each(params,function(n,v){
        $('#postToIframe').append('<input type="hidden" name="' + n + '" value="' + v + '" />');
    });
    $('#postToIframe').submit().remove();
}


function adjustHeight()  {
	var  h = $('#bodyArea').height() - $('#bodyArea > .nav-tabs').outerHeight(true) - ctrl.sel('#btnBar').outerHeight(true);
	ctrl.sel('#previewPane').css('height', h - 65);
}