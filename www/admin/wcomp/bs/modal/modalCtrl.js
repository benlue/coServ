ctrl.startup = function() {
	var  args = <%= JSON.stringify(_params.args); %>;
	ctrl.embed('.modal-body', '<%= _params.bodyURL %>', args);
}