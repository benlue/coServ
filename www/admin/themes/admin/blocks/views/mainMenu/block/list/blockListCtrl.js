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
    
    var  bk = '<%=bi.query.bk%>';
    if (bk)  {
        var  pos = bk.length * 2;
        ctrl.sel('#bkFilter').focus()[0].setSelectionRange(pos, pos);
    }
}


ctrl.refresh = function(itemName, bkName)  {
	var  menuCtrl = __.getCtrl('pgMainMenu'),
		 params = {
			caCode: menuCtrl.getCurrentSite()
		 };
    
    if (bkName)
        params.bk = bkName;

	ctrl.reload({params: params}, function()  {
		if (itemName)  {
			$('#blockList li a').each(function() {
				if ($(this).text() === itemName)
					blkCtrl.chooseItem( $(this), itemName );
			});
		}
	});
}


/**
 * Trim down the blocks shown
 */
ctrl.filterBlock = function(inbox)  {
    var  bkName = $(inbox).val();
    ctrl.refresh(null, bkName);
}