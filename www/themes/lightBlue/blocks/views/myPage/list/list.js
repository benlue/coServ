ctrl.startup = function()  {

};


ctrl.editPage = function(ngID, srv)  {
  var arr = srv.split('/'),
      path = '';
  for( var i = 1; i<arr.length-1; i++)
    path+=arr[i]+'/';
  var params = {srvPath: path, locale: getLocale(), allowGeo: true};
  if (ngID !== 'undefined')
    params.ngID = ngID;

  ctrl.embed('.editor', '/editorDemo/editor', {params: params}, function(emCtrl) {
    emCtrl.addHandler("reqCloseEditor", ctrl.closeEditor);
  });
};


ctrl.viewPage = function(ngID)  {
    var  bodyCtrl = getBodyCtrl();
    bodyCtrl.reload('/myPage/view', {id: ngID});
};

ctrl.closeEditor = function() {
  ctrl.sel("#editorModal").modal('hide').on('hidden.bs.modal', function () {
    var  bodyCtrl = getBodyCtrl();
    bodyCtrl.reload('/myPage/list');
  });
};

function  getBodyCtrl()  {
    var  bodyBkID = $('#_mainC').children('div').first().attr('id'),
         bodyCtrl = __.getCtrl(bodyBkID);

    return  bodyCtrl;
};

function getLocale() {
  var loc = ctrl.sel('.editor').attr('locale');
  switch (loc) {
    case 'en':
      return 1;
      break;
    case 'zh':
      return 2;
      break;
  }
  // return ctrl.sel('.editor').attr('locale');
}
