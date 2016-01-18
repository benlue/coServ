ctrl.chooseItem = function(arg)  {
	ctrl.callHandler('itemChosen', arg);
}


ctrl.setLabel = function(label)  {
	var  s = label + '<span class="caret"></span>';
	ctrl.sel('.dropdown button').html( s );
}