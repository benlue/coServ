ctrl.startup = function() {
  if (getNg() === 'undefined') {
    ctrl.sel('.leftMenu').css('display', 'none');
    ctrl.sel('.rightMenu').addClass('col-md-12');
    ctrl.sel('.rightMenu').removeClass('col-md-9 col-md-10');
    ctrl.sel('.rightLabel').addClass('col-md-2');
    ctrl.sel('.rightLabel').removeClass('col-md-1');

    return false;
  }

  var req = {url:getCA()+'/'+getAppCode()+'/'+getRs()+'/view/'+getNg(), post:{icon:1, geo:1, pic:1, att:1}, hasCA:true},
      pics = '', atts = '', geos='';
  __.api(req, function(data) {
    if (data.errCode === 0) {
      // TESTING
      console.log(JSON.stringify(data));
      ctrl.sel('input[name="title"]').val(data.value.title);
      ctrl.sel('input[name="summary"]').val(data.value.summary);
      ctrl.sel('.cleditor').val(data.value.body);
      ctrl.sel('div#mdTime').text('上次儲存時間：'+data.value.mdTime);
      ctrl.sel('select[name="locID"]').val(data.value.locID);

      if (data.value.isPublic === 1) {
        ctrl.sel('input[name="isPublic"]').prop('checked', true);
      }
      // 顯示地理位置
      data.value.geoList.forEach(function(item) {
        geos += '<a href="#" data-toggle="modal" data-target="#geoModal" onclick="'+getCtrl()+'.showAddCnt('+getNg()+','+item.geID+')">';
        geos += '<i class="icon-map-marker" style="font-size: 22px; margin-right: 2px"></i></a>';
        // ctrl.sel('#confirmed_addr').text(item.addr);
        // ctrl.sel('#confirmed_lat').text(item.latitude);
        // ctrl.sel('#confirmed_lng').text(item.longitude);
      });
      // 顯示圖片
      data.value.picList.forEach(function(item) {
        pics += '<img cn="'+item.cnID+'" src="./'+item.dataURI+'">';
      });
      // 顯示附加檔
      data.value.attList.forEach(function(item) {
        atts += '<i class="icon-file" cn="'+item.cnID+'" style="font-size: 20px; margin-right: 2px"></i>';
      });
      // 顯示文章頭像
      // ctrl.sel('#文章頭像').val((data.value.iconURI));

      ctrl.sel('#geoList').html(geos);
      ctrl.sel('#picList').html(pics);
      ctrl.sel('#attList').html(atts);
    } else {
      alert( data.message );
    }
  });
};
ctrl.showAddCnt = function(ngID, geID)  {
  var ca = getCA(),
      appCode = getAppCode(),
      rs = getRs();

  var params = {"ca": ca, "appCode": appCode, "rs": rs, "ngID": ngID, "geID": geID};
  ctrl.embed('.addGeoCnt', '/selfContents/addGeoCnt', {params: params}, function(emCtrl) {
    emCtrl.addHandler("regCloseAddGeoCnt", ctrl.closeAddCnt);
  });
};

ctrl.closeAddCnt = function() {
  ctrl.sel("#geoModal").modal('hide').on('hidden.bs.modal', function () {
    //reload editor
  });
};

// TESTING
// ctrl.testPic = function() {
//   var req = {url:getCA()+'/'+getAppCode()+'/attachment/node/17132', post:{path:'ng17132/cn793.png'}, hasCA:true}
//   __.api(req, function(data) {
//     if (data.errCode === 0) {
//       console.log(JSON.stringify(data));
//     } else {
//       alert(data.message);
//     }
//   });
// };
ctrl.delCnt = function(type) {
  var cnID = ctrl.sel(this).attr('cn');
  alert(cnID);
  // ,
  //     req = {url: getCA()+'/'+getAppCode()+'/'+getRs()+'/unattach/'+, post:{}, hasCA:true};
  // __.api(req, function(data) {
  //   if (data.errCode === 0) {
  //     ctrl.receiver(type);
  //     alert(data.message);
  //   } else {
  //     alert(data.message);
  //   }
  // });
}
ctrl.save = function() {
  // console.log(JSON.stringify(collectData()));
  var pdata = collectData(),
      ngID = getNg(),
      op = ( ngID !== 'undefined' ? 'update/'+ngID : 'create' ),
      req = {url:getCA()+'/'+getAppCode()+'/'+getRs()+'/'+op, post:pdata, hasCA:true};
  __.api(req, function(data) {
    if (data.errCode === 0) {
      // $.fancybox.close();
      ctrl.callHandler("reqCloseEditor");
    } else if (data.errCode === 2) {
      alert('建立文章的人才能編輯喔！');
    } else {
      alert( data.message );
    }
  });
};

ctrl.receiver = function(type) {
  var pdata = {"nType": type},
      req = {url:getCA()+'/'+getAppCode()+'/'+getRs()+'/listAux/'+getNg(), post:pdata, hasCA:true};
      // url = 192.168.1.190:4000/abcapp/bustime/attachment/node/17127

  __.api(req, function(data) {
    var items = '';
    if (data.errCode === 0) {
      console.log(JSON.stringify(data));
      switch (type) {
      case '2':
        data.value.list.forEach(function(item) {
          items += '<i class="icon-file" style="font-size: 20px; margin-right: 2px"></i>';
        });
        ctrl.sel('#attList').html(items);
        break;
      case '3':
        data.value.list.forEach(function(item) {
          items += '<img src="./'+item.dataURI+'">';
        });
        ctrl.sel('#picList').html(items);
        break;
      }
    } else {
      alert('upload fail\n'+data.mesage);
    }
  })
};



ctrl.searchLoc = function() {
  /* latlng */
  // var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=22.605077,120.301028&sensor=true'
  /* address */
  var address = ctrl.sel('input[name="address"]').val(),
      latlng = ctrl.sel('input[name="latlng"]').val(),
      url = 'http://maps.googleapis.com/maps/api/geocode/json?';

  if (address !== '') {
    url += 'address='+address+'&sensor=true';
  } else if (latlng !== '') {
    url += 'latlng='+latlng+'&sensor=true';
  } else {
    return false;
  }
  $.getJSON(url, function(data) {
    if ( data.status === "OK" ) {
      var addr = data.results[0].formatted_address,
          loc = data.results[0].geometry.location;
      ctrl.sel('#confirmed_addr').text(addr);
      ctrl.sel('#confirmed_lat').text(loc.lat);
      ctrl.sel('#confirmed_lng').text(loc.lng);
    } else {
      alert(data.message);
    }
  });
};
ctrl.resetLoc = function() {
  ctrl.sel('input[name="address"]').val('');
  ctrl.sel('input[name="latlng"]').val('');
  ctrl.sel('#confirmed_addr').text('');
  ctrl.sel('#confirmed_lat').text('');
  ctrl.sel('#confirmed_lng').text('');
};
ctrl.addGeoLoc = function() {
  var addr = ctrl.sel('#confirmed_addr').text(),
      lat = ctrl.sel('#confirmed_lat').text(),
      lng = ctrl.sel('#confirmed_lng').text(),
      /* 是否進一步處理geID */
      pdata = {addr: addr, lat: lat, lng: lng},
      req = {url:getCA()+'/'+getAppCode()+'/'+getRs()+'/addGeo/'+getNg(), post:pdata, hasCA:true};
  /*
  // 記得寫驗證
  */
  if (getNg === 'undefined') return false;
  if (addr === '' && lat === '' && lng === '') return false;
  __.api(req, function(data) {
    if (data.errCode === 0) {
      alert('地理位置新增成功');
    } else {
      alert( JSON.stringify(pdata));
      alert( data.message );
    }
  });
};

ctrl.setLocale = function() {
  var locID = ctrl.sel('select[name="locID"]').val();
};

function collectData()  {
  var  pdata = { title: ctrl.sel('input[name="title"]').val(),
                 summary: ctrl.sel('input[name="summary"]').val(),
                 body: ctrl.sel('iframe').contents().find('body').html(),
                 isPublic: ctrl.sel('input:checked[name="isPublic"]').val(),
                 _loc: ctrl.sel('select[name="locID"]').val() };
  /* isPiblic == 'on' */
  if (!pdata.isPublic)
    pdata.isPublic = 0;
  else
    pdata.isPublic = 1;
  return  pdata;
};
function getCA() {
  return ctrl.sel('#ng').attr('ca');
}
function getAppCode() {
  return ctrl.sel('#ng').attr('appCode');
}
function getRs() {
  return ctrl.sel('#ng').attr('rs');
}
function getNg() {
  return ctrl.sel('#ng').attr('ng');
}
function getCtrl() {
  return ctrl.sel('#geoMenu').attr('ctrl');
}
