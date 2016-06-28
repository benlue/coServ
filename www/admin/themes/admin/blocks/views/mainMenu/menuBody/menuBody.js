var  curCaCode = '<%= bi.query.caCode %>',
	 _newObj = false,
	 collapseID;

ctrl.startup = function()  {
    var  param = {caCode: curCaCode},
         idxCtrl = __.getCtrl('workArea');
    
    var  layCtrl = __.getCtrl('mainMenuLayoutList');
    layCtrl.reload(param);

    var  blkCtrl = __.getCtrl('mainMenuBlockList');
    blkCtrl.addHandler('blkSelected', function(bkName)  {
    	console.log('block selected: ' + bkName);
        ctrl.callHandler('blkSelected', bkName);
    });
    /*
    blkCtrl.reload(param, function(bkCtrl) {
        //idxCtrl.adjustHeight();
        bkCtrl.addHandler('blkSelected', function(bkName)  {
            ctrl.callHandler('blkSelected', bkName);
        });
    });
    */

    var  compCtrl = __.getCtrl('mainMenuWcompList');
    compCtrl.reload(param, function() {
        //idxCtrl.adjustHeight();
    });
    
    ctrl.sel('#menuPane').on('hidden.bs.collapse', function (event) {
		// clear up display when users switch panel
		clearMenuList();
		
		if (_newObj)
			_newObj = false;
		else  {
			var  idxCtrl = __.getCtrl('workArea');
			idxCtrl.dispatch('home');
		}
	});

	ctrl.sel('#menuPane').on('shown.bs.collapse', function (event) {
		var  idxCtrl = __.getCtrl('workArea');
		idxCtrl.adjustHeight();
	});
}


ctrl.clearMenu = function()  {
    clearMenuList();
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


function  getCurrentApp() {
    return  curCaCode;
}


/**
 * (Visually) unselect active menu items.
 */
function  clearMenuList()  {
	ctrl.sel('.panel-body li').removeClass('active');
}