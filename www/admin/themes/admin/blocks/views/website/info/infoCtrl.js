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


ctrl.nextStep = function()  {
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
        	loginPage: ctrl.sel('#wsLogin').val(),
            doCreate: true
         };

    ctrl.reload('/website/showTemplates', {params: pdata});
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


ctrl.importSite = function(files)  {
    var  domain = ctrl.sel('#wsDomain').val(),
         sitePath = ctrl.sel('#wsPath').val();

    //var  fileObj = $(fin)[0].files[0];
    //console.log( JSON.stringify(fileObj, null, 4) );

    // let's prepare the form data
    var  formData = new FormData();
    formData.append('domain', domain);
    formData.append('sitePath', sitePath);
    formData.append('siteFile', files[0]);

    // send the request
    var  xhr = new XMLHttpRequest();
    xhr.onload = function()  {
        if (xhr.status === 200)  {
            alert('Ok');
            document.location.reload();
        }
        else
            alert('Failed to uplod the website.');
    };

    xhr.open('POST', '/website/import.wsj');
    xhr.send( formData );
}


ctrl.importCheck = function()  {
    var  domain = ctrl.sel('#wsDomain').val();

    if (!domain)  {
        event.preventDefault();

        alert('<%=ph.jsNoDomain%>');
        issueWarning('#wsDomain');
    }
}


ctrl.importToggle = function(ckbox)  {
    //console.log('is import checked: ' + $(ckbox).is(':checked'));
    if ($(ckbox).is(':checked'))  {
        ctrl.sel('.manualMode').hide();
        ctrl.sel('.importMode').show();
    }
    else  {
        ctrl.sel('.manualMode').show();
        ctrl.sel('.importMode').hide();
    }
}


ctrl.save = function()  {
    var  pdata = {
            domain: ctrl.sel('#wsDomain').val(),
            caCode: ctrl.sel('#wsApp').val(),
            title: ctrl.sel('#wsTitle').val(),
            locale: ctrl.sel('#wsLocale').val(),
            homePage: ctrl.sel('#wsHome').val(),
        	loginPage: ctrl.sel('#wsLogin').val(),
            isProtected: ctrl.sel('#wsProtect').is(':checked')
         };

    $.ajax({
        url: '/website/update.wsj',
        contentType: 'application/json',
        data: JSON.stringify(pdata),
        processData: false,
        dataType: 'json',
        type: 'POST'
    })
    .done(function(result)  {
        alert( result.message );
    });
}


function  issueWarning(cssID)  {
    ctrl.sel('.form-group').removeClass('has-error');
    ctrl.sel(cssID).focus().parent().addClass('has-error');
}