ctrl.updateConfig = function(isUpdate)  {
    event.preventDefault();

    var  bkURL = ctrl.sel('#blockURL').val();
    if (!isUpdate && !bkURL)
            return  alert('You should at least specify the block URL.');
    if (bkURL.charAt(0) != '/')
        bkURL = '/' + bkURL;
    
    var  menuCtrl = __.getCtrl('pgMainMenu'),
         bkData = {
            url: bkURL,
            caCode: menuCtrl.getCurrentSite(),
            title: ctrl.sel('#blockTitle').val(),
            desc: ctrl.sel('#blockDesc').val(),
            service: ctrl.sel('#blockAPI').val(),
            id: ctrl.sel('#hasID option:selected').val()
        };

    $.post('/workArea/block/update.wsj', bkData, function(result) {
        if (result.errCode)
            alert( result.message );
        else  {
            if (isUpdate)
                alert( result.message );
            else
                blkCtrl.refresh(bkURL);
        }
    }, 'json');
}


ctrl.deleteBlock = function(bkName)  {
    event.preventDefault();

    if (confirm('<%=ph.js_confirm%>'))  {
        var  menuCtrl = __.getCtrl('pgMainMenu'),
             bkData = {
                url: ctrl.sel('#blockURL').val(),
                caCode: menuCtrl.getCurrentSite(),
                doDelete: true
            };

        $.post('/workArea/block/update.wsj', bkData, function(result) {
            if (result.errCode)
                alert( result.message );
            else  {
                var  idxCtrl = __.getCtrl('workArea'),
                     blkCtrl = __.getCtrl('mainMenuBlockList');

                idxCtrl.dispatch('home');
                blkCtrl.refresh();
            }
        }, 'json');
    }
}