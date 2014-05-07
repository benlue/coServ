/* This function will be invoked when users make a language selection */
ctrl.selectLang = function(sel) {
	var  lang = $(sel).val();
	window.location = '/page/multiL?_loc=' + lang;
};