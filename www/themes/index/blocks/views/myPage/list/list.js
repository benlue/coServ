ctrl.startup = function()  {

};


ctrl.editPage = function(ngID)  {

};


ctrl.viewPage = function(ngID)  {
    var  bodyCtrl = getBodyCtrl();
    bodyCtrl.reload('/myPage/view', {id: ngID});
};


function  getBodyCtrl()  {
    var  bodyBkID = $('#_mainC').children('div').first().attr('id'),
         bodyCtrl = __.getCtrl(bodyBkID);

    return  bodyCtrl;
};
