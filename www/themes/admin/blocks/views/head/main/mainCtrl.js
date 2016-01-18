var  blkCtrl;

ctrl.startup = function() {
	if (!blkCtrl)  {
		// don't register handler twice
		blkCtrl = __.getCtrl('langList');

		blkCtrl.addHandler('itemChosen', function(langCode) {
            var  label = '<%=ph.selectLabel%> [<b>' + langCode + '</b>] ';
			blkCtrl.setLabel(label);

			// reload the page with the newly selected locale
			document.cookie = encodeURIComponent('_xs_locale') + "=" + encodeURIComponent(langCode) + "; path=/";
			document.location.reload();
		});
	}
}


ctrl.newWebsite = function()  {
	ctrl.sel('#createWSDialog').modal('show');
}