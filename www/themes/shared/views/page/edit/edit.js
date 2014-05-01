<%
	var  locID = value.locID || ctx.locID;
%>

ctrl.setLocale = function()  {
	<% if (value && value.ngID) { %>
	var  locID = ctrl.sel('select[name="locID"]').val();
	window.location = '/<%=value.rs%>/edit/<%=value.ngID%>?_loc=' + locID;
	<% } %>
};

ctrl.create = function() {
	var  pdata = collectData(),
		 req = {url: '/coim/<%=value.rs%>/create',
				post: pdata};

	__.api( req, function(data) {
		if (data.errCode === 0)
			window.location = '/<%=value.rs%>/edit/' + data.value + '?_loc=' + <%=locID%>;
		else
			alert( data.message );
	});
};

ctrl.save = function(ngID)  {
	var  pdata = collectData(),
		 req = {url: '/coim/<%=value.rs%>/update',
				id: ngID,
				post: pdata};
	
	__.api( req, function(data) {
		alert( data.message );
	});
};

function  collectData()  {
	var  pdata = {title: ctrl.sel('input[name="title"]').val(),
				  body: ctrl.sel('textarea[name="body"]').val(),
				  summary: ctrl.sel('textarea[name="summary"]').val(),
				  isPublic: ctrl.sel('input:checked[name="isPublic"]').val(),
				  _loc: ctrl.sel('select[name="locID"]').val()};
	
	if (!pdata.isPublic)
		pdata.isPublic = 0;
	return  pdata;
};