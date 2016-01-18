var  layout = '<%=bi.query.layout%>';

ctrl.startup = function() {
	embedEditor('html');
}


ctrl.clickTab = function(link)  {
	ctrl.sel('.nav li').removeClass('active');
	$(link).parent().addClass('active');

	var  target = $(link).text(),
		 mode = "html";

	switch (target)  {
		case 'HTML':
			mode = "html";
			break;

		case 'CSS':
			mode = "css";
			break;

		case 'Include':
			mode = "inc";
			break;
	}

	embedEditor(mode);
}


ctrl.config = function(link)  {
	ctrl.sel('.nav li').removeClass('active');
	$(link).parent().addClass('active');

	var  blkCtrl = __.getCtrl('mainMenuBlockList'),
		 params = {
			layout: layout,
			theme: blkCtrl.getTheme()
		 };

	ctrl.embed('#editBody', '/workArea/layout/config', {params: params});
}


function  embedEditor(bkType) {
	var  params = {
		layout: layout,
		mode: bkType
	}
	ctrl.embed('#editBody', '/workArea/layout/edit', {params: params});
}