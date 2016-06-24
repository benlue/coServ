ctrl.updateConfig = function(isUpdate)  {
    event.preventDefault();

    var  bkURL = ctrl.sel('#blockURL').val();
    if (!isUpdate && !bkURL)  {
        issueWarning('#blockURL');
        return  alert('You should at least specify the block URL.');
    }
    
    if (bkURL.charAt(0) != '/')
        bkURL = '/' + bkURL;
    
    var  bkData = {
            url: bkURL,
            id: ctrl.sel('#hasID option:selected').val(),
            caCode: '<%= bi.query.caCode %>',
            title: ctrl.sel('#blockTitle').val(),
            desc: ctrl.sel('#blockDesc').val(),
            service: ctrl.sel('#blockAPI').val(),
            isProtected: ctrl.sel('#bkProtect').is(':checked')
        };

    var  paraCtrl = __.getCtrl('configParam'),
         blkParms = paraCtrl.getParameters();

    //console.log('blkParms length: %d\n%s', blkParms.length, JSON.stringify(blkParms, null, 4));
    if (Object.getOwnPropertyNames(blkParms).length)
        bkData.query = blkParms;

    $.ajax({
        url: '/workArea/block/update.wsj',
        contentType: 'application/json',
        data: JSON.stringify(bkData),
        processData: false,
        dataType: 'json',
        type: 'POST'
    })
    .done(function(result)  {
        if (result.errCode)
            alert( result.message );
        else  {
            if (isUpdate)
                alert( result.message );
            else  {
                var  blkCtrl = __.getCtrl('mainMenuBlockList');
                blkCtrl.refresh(bkURL);
            }
        }
    });
}


ctrl.deleteBlock = function(bkName)  {
    event.preventDefault();

    if (confirm('<%=ph.js_confirm%>'))  {
        var  bkData = {
                url: ctrl.sel('#blockURL').val(),
                caCode: '<%= bi.query.caCode %>',
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

function  issueWarning(cssID)  {
    ctrl.sel('.form-group').removeClass('has-error');
    ctrl.sel(cssID).focus().parent().addClass('has-error');
}