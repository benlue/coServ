// don't do this inside startup(). should just do it once.
$(window).resize(adjustHeight);

ctrl.startup = function() {
	// make this block available to other blocks as 'workArea'
	ctrl.setID('workArea');

	ctrl.adjustHeight();
};


/**
 * Receiving requests change the contents in the work area
 */
ctrl.dispatch = function(design, target) {
	//alert('design: ' + design + ', target: ' + target);
	if (design === 'home')
		ctrl.sel('#bodyArea').html('');
	else  if (design === 'website')  {
		var  params = {
			id: target
		};

		ctrl.embed('#bodyArea', '/website/info', params);
	}
	else  if (design === 'block')  {
		var  menuCtrl = __.getCtrl('pgMainMenu'),
		 	 caCode = menuCtrl.getCurrentSite();

		if (target === '_+_')  {
			// create a new block
			ctrl.embed('#bodyArea', '/workArea/block/config', {caCode: caCode});
		}
		else  {
			var  params = {
				bkName: target
			};

			ctrl.embed('#bodyArea', '/workArea/block/main', {params: params});
		}
	}
	else  if (design === 'layout')  {
		if (target === '_+_')  {
			// create a new block
			ctrl.embed('#bodyArea', '/workArea/layout/config');
		}
		else  {
			var  params = {
				layout: target
			};

			ctrl.embed('#bodyArea', '/workArea/layout/main', {params: params});
		}
	}
	else  if (design === 'wcomp')  {
		if (target === '_+_')  {
			// create a new block
			ctrl.embed('#bodyArea', '/workArea/wcomp/config');
		}
		else  if (target !== 'no-op')  {
			var  params = {
				wcomp: target
			};

			ctrl.embed('#bodyArea', '/workArea/wcomp/main', {params: params});
		}
	}
};


ctrl.adjustHeight = adjustHeight;

function adjustHeight()  {
	var  w = window.innerWidth - $('#bodyArea').position().left - 10,	// 10: rigth margin
		 h = window.innerHeight - 45 - $('#pgFooter').outerHeight(true);
		 //h = window.innerHeight - $('#pgHead').outerHeight(true) - $('#pgFooter').outerHeight(true);

	ctrl.sel('#bodyArea').width(w).height( h );
}