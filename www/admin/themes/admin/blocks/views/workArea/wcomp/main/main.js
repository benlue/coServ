var  wcomp = '<%=bi.query.wcomp%>';

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
	}

	embedEditor(mode);
}


ctrl.config = function(link)  {
	ctrl.sel('.nav li').removeClass('active');
	$(link).parent().addClass('active');

	var  menuCtrl = __.getCtrl('pgMainMenu'),
		 params = {
			caCode: menuCtrl.getCurrentSite(),
			wcomp: wcomp
		 };

	ctrl.embed('#editBody', '/workArea/wcomp/config', {params: params});
}


function  embedEditor(bkType) {
	var  params = {
		wcomp: wcomp,
		mode: bkType
	}
	ctrl.embed('#editBody', '/workArea/wcomp/edit', {params: params});
}