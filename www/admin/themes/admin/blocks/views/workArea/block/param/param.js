ctrl.runBlock = function()  {
    var  params = collectParams();

    //console.log( JSON.stringify(params, null, 4));
    ctrl.callHandler('reqIssued', params);
}


ctrl.getParameters = function()  {
	return  collectParams();
}


<% if (bi.query.mode === 'edit') { %>
ctrl.showParamModel = function()  {
    ctrl.sel('#newVarName').val('');
	ctrl.sel('#paramModal').modal('show');
}


ctrl.addParameter = function()  {
	var  varName = ctrl.sel('#newVarName').val();
    console.log('var name is: ' + varName);

	if (varName)  {
		var  table = ctrl.sel('#varTable'),
			 blkID = ctrl.getBlockID();

		table.append('<tr><td><label>' + varName + '</label></td><td><input type="checkbox"></td>' + 
					 '<td><select id="sel' + varName + '" class="form-control" onchange="__.getCtrl(\'' + blkID + '\').chooseType(this);">' +
                	 '<option value="num">Number</option>' +
                	 '<option value="string">String</option>' +
                	 '<option value="bool">Boolean</option>' +
                	 '<option value="object">Object</option>' +
            		 '</select></td>' +
					 '<td><input id="dft' + varName + '" type="text" class="form-control" placeholder="<%=ph.defaultValue%>"></td>' + 
					 '<td><button type="button" class="btn btn-default" onclick="__.getCtrl(\'' + blkID + '\').delParam(this);">' +
                	 '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>' + 
        			 '</td></tr>');
	}
	ctrl.sel('#paramModal').modal('hide');
}


ctrl.delParam = function(btn)  {
	if (confirm('<%=ph.js_remove%>'))
		$(btn).parent().parent().remove();
}


ctrl.chooseType = function(select)  {
	var  dataType = $(select).val(),
		 parName = $(select).attr('id').substring(3);

	// object data type can't have default value
	ctrl.sel('#dft' + parName).prop('disabled', dataType === 'object'); 
}
<% } %>

function  collectParams() {
	var  params = {};
	<% if (bi.query.mode === 'edit') { %>
	ctrl.sel('#varTable tbody tr').each(function(idx) {
		var  vname = $(this).find('label').text();

		if (vname)  {
			var	 dftValue = $(this).find('#dft' + vname).val(),
				 q = {
				 	required: $(this).find(':checkbox').prop('checked'),
				 	type: $(this).find('select').val()
				 };

			if (dftValue)
				q.default = dftValue;

			params[vname] = q;
		}
	});

	// check again for default value
	for (var k in params)  {
		var  pi = params[k];
		if (pi.default)  {
			switch (pi.type)  {
				case 'num':
					pi.default = parseFloat( pi.default );
					if (isNaN(pi.default))
						delete  pi.default;
					else  if (pi.default == Math.round(pi.default))
						pi.default = Math.round(pi.default);
					break;

				case 'bool':
					var  n = parseInt( pi.default );
					if (isNaN(n))
						pi.default = pi.default == 'false'  ?  false : true;
					else
						pi.default = n  ?  true : false;
					break;

				case 'object':
					delete  pi.default;
					break;
			}
		}
	}
	<% } else  { %>
	ctrl.sel('input:text').each(function(i) {
		params[$(this).attr('name')] = $(this).val();
	});
	<% } %>

	return  params;
}