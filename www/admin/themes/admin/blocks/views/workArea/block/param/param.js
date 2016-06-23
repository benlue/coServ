ctrl.runBlock = function()  {
    var  params = collectParams();

    //console.log( JSON.stringify(params, null, 4));
    ctrl.callHandler('reqIssued', params);
}


ctrl.getParameters = function()  {
	return  collectParams();
}


function  collectParams() {
	var  params = {};
	ctrl.sel('input:text').each(function(i) {
		params[$(this).attr('name')] = $(this).val();
	});

	return  params;
}