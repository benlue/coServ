/*
 * Export the whole website
 */
ctrl.exportWebsite = function()  {
    event.preventDefault();

    var  expPath = ctrl.sel('#wsExpDir').val();
    if (expPath)  {
    }
    else  {
        alert('<%=ph.jsNoExpPathError%>');
        issueWarning('#wsExpDir');
    }
}


ctrl.create = function()  {
    var  domain = ctrl.sel('#wsDomain').val(),
         caCode = ctrl.sel('#wsApp').val();
         
    if (!domain)  {
        alert('<%=ph.jsNoDomain%>');
        return  issueWarning('#wsDomain');
    }
        
    if (!caCode)  {
        alert('<%=ph.jsNoAppCode%>');
        return  issueWarning('#wsApp');
    }

    var  pdata = {
            domain: domain,
            caCode: caCode,
            sitePath: ctrl.sel('#wsPath').val(),
            title: ctrl.sel('#wsTitle').val(),
            locale: ctrl.sel('#wsLocale').val(),
            homePage: ctrl.sel('#wsHome').val(),
            doCreate: true
         };

    $.post('/website/update.wsj', pdata, function(result) {
        alert( result.message );
        
        if (result.errCode === 0)
            document.location.reload();
    }, 'json');
}


ctrl.delWebsite = function()  {
    if (confirm('<%=ph.jsDelConfirm%>'))  {
        var  pdata = {
                domain: ctrl.sel('#wsDomain').val(),
                doDelete: true
             };

        $.post('/website/update.wsj', pdata, function(result) {
            alert( result.message );
            
            //$('#createWSDialog').modal('hide');
            if (result.errCode === 0)
                document.location.reload();
        }, 'json');
    }
}


ctrl.save = function()  {
    var  pdata = {
            domain: ctrl.sel('#wsDomain').val(),
            caCode: ctrl.sel('#wsApp').val(),
            title: ctrl.sel('#wsTitle').val(),
            locale: ctrl.sel('#wsLocale').val(),
            homePage: ctrl.sel('#wsHome').val()
         };

    $.post('/website/update.wsj', pdata, function(result) {
        alert( result.message );
    }, 'json');
}


function  issueWarning(cssID)  {
    ctrl.sel('.form-group').removeClass('has-error');
    ctrl.sel(cssID).focus().parent().addClass('has-error');
}