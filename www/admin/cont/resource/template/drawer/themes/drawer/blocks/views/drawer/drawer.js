ctrl.startup = function() {
	$("#drawer-back").click(function(){
		ctrl.closeDrawer();
	});
};

ctrl.closeDrawer = function() {
	$("#pgLeft").stop().animate({
		left: -300
	}, 300, function(){
		$("#drawer-back").hide();
		$("#drawer-back").css('opacity', '0.0');
	});
};
