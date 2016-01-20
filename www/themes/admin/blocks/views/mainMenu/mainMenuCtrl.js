// don't do this inside startup(). should just do it once.
$(window).resize(adjustHeight);

ctrl.startup = function()  {
	var  dropCtrl = __.getCtrl('websiteList');

	dropCtrl.addHandler('itemChosen', function(theme) {
		ctrl.sel('#menuPane').show();
		
		var  label = '<%=ph.websiteLabel%> [<b>' + theme + '</b>] ';
		dropCtrl.setLabel( label );

		var  layCtrl = __.getCtrl('mainMenuLayoutList');
		layCtrl.reload({params: {theme: theme}});

		var  blkCtrl = __.getCtrl('mainMenuBlockList');
		blkCtrl.reload({params: {theme: theme}});
        
        var  idxCtrl = __.getCtrl('workArea');
		idxCtrl.dispatch('home');
	});
	
	ctrl.sel('#menuPane').on('hidden.bs.collapse', function () {
		// clear up display when users switch panel
		ctrl.sel('.panel-body li').removeClass('active');
		
		var  idxCtrl = __.getCtrl('workArea');
		idxCtrl.dispatch('home');
	});

	adjustHeight();
}


ctrl.webSettings = function()  {
	var  idxCtrl = __.getCtrl('workArea'),
		 blkCtrl = __.getCtrl('mainMenuBlockList');

	idxCtrl.dispatch('website', blkCtrl.getTheme());
}


function  adjustHeight()  {
	var  h = window.innerHeight
			 - $('#pgHead').outerHeight(true)
			 - $('#pgFooter').outerHeight(true)
			 - ctrl.sel('#websiteDropdown').outerHeight(true) + 10;

	ctrl.sel('#menuContainer').height( h ); 
}