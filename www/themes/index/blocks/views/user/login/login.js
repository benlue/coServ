ctrl.startup = function() {
  ctrl.sel('.regField').hide();
};

ctrl.switch = function(type) {
  switch(type) {
  case 'login':
    ctrl.sel('.form-signup').toggleClass('form-signin form-signup');
    ctrl.sel('.form-signup-heading').toggleClass('form-signin-heading form-signup-heading');
    ctrl.sel('.regField').hide();
    ctrl.sel('.loginField').show();
    break;
  case 'reg':
    ctrl.sel('.form-signin').toggleClass('form-signin form-signup');
    ctrl.sel('.form-signin-heading').toggleClass('form-signin-heading form-signup-heading');
    ctrl.sel('.regField').show();
    ctrl.sel('.loginField').hide();
  }
};

function wrongInfo() {
  ctrl.switch('reg');
}