var  bkName = '<%=bi.query.bkName%>';

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

		case 'JS':
			mode = "js";
			break;

		case 'Language':
			mode = "lang";
			break;

		case 'Model':
			mode = "model";
			break;
	}

	embedEditor(mode);
}


ctrl.config = function(link)  {
	ctrl.sel('.nav li').removeClass('active');
	$(link).parent().addClass('active');

	var  blkCtrl = __.getCtrl('mainMenuBlockList'),
		 params = {
			bkName: bkName,
			theme: blkCtrl.getTheme()
		 };

	ctrl.embed('#editBody', '/workArea/block/config', {params: params});
}


function  embedEditor(bkType) {
	var  params = {
		bkName: bkName,
		bkType: bkType
	}
	ctrl.embed('#editBody', '/workArea/block/edit', {params: params});
}