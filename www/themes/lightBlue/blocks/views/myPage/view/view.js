ctrl.back = function() {
  var  bodyCtrl = getBodyCtrl();
  bodyCtrl.reload('/myPage/list');
};

function  getBodyCtrl()  {
    var  bodyBkID = $('#_mainC').children('div').first().attr('id'),
         bodyCtrl = __.getCtrl(bodyBkID);

    return  bodyCtrl;
};