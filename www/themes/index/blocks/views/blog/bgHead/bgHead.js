ctrl.selLocale = function(locID)  {
	var  pathname = location.pathname;
	var  locID = ctrl.sel('select[name="locID"]').val();

	
	if( locID == 1)
		window.location = "/blog/<%=uri%>"+pathname;
	else if( locID == 2)
		window.location = "/blog2/<%=uri%>"+pathname;
		
};
