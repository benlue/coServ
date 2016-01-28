ctrl.startup = function() {

};

ctrl.openDrawer = function() {
	$("#pgLeft").stop().animate({
		left: 0
	}, 300, function(){
		$("#drawer-back").show();
		$("#drawer-back").css('opacity', '0.6');
	});
};