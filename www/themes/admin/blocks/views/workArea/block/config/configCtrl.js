ctrl.updateConfig = function(isUpdate)  {
    event.preventDefault();

    var  bkURL = ctrl.sel('#blockURL').val();
    if (!isUpdate && !bkURL)
            return  alert('You should at least specify the block URL.');
    if (bkURL.charAt(0) != '/')
        bkURL = '/' + bkURL;
    
    var  blkCtrl = __.getCtrl('mainMenuBlockList'),
         bkData = {
            url: bkURL,
            theme: blkCtrl.getTheme(),
            title: ctrl.sel('#blockTitle').val(),
            desc: ctrl.sel('#blockDesc').val(),
            service: ctrl.sel('#blockAPI').val(),
            id: ctrl.sel('#hasID option:selected').val()
        };

    $.post('/workArea/block/update.wsj', bkData, function(result) {
        if (result.errCode)
            alert( result.message );
        else  if (!isUpdate)
            blkCtrl.refresh(bkURL);
    }, 'json');
}


ctrl.deleteBlock = function(bkName)  {
    event.preventDefault();

    if (confirm('<%=ph.js_confirm%>'))  {
        var  blkCtrl = __.getCtrl('mainMenuBlockList'),
             bkData = {
                url: ctrl.sel('#blockURL').val(),
                theme: blkCtrl.getTheme(),
                doDelete: true
            };

        $.post('/workArea/block/update.wsj', bkData, function(result) {
            if (result.errCode)
                alert( result.message );
            else  {
                var  idxCtrl = __.getCtrl('workArea');
                idxCtrl.dispatch('home');

                blkCtrl.refresh();
            }
        }, 'json');
    }
}