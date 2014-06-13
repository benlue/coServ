var progCount = 0;

ctrl.startup = function() {
    
    ctrl.sel('#greeting').modal({keyboard: false, show: true});

    if (!<%=bi.isGuest%>)  {
        var  bodyCtrl = getBodyCtrl();
        bodyCtrl.reload('/myPage/list');
    }

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

ctrl.doRegister = function()  {
    var  pdata = formData(true),
         reqData = {url: 'wcoim/admin/user/register', post: pdata, hasCA: true};
    pdata.all = 1;

    __.api(reqData, function(data) {
        if (data.errCode === 0)
            sendMail( data.value );
        else  {
            // TODO: make it user friendly, ask user to try again
            alert( data.message );
        }
    });
};

ctrl.doLogin = function()  {
    var  org = ctrl.sel('input[name="teamCode"]').val(),
         caCode = ctrl.sel('input[name="caCode"]').val();

    if (org.length > 0 && org.length < 6)  {
        alert('Team code should be at least 6 characters long.');
        return;
    }
    if (caCode.length > 0 && caCode.length < 6)  {
        alert('The code name for a client-app should be at least 6 characters long.');
        return;
    }

    ctrl.sel('#loginModal').modal({keyboard: false, show: true});
    var  pdata = {accName: ctrl.sel('input[name="accName"]').val()},
         reqData = {url: 'wcoim/admin/user/pwType', post: pdata, hasCA: true};

    __.api(reqData, function(data) {
        if (data.errCode === 0)  {
            pdata.passwd = ctrl.sel('input[name="passwd"]').val();
            if (data.value.pwType != 1)
                pdata.passwd = SHA1(SHA1(pdata.accName)+pdata.passwd);

            reqData.url = 'wcoim/core/user/login';
            __.api(reqData, function(data) {
                if (data.errCode === 0)  {
                    pdata = {};

                    if (org.length >= 6)
                        pdata.org = org;
                    if (caCode.length >= 6)
                        pdata.caode = caCode;

                    reqData.url = 'wcoim/admin/user/fastTrack';
                    __.api(reqData, function(ftData) {
                        if (ftData.errCode === 0)  {
                            $.post('/sites/refresh.wsj', ftData.value, function(result) {
                                if (result.errCode === 0)  {
                                    ctrl.sel('#loginModal').modal('hide').on('hidden.bs.modal', function (e) {
                                      var  bodyCtrl = getBodyCtrl();
                                      bodyCtrl.reload('/myPage/list');
                                    });
                                }
                                else
                                    loginFail( result.message );
                            });
                        }
                        else
                            loginFail( data.message );
                    });
                }
                else
                    loginFail('<%=ph.jsLoginFail%>');
            });
        }
        else
            loginFail('<%=ph.jsNoAccount%>');
    });
};

ctrl.closeMsg = function() {
    ctrl.sel('#greeting').modal('hide');
};

function  wrongInfo() {
  ctrl.switch('reg');
};

function  formData(all)  {
    var  pdata;
    if (all)  {
        pdata = {isNature: true, roleID: 5};
        ctrl.sel('form input').each( function(idx, e) {
            pdata[$(this).attr('name')] = $(this).val();
        });

        if (pdata.teamCode)  {
            pdata.org = pdata.teamCode;
            delete  pdata.teamCode;
        }

        if (pdata.caCode)  {
            pdata.ca = pdata.caCode;
            delete  pdata.caCode;
        }
    }
    else
        pdata = {accName: ctrl.sel('input[name="accName"]').val(),
                 passwd: ctrl.sel('input[name="passwd"]').val()};

    pdata.passwd = SHA1(SHA1(pdata.accName)+pdata.passwd);
    if (pdata.passwd2)
	   pdata.passwd2 = SHA1(SHA1(pdata.accName)+pdata.passwd2);

	return  pdata;
};

function sendMail(regData)  {
    var  pdata = formData(true);
	pdata.from = "webmaster@gocharm.com.tw";
	pdata.to = pdata.accName;
	pdata.title = "COIMOTION: Account Activation Letter";    /*email title*/
	pdata.actID = regData.actID;
	pdata.email = pdata.accName;
    delete  pdata.passwd;
    delete  pdata.passwd2;

    $.post( "/user/mailActivate.wsj", pdata, function(data) {
        if (data.errCode === 0)  {
            alert("You've successfully registered.\r\nPlease check your mail box for the activation letter,\r\nand activate your account immediately.");

            // now let's update sites.json
            $.post('/sites/refresh.wsj', regData, function(result) {
                if (result.errCode === 0) {
                    // we'll keep pulling the API engine until the user has activated his/her account.
                    // then something magical will happen
                    setTimeout( waitActivated, 25000 );
                    showProgress();
                } else
                    alert( result.message );
            });
        }
		else
            alert("Oops! Can't send out the account activation mail.\r\nYou'll need to contact us to manually fix this problem.");
	});
};

function showProgress() {
    ctrl.sel('#loadingModal').modal({backdrop: 'static', keyboard: false, show: true});
};

function runProgress() {
    progCount = Math.min(98, progCount+10);
    ctrl.sel('.progress-bar').css('width', progCount+'%');
};

function  waitActivated()  {
    var  pdata = formData(),
         reqData = {url: 'wcoim/admin/user/login', post: pdata, hasCA: true};
    runProgress();

    __.api(reqData, function(data) {
        if (data.errCode === 0)  {
            // bingo! we've logged in.
            ctrl.sel('#loadingModal').modal('hide').on('hidden.bs.modal', function (e) {
                var  bodyCtrl = getBodyCtrl();
                bodyCtrl.reload('/myPage/list');
            });
        }
        else
            // wait for 10 seconds and try again
            setTimeout( waitActivated, 10000 );
    });
};

function  getBodyCtrl()  {
    var  bodyBkID = $('#_mainC').children('div').first().attr('id'),
         bodyCtrl = __.getCtrl(bodyBkID);

    return  bodyCtrl;
};

function  loginFail(msg)  {
    ctrl.sel('#loginModal').modal('hide');
    alert(msg);
}
