ctrl.startup = function() {
  ctrl.sel('#reg').hide();
  ctrl.sel('.regField').hide();
};

ctrl.reg = function() {
  ctrl.sel('.form-signin').toggleClass('form-signin form-signup');
  ctrl.sel('.form-signin-heading').toggleClass('form-signin-heading form-signup-heading');
  ctrl.sel('#reg').show();
  ctrl.sel('.regField').show();
  ctrl.sel('.btn-group').hide();
};

function wrongInfo() {
  ctrl.reg();
}