var  layCtrl;

ctrl.startup = function() {
	if (!layCtrl)  {
		// don't register handler twice
		layCtrl = __.getCtrl('layoutList');

		layCtrl.addHandler('pillItemChosen', function(layoutName) {
			var  idxCtrl = __.getCtrl('workArea');
			idxCtrl.dispatch('layout', layoutName);
		});
	}
}


ctrl.refresh = function(itemName)  {
	var  menuCtrl = __.getCtrl('pgMainMenu'),
		 params = {
			caCode: menuCtrl.getCurrentSite()
		 };

	ctrl.reload({params: params}, function()  {
		if (itemName)  {
			$('#layoutList li a').each(function() {
				if ($(this).text() === itemName)
					layCtrl.chooseItem( $(this), itemName );
			});
		}
	});
}