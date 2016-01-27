var  compCtrl;

ctrl.startup = function() {
	if (!compCtrl)  {
		// don't register handler twice
		compCtrl = __.getCtrl('wcompList');

		compCtrl.addHandler('pillItemChosen', function(wcompName) {
			var  idxCtrl = __.getCtrl('workArea');
			idxCtrl.dispatch('wcomp', wcompName);
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
			ctrl.sel('#wcompList li a').each(function() {
				console.log("item test: %s, target: %s", $(this).text(), itemName);
				if ($(this).text() === itemName)
					compCtrl.chooseItem( $(this), itemName );
			});
		}
	});
}