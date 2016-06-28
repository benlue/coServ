// don't do this inside startup(). should just do it once.
$(window).resize(adjustHeight);

var  curCaCode,
     curBlk = '';

/*
var  curDevice,
	 deviceIcon = {
		desktop: '/img/glyphicons-display.png',
		tablet: '/img/glyphicons-ipad.png',
		mobile: '/img/glyphicons-iphone.png'
	};
*/
ctrl.startup = function()  {
	// set up the website selector (drop-down list)
	var  dropCtrl = __.getCtrl('websiteList');

	dropCtrl.addHandler('itemChosen', function(caCode) {
        curCaCode = caCode;
        var  label = '<%=ph.websiteLabel%> [<b>' + curCaCode + '</b>] ';
		dropCtrl.setLabel( label );

		ctrl.sel('#wsConfigBtn').show();
		ctrl.switchMainList();

		var  idxCtrl = __.getCtrl('workArea');
		idxCtrl.dispatch('home');
	});

	adjustHeight();
}


ctrl.webSettings = function()  {
	var  wsCtrl = __.getCtrl('websiteMenu');
	wsCtrl.clearMenu();

	var  idxCtrl = __.getCtrl('workArea');
	idxCtrl.dispatch('website', ctrl.getCurrentSite());
}


/**
 * Switch the menu pane to the main website work menu.
 */
ctrl.switchMainList = function()  {
	ctrl.sel('#taskBar button').removeClass('btn-primary').addClass('btn-default');
	ctrl.sel('#taskBar button span').removeClass('activeBtn');

	ctrl.sel('#mainTask').addClass('btn-primary');
	ctrl.sel('#mainTask span').addClass('activeBtn');

	var  pdata = {
			knownAs: 'websiteMenu',
			params: {caCode: curCaCode}
		 };
	ctrl.embed('#switchPane', '/mainMenu/menuBody', pdata, function(mbodyCtrl) {
        mbodyCtrl.addHandler('blkSelected', function(bkName)  {
            var  idxCtrl = __.getCtrl('workArea');
            idxCtrl.dispatch('block', curBlk = bkName);
        });
    });
}


/**
 * Switch the menu pane to the block info pane.
 */
ctrl.switchBlockInfo = function()  {
	ctrl.sel('#taskBar button').removeClass('btn-primary').addClass('btn-default');
	ctrl.sel('#taskBar button span').removeClass('activeBtn');

	ctrl.sel('#blockTask').addClass('btn-primary');
	ctrl.sel('#blockTask span').addClass('activeBtn');
    
    var  blkCtrl = __.getCtrl('mainMenuBlockList'),
         blkList = blkCtrl.getBlockList(),
         pdata = {
             caCode: curCaCode,
             bk: curBlk,
             autoList: blkList
         };
	ctrl.embed('#switchPane', '/mainMenu/blockInfo', pdata);
}


ctrl.getCurrentSite = function()  {
	return  curCaCode;
}


function  adjustHeight()  {
	var  h = window.innerHeight
			 - 56
			 //- $('#pgFooter').outerHeight(true)
			 - ctrl.sel('#websiteDropdown').outerHeight(true);

	ctrl.sel('#menuContainer').height( h ); 
}