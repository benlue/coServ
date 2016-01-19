$(window).resize( function() {
	window.setTimeout(adjustHeight, 500);
});

var  editor;

ctrl.startup = function()  {
	var  txArea = ctrl.sel('#codeEditor'),
		 blkCtrl = __.getCtrl('mainMenuBlockList'),
		 pdata = {
		 	theme: blkCtrl.getTheme(),
		 	bkName: '<%= bi.query.bkName %>',
		 	bkType: '<%= bi.query.bkType %>'
		 };
		 
	editor = CodeMirror.fromTextArea( ctrl.sel('#codeEditor')[0], {
		lineNumbers: true,
      	indentUnit: 4,
		mode: toEditMode('<%=bi.query.bkType%>'),
		theme: 'elegant'
	});

	window.setTimeout(function() {
		$.post('/workArea/block/source.txt', pdata, function(data) {
			if (data)
				editor.setValue( data );
			editor.on('change', handleDocChange);
		});
	}, 250);

	adjustHeight();
}


ctrl.saveDoc = function()  {
	//console.log( editor.getValue() );
	var  blkCtrl = __.getCtrl('mainMenuBlockList'),
		 pdata = {
			theme: blkCtrl.getTheme(),
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
		// adjH is really a patch
		var  h = ctrl.sel('#editPane').height() - ctrl.sel('.flexContainer').outerHeight(true),
			 adjH = $('#bodyArea').height() - $('.WorkAreaBlockMain').height();

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