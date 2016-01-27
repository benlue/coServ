ctrl.create = function()  {
	updateWComp( false );
}


ctrl.remove = function()  {
	updateWComp( true );
}


function  updateWComp(isRemove)  {
	if (isRemove && !confirm('<%=ph.jsRemoveWarning%>'))
		return;

	var  wcomp = ctrl.sel('#wcompName').val();

	if (wcomp)  {
		if (wcomp[0] !== '/')
			wcomp = '/' + wcomp;

		var  ep = isRemove  ?  '/workArea/wcomp/remove.wsj' : '/workArea/wcomp/create.wsj',
			 menuCtrl = __.getCtrl('pgMainMenu'),
			 pdata = {
				caCode: menuCtrl.getCurrentSite(),
				wcomp: wcomp
			 };

		$.post(ep, pdata, function(result) {
			if (result.errCode === 0)  {
				var  wcompCtrl = __.getCtrl('mainMenuWcompList');
            	wcompCtrl.refresh(wcomp);

            	if (isRemove)  {
            		var  idxCtrl = __.getCtrl('workArea');
					idxCtrl.dispatch('home');
            	}
        	}
        	else
        		alert( result.message );
		}, 'json');
	}
	else
		alert('<%=ph.jsCreateWarning%>');
}