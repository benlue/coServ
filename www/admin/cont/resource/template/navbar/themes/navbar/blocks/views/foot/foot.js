ctrl.startup = function () {
	
};

ctrl.reloadPage = function (page) {
	getBodyCtrl().reload(page, {params: {_loc: '<%=bi.locale%>'}});
};

function getBodyCtrl()  {
    var bodyBkID = $('#_mainC').children('div').first().attr('id'),
        bodyCtrl = __.getCtrl(bodyBkID);
    return  bodyCtrl;
};

ctrl.goToTop = function() {
	$('html, body').animate({ scrollTop: 0 }, 'fast');
};