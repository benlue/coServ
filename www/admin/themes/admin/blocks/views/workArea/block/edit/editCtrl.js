$(window).resize( function() {
	window.setTimeout(adjustHeight, 500);
});

var  editor;

ctrl.startup = function()  { 
	editor = CodeMirror.fromTextArea( ctrl.sel('#codeEditor')[0], {
		ineNumbers: true,
		  indentUnit: 4,
		scrollbarStyle: "simple",
		matchBrackets: true,
		mode: toEditMode('<%=bi.query.bkType%>')
	});
	editor.setOption("theme", "vibrant-ink");
	editor.on('change', handleDocChange);

	var  menuCtrl = __.getCtrl('pgMainMenu'),
		 pdata = {
		 	caCode: menuCtrl.getCurrentSite(),
		 	bkName: '<%= bi.query.bkName %>',
		 	bkType: '<%= bi.query.bkType %>'
		 };

	$.post('/workArea/block/source.txt', pdata, function(data) {
		/*
		editor = CodeMirror.fromTextArea( ctrl.sel('#codeEditor')[0], {
			ineNumbers: true,
	      	indentUnit: 4,
	        scrollbarStyle: "simple",
	        matchBrackets: true,
			mode: toEditMode('<%=bi.query.bkType%>')
		});

		editor.setOption("theme", "vibrant-ink");
		*/
	    if (data)
			editor.setValue( data );
		//editor.on('change', handleDocChange);

		adjustHeight();
	});
}


ctrl.saveDoc = function()  {
	//console.log( editor.getValue() );
	var  menuCtrl = __.getCtrl('pgMainMenu'),
		 pdata = {
			caCode: menuCtrl.getCurrentSite(),
			bkName: '<%= bi.query.bkName %>',
			bkType: '<%= bi.query.bkType %>',
			data: editor.getValue()
		 };

	$.post('/workArea/block/updateSource.wsj', pdata, function(result) {
		if (result.errCode === 0)
			ctrl.sel('#saveBtn').attr('disabled', 'disabled');
		showOnStatus( result.message );
	}, 'json');
}


function  adjustHeight()  {
	if (editor)  {
		var  h = $('#bodyArea').height() - $('.nav-tabs').outerHeight(true) - ctrl.sel('.flexContainer').outerHeight(true);
		editor.setSize(null, h - 10);
	}
}


function  handleDocChange()  {
	ctrl.sel('#saveBtn').removeAttr('disabled');
}


function  showOnStatus(s)  {
	ctrl.sel('#editStatusBar').html( s );
}


function  toEditMode(bkType)  {
	var  mode = 'javascript';

	switch (bkType)  {
		case 'html':
			mode = "htmlmixed";
			break;

		case 'cs':
			mode = "text/css";
			break;

		case 'xs':
		case 'phs':
		case 'js':
		case 'model':
			mode = "javascript";
			break;

		case 'lang':
			mode = "text/xml";
			break;
	}
	return  mode;
}