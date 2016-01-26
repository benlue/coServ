var  oldLi;

ctrl.chooseItem = function(link, arg) {
	if (oldLi)
		oldLi.removeClass('active');

	oldLi = $(link).parent();
	oldLi.addClass('active');

	ctrl.callHandler('pillItemChosen', arg);
};