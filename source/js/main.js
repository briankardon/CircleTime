
// ***************** STARTUP ********************
var drawCanvas;
var drawCtx;
var canvasID = 'drawCanvas';
var updateCanvasJobID;

$(function () {
	drawCanvas = document.getElementById(canvasID);
	drawCtx = drawCanvas.getContext('2d');

  // Set splash page to fade
	setTimeout(function() {
		$("#splash").fadeOut(1000, function() {
			$("#content").show();
		});
	}, 300);

	document.body.addEventListener("touchstart", function (e) {
		if (e.target == drawCanvas) {
			e.preventDefault();
		}
	},  { passive: false });
	document.body.addEventListener("touchend", function (e) {
		if (e.target == drawCanvas) {
			e.preventDefault();
		}
	}, { passive: false });
	document.body.addEventListener("touchmove", function (e) {
		if (e.target == drawCanvas) {
			e.preventDefault();
		}
	}, { passive: false });

	// Set up modal
	setUpModal();

	$("#"+canvasID).on(
		'mousedown touchstart',
		function (evt) {
      // Handle mouse down on canvas event
		}
	);

	$("#"+canvasID).on('click', clickHandler);
	$("#"+canvasID).on('touchstart', touchstartHandler);
	$("#"+canvasID).on('mouseout', mouseoutHandler);
	$("#"+canvasID).on('touchend', touchendHandler);
	$("#"+canvasID).on('mousemove', mousemoveHandler);
	$("#"+canvasID).on('touchmove', touchmoveHandler);
	$("#symmetryTransparency").on('change', updateCanvas);
	$("#drawTransparency").on('change', updateCanvas);

	// Set version number
	var version = '1.23';
	$("#footer").html($('#footer').html()+version);

  // Start update:
  updateCanvasJobID = window.setInterval(updateCanvas, 1000);

});


//Keyboard shortcuts:
$(document).keydown(function(e) {
	switch(e.key) {
		case 'x':
      console.log('x down')
    }
});
$(document).keyup(function(e) {
	switch(e.key) {
		case 'x':
      console.log('x up')
    }
});

// Initialize modal FAQ page
function setUpModal() {
	// Modal javascript, css, and html are based on http://www.w3schools.com/howto/howto_css_modals.asp
	// I know, I know, w3schools is supposed to be a bad resource. But it's awfully convenient, ok?!
	// Get the modal:
	var modal = document.getElementById('modal');
	// Modal starts out hidden:
	modal.style.display = "none";
	// Get the button that opens the modal
	var FAQlink = document.getElementById("FAQLink");
	// Get the <span> element that closes the modal:
	var closeButton = document.getElementById("closeButton");
	// When the user clicks on the button, open the modal:
	FAQlink.onclick = function() {
		modal.style.display = "block";
	}
	$("#hotkeyLink").on('click', openShortcutKeyDialog);
	// When the user clicks on <span> (x), close the modal
	closeButton.onclick = function() {
		modal.style.display = "none";
	}
	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
		if (event.target == modal) {
			modal.style.display = "none";
		}
	}
}

function openShortcutKeyDialog() {
	$("#shortcutKeyDialog").dialog("open");
}


// ***************** MOUSE/TOUCH HANDLERS *********************

function mouseUpHandler(evt) {
  // Handle mouse up on canvas event

}

function mouseoutHandler(evt) {
  // Handle mouse leaving canvas event
	if (evt.buttons == 1) {
    // Mouse out with button down
	}
}

function touchendHandler(evt) {
	clickHandler(evt, 'end');
}

function touchstartHandler(evt) {
	clickHandler(evt, 'start');
}

function clickHandler(evt, touchType) {
  // Handle click on canvas
}

function touchmoveHandler(e) {
	e.preventDefault();
	mousemoveHandler(e, true);
}

function mousemoveHandler(evt, isTouch) {
  // Handle mouse move on canvas event
}

// *************** TIME FUNCTIONS ********************

function getSecondsSinceMidnight() {
	let time = new Date();
	return time.getSeconds() + time.getMinutes() * 60 + time.getHours() * 3600;
}

function getDayFraction() {
	return getSecondsSinceMidnight() / 86400;
}

function fractionToAngle(f) {
	return getMidnightAngle() + f * 2 * Math.PI;
}

function getDayAngle() {
	return fractionToAngle(getDayFraction());
}

function getMidnightAngle() {
	// return Math.PI;
	return - 2 * Math.PI * getDayFraction() - Math.PI/2;
}

// *************** CANVAS FUNCTIONS ******************

var cx = 600;
var cy = 400;
var r1 = 275;
var r2 = 300;
var dx = 0;
var dy = 0;
var sx = 1;
var sy = 1;
var zoom = 1;

function updateTransform() {
	// Use zoom to update dx, dy, sx, and sy based on zoom
	sx = zoom;
	sy = zoom;
	dx = cx - cx * zoom;
	dy = cy + zoom * (- cy + ((r1 + r2) / 2) * (1 - 2**(1-zoom)));
}

function clearCanvas() {
	drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}

function drawAnnulus(r1, r2) {
  drawCtx.beginPath()
  drawCtx.arc(cx, cy, r2, 0, 2*Math.PI, false);
  drawCtx.stroke()

  drawCtx.beginPath()
  drawCtx.arc(cx, cy, r1, 0, 2*Math.PI, false);
  drawCtx.stroke()
}

function drawSegment(r1, r2, a1, a2) {
  drawCtx.beginPath();
  drawCtx.arc(cx, cy, r1, a2, a1, true);
  drawCtx.arc(cx, cy, r2, a1, a2, false);
  // drawCtx.lineTo(600+r1*Math.cos(a2), 400+r1*Math.sin(a2));
  drawCtx.closePath();
  drawCtx.fill();
}

function drawArrow(x, y, a, headSize, shaftSize) {
	// Draws an arrowhead at (x, y) with sides of the given length pointing in a direction defined by the angle a
	let dx = Math.cos(a);
	let dy = Math.sin(a);
	let dxS = shaftSize * dx;
	let dyS = shaftSize * dy;
	let dxH = headSize * dx;
	let dyH = headSize * dy;
	// Rotate
	let angle = 55; // in degrees
	let c = Math.cos((180 - angle/2) * Math.PI/180);
	let s = Math.sin((180 - angle/2) * Math.PI/180);
	let dxL = dxH * c - dyH * s;
	let dyL = dxH * s + dyH * c;
	let dxR = dxH * c + dyH * s;
	let dyR = -dxH * s + dyH * c;

	let dash = '';
	let color = 'rgb(0, 0, 0)';
	let lineWidth = 1;
	let originalLineCap = drawCtx.lineCap;
	let originalLineJoin = drawCtx.lineJoin;
	// drawCtx.setLineDash(dash);
	// drawCtx.strokeStyle = color;
	// drawCtx.linewidth = lineWidth;

	drawCtx.beginPath();
	drawCtx.lineCap = "round";
	drawCtx.lineJoin = "round";
	drawCtx.moveTo(x-dxS, y-dyS);
	drawCtx.lineTo(x, y);
	drawCtx.lineTo(x + dxL, y + dyL);
	drawCtx.moveTo(x, y);
	drawCtx.lineTo(x + dxR, y + dyR);
	drawCtx.stroke();

	drawCtx.lineCap = originalLineCap;
	drawCtx.lineJoin = originalLineJoin;
}

function drawCurrentTimeMarker(r1, r2, a) {
	drawArrow(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a), a + Math.PI, 15, 50)
	drawArrow(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), a, 15, 50)
}

function drawLabel(r, a, text) {
	let mt = drawCtx.measureText(text);
	let w = mt.width;
	let h = mt.height;
	drawCtx.save();
	// drawCtx.rotate(a);
	// drawCtx.translate(cx, cy);
	drawCtx.fillText(text, 20, 20);
	drawCtx.restore();
}

function updateCanvas() {
	clearCanvas();

	updateTransform();

	drawCtx.setTransform(sx, 0, 0, sy, dx, dy);

	let a = getDayAngle();

  // Draw stuff
	drawLabel(r2+10, 0.2, "hello world");
  drawAnnulus(r1, r2);
  drawSegment(r1, r2, 0.2, 0.6);
  drawSegment(r1, r2, 0.8, 1.7);
	drawCurrentTimeMarker(r1, r2, a);
}
