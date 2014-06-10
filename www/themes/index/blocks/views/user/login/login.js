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

ctrl.doRegister = function()  {
    var  pdata = ctrl.sel('form').serialize(),
         reqData = {url: 'admin/user/register', post: pdata};
    __.api(reqData, function(data) {
        if (data.errCode === 0)
            sendMail( data.value.actID );
        else  {
            // TODO: make it user friendly, ask user to try again
            alert( data.message );
        }
    });
};

function wrongInfo() {
  ctrl.reg();
};

function sendMail(actID)  {
    var  pdata = collectData();
	pdata.from = "webmaster@gocharm.com.tw";
	pdata.to = pdata.accName;
	pdata.title = "COIMOTION: Account Activation Letter"; /*email title*/
	pdata.actID = actID;
	pdata.email = pdata.accName;

    $.post( "/mail/accActivate.wsj", pdata, function(data) {
		alert("You've successfully registered.\r\nPlease check your mail box for the activation letter,\r\nand activate your account immediately.");
		// we'll keep pulling the API engine until the user has activated his/her account.
        // then something magical will happen
	});
};
