var slide = {
      width : 0,
      height : 0,
      index : 0
    };

ctrl.startup = function() {
  slide.width = document.body.offsetWidth;
  slide.height = slide.width / 2;

  ctrl.sel('.slides')
    .width(slide.width)
    .height(slide.height);
};

ctrl.prev = function() {
  move(-1);
};

ctrl.next = function() {
  move(1);
};

function move(step) {
  var pos = $(document).scrollTop(),
      nextPos;

  slide.height = ctrl.sel('.slides').outerHeight();
  slide.index = Math.floor(pos / slide.height) + step;
  nextPos = slide.height * slide.index;

	$('html, body').animate({
		scrollTop: nextPos// adjust number of px to scroll down
	}, 1000);
};
