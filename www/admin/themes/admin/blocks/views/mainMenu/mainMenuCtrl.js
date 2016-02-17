// don't do this inside startup(). should just do it once.
$(window).resize(adjustHeight);

var  curCaCode,
	 _newObj = false,
	 collapseID;

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
		ctrl.sel('#wsConfigBtn').show();
		ctrl.sel('#menuPane').show();

		curCaCode = caCode;
		
		var  label = '<%=ph.websiteLabel%> [<b>' + curCaCode + '</b>] ';
		dropCtrl.setLabel( label );

		var  layCtrl = __.getCtrl('mainMenuLayoutList');
		layCtrl.reload({params: {caCode: curCaCode}});

		var  blkCtrl = __.getCtrl('mainMenuBlockList');
		blkCtrl.reload({params: {caCode: curCaCode}});

		var  compCtrl = __.getCtrl('mainMenuWcompList');
		compCtrl.reload({params: {caCode: curCaCode}});
        
        var  idxCtrl = __.getCtrl('workArea');
		idxCtrl.dispatch('home');
	});

	/*
	// here we set up the device selector
	var  ddCtrl = __.getCtrl('deviceDD');
	ddCtrl.addHandler('itemChosen', function(device)  {
		curDevice = device;

		var  label = '<img class="deviceGglyph" src="' + deviceIcon[device] + '"> ';
		ddCtrl.setLabel( label );
	});
	*/
	
	ctrl.sel('#menuPane').on('hidden.bs.collapse', function (event) {
		// clear up display when users switch panel
		clearMenuList();
		
		if (_newObj)  {
			/*
			if ($(event.target).attr('id') === collapseID)
				$(event.target).addClass('in');
			*/

			_newObj = false;
		}
		else  {
			var  idxCtrl = __.getCtrl('workArea');
			idxCtrl.dispatch('home');
		}
	});

	adjustHeight();
}


ctrl.webSettings = function()  {
	var  idxCtrl = __.getCtrl('workArea');
		 //blkCtrl = __.getCtrl('mainMenuBlockList');

	clearMenuList();
	idxCtrl.dispatch('website', ctrl.getCurrentSite());
}


ctrl.newLayout = function() {
	_newObj = true;
	collapseID = 'collapseOne';

	var  idxCtrl = __.getCtrl('workArea');
	idxCtrl.dispatch('layout', '_+_');
}


ctrl.newBlock = function() {
	_newObj = true;
	collapseID = 'collapseTwo';
	
	var  idxCtrl = __.getCtrl('workArea');
	idxCtrl.dispatch('block', '_+_');
}


ctrl.newWComp = function() {
	_newObj = true;
	collapseID = 'collapseThree';
	
	var  idxCtrl = __.getCtrl('workArea');
	idxCtrl.dispatch('wcomp', '_+_');
}


ctrl.getCurrentSite = function()  {
	return  curCaCode;
}


/**
 * (Visually) unselect active menu items.
 */
function  clearMenuList()  {
	ctrl.sel('.panel-body li').removeClass('active');
}


function  adjustHeight()  {
	var  h = window.innerHeight
			 - 65
			 //- $('#pgFooter').outerHeight(true)
			 - ctrl.sel('#websiteDropdown').outerHeight(true);

	ctrl.sel('#menuContainer').height( h ); 
}