// don't do this inside startup(). should just do it once.
$(window).resize(adjustHeight);

ctrl.startup = function() {
	// make this block available to other blocks as 'workArea'
	ctrl.setID('workArea');

	adjustHeight();
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
		if (target === '_+_')  {
			// create a new block
			ctrl.embed('#bodyArea', '/workArea/block/config');
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
};


function  adjustHeight()  {
	var  w = window.innerWidth - 330, // 20 + 280 + 10 + 20
		 h = window.innerHeight - $('#pgHead').outerHeight(true) - $('#pgFooter').outerHeight(true);
	ctrl.sel('#bodyArea').width(w).height( h - 25 );  // 5: header margin, 20: footer margin
}