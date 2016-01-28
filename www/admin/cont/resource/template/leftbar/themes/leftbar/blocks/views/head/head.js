ctrl.startup = function () {
	menuHide();
};
$(window).resize( function() {
	window.setTimeout(function(){
		menuHide();
	}, 200);
});

function menuHide() {
	var w = ctrl.sel('#head-layout').width();
	if (w < 748) {
		ctrl.sel('#btn-menu').show();
	}
	else {
		ctrl.sel('#btn-menu').hide();
		if ($("#pgContainer").hasClass("toggled")) {
			ctrl.showLeftMenu();
		}
	}
};

ctrl.showLeftMenu = function() {
	$("#pgContainer").toggleClass("toggled");
};