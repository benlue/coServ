$(window).resize( function() {
	window.setTimeout(adjustHeight, 500);
});

var  editor;

ctrl.startup = function()  {
	editor = CodeMirror.fromTextArea( ctrl.sel('#codeEditor')[0], {
		lineNumbers: true,
      	indentUnit: 4,
		mode: toEditMode('<%=bi.query.mode%>')
	});

	var  menuCtrl = __.getCtrl('pgMainMenu'),
		 pdata = {
		 	caCode: menuCtrl.getCurrentSite(),
		 	layout: '<%= bi.query.layout %>',
		 	mode: '<%= bi.query.mode %>'
		 };
	
	window.setTimeout(function() {
		$.post('/workArea/layout/source.txt', pdata, function(data) {
			if (data)
				editor.setValue( data );
			editor.on('change', handleDocChange);
		});
	}, 100);

	adjustHeight();
}


ctrl.saveDoc = function()  {
	//console.log( editor.getValue() );
	var  menuCtrl = __.getCtrl('pgMainMenu'),
		 pdata = {
			caCode: menuCtrl.getCurrentSite(),
			layout: '<%= bi.query.layout %>',
			bkType: '<%= bi.query.mode %>',
			data: editor.getValue()
		 };

	$.post('/workArea/layout/updateSource.wsj', pdata, function(result) {
		if (result.errCode === 0)
			ctrl.sel('#saveBtn').attr('disabled', 'disabled');
		showOnStatus( result.message );
	}, 'json');
}


function  adjustHeight()  {
	if (editor)  {
		// adjH is really a patch
		var  h = ctrl.sel('#editPane').height() - ctrl.sel('.flexContainer').outerHeight(true),
			 adjH = $('#bodyArea').height() - $('.WorkAreaLayoutMain').height();

		editor.setSize(null, h + adjH);
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

		case 'inc':
			mode = "javascript";
			break;
	}
	return  mode;
}