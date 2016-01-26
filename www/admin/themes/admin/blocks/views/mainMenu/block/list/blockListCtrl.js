var  blkCtrl;

ctrl.startup = function() {
	if (!blkCtrl)  {
		// don't register handler twice
		blkCtrl = __.getCtrl('blockList');

		blkCtrl.addHandler('pillItemChosen', function(bkName) {
			var  idxCtrl = __.getCtrl('workArea');
			idxCtrl.dispatch('block', bkName);
		});
	}
}


ctrl.refresh = function(itemName)  {
	var  params = {
		theme: ctrl.getTheme()
	};

	ctrl.reload({params: params}, function()  {
		if (itemName)  {
			$('#blockList li a').each(function() {
				if ($(this).text() === itemName)
					blkCtrl.chooseItem( $(this), itemName );
			});
		}
	});
}


ctrl.newBlock = function() {
	var  idxCtrl = __.getCtrl('workArea');
	idxCtrl.dispatch('block', '_+_');
}


ctrl.getTheme = function() {
    return  ctrl.sel('#themeField').val();
}