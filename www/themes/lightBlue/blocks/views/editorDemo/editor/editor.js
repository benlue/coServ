// ctrl.embedEditor = function(rs, ngID) {
//   var params = {"ca": getCA(), "appCode": getAppCode(), "rs": rs, "locale":getLocale(), "disable": true};
//   if (ngID !== 'undefined')
//     params.ngID = ngID;
//   ctrl.embed('.editor', '/custContents/editor', {params: params}, function(emCtrl) {
//     emCtrl.addHandler("reqCloseEditor", ctrl.closeEditor);
//   });
// };
// ctrl.closeEditor = function() {
//   ctrl.sel("#editorModal").modal('hide').on('hidden.bs.modal', function () {
//     ctrl.callHandler("reqReloadRsTab");
//   });
// };
ctrl.startup = function() {
  
};