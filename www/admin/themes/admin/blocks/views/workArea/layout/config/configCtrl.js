ctrl.startup = function()  {
	reloadMapList();
}


/**
 * add a layout mapping
 */
ctrl.addMap = function(btn)  {
	var  mapURL = $(btn).parent().find('.mappedURL').val();

	if (mapURL)  {
		if (mapURL.charAt(0) != '/')
			mapURL = '/' + mapURL;

		//var  blkCtrl = __.getCtrl('mainMenuBlockList'),
		var  menuCtrl = __.getCtrl('pgMainMenu'),
			 pdata = {
			 	caCode: menuCtrl.getCurrentSite(),
			 	layout: ctrl.sel('#layoutName').text(),
		 		url: mapURL
		 	 };

		$.post('/workArea/layout/updateMap.wsj', pdata, function(result) {
			if (result.errCode)
				alert( result.message );
			else  {
				$(btn).parent().find('.mappedURL').val('');
				reloadMapList();
			}
		}, 'json');
	}
	else
		alert('<%=ph.jsAddMapWarning%>');
}


/**
 * Remove a layout mapping
 */
ctrl.delMapping = function(url)  {
	if (confirm('<%=ph.jsConfirmDelMap%>'))  {
		var  menuCtrl = __.getCtrl('pgMainMenu'),
			 pdata = {
			 	caCode: menuCtrl.getCurrentSite(),
			 	layout: ctrl.sel('#layoutName').text(),
		 		url: url,
		 		remove: true
		 	 };

		$.post('/workArea/layout/updateMap.wsj', pdata, function(result) {
			if (result.errCode)
				alert( result.message );
			else
				reloadMapList();
		}, 'json');
	}
}


ctrl.create = function()  {
	updateLayout( false );
}


ctrl.removeLayout = function()  {
	updateLayout( true );
}


function  updateLayout(isRemove)  {
	if (isRemove && !confirm('<%=ph.jsRemoveWarning%>'))
		return;

	var  layout = isRemove  ?  ctrl.sel('#layoutName').text() : ctrl.sel('#layoutName').val();

	if (layout)  {
		var  ep = isRemove  ?  '/workArea/layout/remove.wsj' : '/workArea/layout/create.wsj',
			 menuCtrl = __.getCtrl('pgMainMenu'),
			 pdata = {
				caCode: menuCtrl.getCurrentSite(),
				layout: layout
			 };

		$.post(ep, pdata, function(result) {
			if (result.errCode === 0)  {
				var  layCtrl = __.getCtrl('mainMenuLayoutList');
            	layCtrl.refresh(layout);

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


function  reloadMapList()  {
	var  menuCtrl = __.getCtrl('pgMainMenu'),
		 pdata = {
		 	caCode: menuCtrl.getCurrentSite(),
		 	layout: ctrl.sel('#layoutName').text()
	 	 };

	$.post('/workArea/layout/map.wsj', pdata, function(result) {
		var  list = result.errCode  ?  [] : result.value,
			 html;

		if (list.length === 0)
			html = '<li class="list-group-item"><%=ph.noMapping%></li>';
		else  {
			html = '';
			for (var i in list)
				html += '<li class="list-group-item"><button type="button" class="btn btn-info" onclick="__.getCtrl(\''
					 + ctrl.getBlockID() + '\').delMapping(\'' + list[i] + '\');">'
					 + '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button> '
					 + list[i] + '</li>';
		}

		ctrl.sel('#mapList').html(html);
	}, 'json');
}