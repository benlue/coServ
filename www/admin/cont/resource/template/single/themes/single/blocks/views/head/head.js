ctrl.startup = function() {
	ctrl.sel('#dropdown-button').dropdown({
		inDuration: 300,
		outDuration: 225,
		constrain_width: false,
      	gutter: 0,
      	belowOrigin: false,
      	alignment: 'left'
  	});
};

ctrl.goToSection = function(section) {
	var sc = $("#pgBody").children()[section];
	$('html, body').animate({ scrollTop: $(sc).offset().top - 100 }, 'fast');
};