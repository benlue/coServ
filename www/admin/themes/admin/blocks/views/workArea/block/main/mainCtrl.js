var  bkName = '<%=bi.query.bkName%>';

ctrl.startup = function() {
	<% if (value.isXS)  { %>
	embedEditor('xs');
	<% } else  { %>
	embedEditor('html');
	<% } %>
}


ctrl.clickTab = function(link, target)  {
	ctrl.sel('.nav li').removeClass('active');
	$(link).parent().addClass('active');

	var  mode = "html";

	switch (target)  {
		case 'xs':
			mode = "xs";
			break;

		case 'phs':
			mode = "phs";
			break;

		case 'html':
			mode = "html";
			break;

		case 'css':
			mode = "css";
			break;

		case 'js':
			mode = "js";
			break;

		case 'lang':
			mode = "lang";
			break;

		case 'model':
			mode = "model";
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
			bkName: bkName
		 };

	ctrl.embed('#editBody', '/workArea/block/config', params);
}


ctrl.preview = function(link)  {
    ctrl.sel('.nav li').removeClass('active');
	$(link).parent().addClass('active');
    
    var  menuCtrl = __.getCtrl('pgMainMenu'),
		 params = {
			caCode: menuCtrl.getCurrentSite(),
			url: bkName
		 };
    
    ctrl.embed('#editBody', '/workArea/block/preview', params);
}


function  embedEditor(bkType) {
	var  params = {
		bkName: bkName,
		bkType: bkType
	};

	ctrl.embed('#editBody', '/workArea/block/edit', params);
}