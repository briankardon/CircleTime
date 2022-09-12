

// *************** OTHER UTILITIES **************
Number.prototype.mod = function (n) {
  "use strict";
  return ((this % n) + n) % n;
};

// ***************** STARTUP ********************
var drawCanvas;
var drawCtx;
var canvasID = 'drawCanvas';
var updateCanvasJobID;
var zoom = 1.2;
var schedule;
var startNotifications = false;
var endNotifications = false;
var preEndNotifications = false;
var audio = new Audio('static/alert.mp3');

$(function () {
	drawCanvas = document.getElementById(canvasID);
	drawCtx = drawCanvas.getContext('2d');

  $('#save-preset').on('click', function () {
    let presetName = sanitizePresetName(prompt('Enter a name for this preset:'));
    saveSchedule(presetName);
  });

  repopulatePresetMenu();

  // Set splash page to fade
	setTimeout(function() {
		$("#splash").fadeOut(1000, function() {
			$("#content").show();
		});
	}, 300);

	retrieveSchedule();
	$('#schedule').on('keyup', function () {
		saveSchedule();
		schedule = parseSchedule();
		});

	$('#schedule').keyup();

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
	let interval;
	switch(e.key) {
		case 'x':
			break;
		case 'ArrowUp':
			if (e.shiftKey) {
				zoom += dzoom;
				updateCanvas();
				break;
			}
		case 'ArrowDown':
			if (e.shiftKey) {
				zoom -= dzoom;
				updateCanvas();
				break;
			}
		case 'ArrowLeft':
			if (!e.ctrlKey && e.shiftKey) {
				interval = getRelevantInterval();
				timeRotate = Math.round((timeRotate - interval)/interval)*interval;
				updateCanvas();
				break;
			}
			if (e.ctrlKey && e.shiftKey) {
				interval = getRelevantInterval();
				timeOffset = Math.round((timeOffset - interval)/interval)*interval;
				updateCanvas();
				break;
			}
		case 'ArrowRight':
			if (!e.ctrlKey && e.shiftKey) {
				interval = getRelevantInterval();
				timeRotate = Math.round((timeRotate + interval)/interval)*interval;
				updateCanvas();
				break;
			}
			if (e.ctrlKey && e.shiftKey) {
				interval = getRelevantInterval();
				timeOffset = Math.round((timeOffset + interval)/interval)*interval;
				updateCanvas();
				break;
			}
    }
});
$(document).keyup(function(e) {
	switch(e.key) {
		case 'x':
			break;
    }
});

function sanitizePresetName(displayName) {
  return displayName.replace(/[^a-zA-Z0-9]/g, '-');
}

function presetNameToId(presetName) {
  let id = 'schedule_' + presetName;
  return id;
}

function createPresetElement(presetName) {
  let id = presetNameToId(presetName);
  $('#preset-list').append(
    $(
    `<div id="${id}" class="dropdown-content">
      <h3 class="dropdown-action retrieve-preset buttonish">${presetName}</h3>
      <svg class="dropdown-action mini delete-preset buttonish" viewBox="0 0 10 10">
          <path stroke="black" stroke-width="1" fill="none" d="M2,2,8,8" />
          <path stroke="black" stroke-width="1" fill="none" d="M2,8,8,2" />
      </svg>
    </div>`
    )
  );
  $(`#${id}`).children('.retrieve-preset').on('click', function () {
    retrieveSchedule(presetName);
  });
  $(`#${id}`).children('.delete-preset').on('click', function () {
    deletePreset(presetName);
  });
  $
}

function deletePreset(presetName) {
  let id = presetNameToId(presetName);
  localStorage.removeItem(id);
  $(`#${id}`).remove();
}

function saveSchedule(presetName) {
  let id;
  if (presetName == undefined) {
    presetName = '|schedule|';
    id = presetName;
  } else {
    // createPresetElement(presetName);
    id = presetNameToId(presetName);
  }
	localStorage.setItem(id, $('#schedule').val());
  repopulatePresetMenu();
}

function repopulatePresetMenu() {
  $('#preset-list').children().remove();
  let presetNames = getAllPresetNames();
  for (let k = 0; k < presetNames.length; k++) {
    if (presetNames[k] != '|schedule|') {
      createPresetElement(presetNames[k], presetNames[k]);
    }
  }
}

function getAllPresetNames() {
  let presetNames = [];
  let keys = Object.keys(localStorage);
  for (let k = 0; k < keys.length; k++) {
    if (keys[k] == '|schedule|') {
      // This is the current schedule
      presetNames[presetNames.length] = '|schedule|';
    } else if (keys[k].match(/schedule_[a-zA-Z0-9]+/)) {
      presetNames[presetNames.length] = keys[k].replace(/schedule_/, '');
    }
  }
  return presetNames;
}

function retrieveSchedule(presetName) {
  let storedSchedule, id;
  if (presetName == undefined) {
    id = '|schedule|';
  } else {
    id = presetNameToId(presetName);
  }
  storedSchedule = localStorage.getItem(id);
  if (storedSchedule != undefined) {
		$('#schedule').val(storedSchedule);
	}
}

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
	return (time.getSeconds() + time.getMinutes() * 60 + time.getHours() * 3600 + timeOffset).mod(86400);
}

function getDayFraction(seconds) {
	if (seconds == undefined) {
		seconds = getSecondsSinceMidnight();
	}
	return seconds / 86400;
}

function fractionToAngle(f) {
	return getMidnightAngle() + f * 2 * Math.PI;
}

function getDayAngle(seconds) {
	return fractionToAngle(getDayFraction(seconds)).mod(2*Math.PI);
}

function getMidnightAngle() {
	// return Math.PI;
	return Math.PI-getDayFraction() * 2 * Math.PI + (2 * Math.PI * timeRotate / 86400);
}

function parseTimeStamp(timeStamp) {
	if (timeStamp == undefined) {
		return undefined;
	}
	// Check for am or AM or pm or PM or a or p
	let pm = false;
	let amRegex = /[aA][mM]?/;
	let pmRegex = /[pP][mM]?/;
	if (timeStamp.match(amRegex)) {
		timeStamp = timeStamp.replace(amRegex, '');
	}
	if (timeStamp.match(pmRegex)) {
		timeStamp = timeStamp.replace(pmRegex, '');
		pm = true;
	}

	let hour, minute;
	[hour, minute] = timeStamp.split(':');


	if (isNaN(hour)) {
		return undefined;
	}
	if (minute == undefined) {
		minute = '0';
	}

	hour = parseInt(hour);
	minute = parseInt(minute);

	if (pm) {
		hour = hour + 12;
	}

	return minute * 60 + hour * 3600;
}

function secondsToTimeString(seconds, twelveHour) {
	if (twelveHour == undefined) {
		twelveHour = true;
	}
	let now = new Date();
	now.setHours(0, 0, seconds);
	let hours = now.getHours();
	if (twelveHour) {
		hours = ((hours-1) % 12) + 1;
	}
	let minutes = now.getMinutes();
	if (minutes < 10) {
		minutes = '0' + minutes;
	}
	return hours + ':' + minutes;
}

function getRelevantInterval(zoomLevel) {
	if (zoomLevel == undefined) {
		zoomLevel = zoom;
	}
	if (zoomLevel < 4) {
		return 3600;
	} else if (zoomLevel < 7.5) {
		return 3600 / 2;
	} else if (zoomLevel < 20) {
		return 3600 / 4;
	} else if (zoomLevel < 30) {
		return 3600 / 6;
	} else if (zoomLevel < 80) {
		return 3600 / 12;
	} else {
		return 3600 / 60;
	}
}

// *************** SCHEDULE PARSING ******************

function parseSchedule() {
	let scheduleText = $("#schedule").val();
	let scheduleLines = scheduleText.split('\n');
	scheduleLines = scheduleLines.map(line => line.trim()).filter(line => line.length > 0);
	let schedule = [];
	let scheduleLine;
	let timing;
	let startTimeStamp, stopTimeStamp;
	let startTime, stopTime;
	let text;
	let j;
	for (let k = 0; k < scheduleLines.length; k++) {
		scheduleLine = scheduleLines[k];
		scheduleLine = scheduleLine.split(/ +/);
		timing = scheduleLine[0];
		text = scheduleLine.slice(1).join(' ');
		if (text.length == 0) {
			continue;
		}
		[startTimeStamp, stopTimeStamp] = timing.split('-');
		startTime = parseTimeStamp(startTimeStamp);
		stopTime = parseTimeStamp(stopTimeStamp);

		if (startTime == undefined) {
			continue;
		}

		j = schedule.length;
		schedule[j] = {};
		schedule[j].start = parseTimeStamp(startTimeStamp);
		schedule[j].stop = parseTimeStamp(stopTimeStamp);
		schedule[j].text = text;
	}
	return schedule;
}

function drawSchedule() {
	let currentTime = getSecondsSinceMidnight();
	let color;
	if (schedule == undefined) {
		return;
	}
	for (let k = 0; k < schedule.length; k++) {
		if (schedule[k].start >= currentTime) {
			// Event is entirely in the future
			color = brightColors[k % brightColors.length];
		} else if (schedule[k].stop <= currentTime || schedule[k].stop == undefined) {
			// Event is entirely in the past
			color = dimColors[k % dimColors.length];
		} else {
			// Event is ongoing
			color = {
				start: dimColors[k % dimColors.length],
				end: brightColors[k % brightColors.length],
				fraction: (currentTime - schedule[k].start) / (schedule[k].stop - schedule[k].start)
			}
		}
		if (schedule[k].stop != undefined) {
			drawLongEvent(r1, r2, schedule[k].start, schedule[k].stop, schedule[k].text, color);
		} else {
			drawShortEvent(r1, r2, schedule[k].start, schedule[k].text, color);
		}
	}
}

function notify() {
	if (schedule == undefined) {
		return;
	}
	let currentTime = getSecondsSinceMidnight();
	let timeUntilStart;
	let timeUntilEnd;
	let timeUntil5MinFromEnd;
	let utterance;

	for (let k = 0; k < schedule.length; k++) {
		timeUntilStart = schedule[k].start - currentTime;
		timeUntilEnd = schedule[k].stop - currentTime;
		timeUntil5MinFromEnd = timeUntilEnd - 60*5;
		let intro;
		let go = false;
		if ($('#startNotifications')[0].checked && timeUntilStart >= 0 && timeUntilStart < 1) {
			go = true;
			if (schedule[k].stop == undefined) {
				// Short-term event
				intro = "Now time for: ";
			} else {
				intro = "Now starting: ";
			}
		} else if ($('#endNotifications')[0].checked && timeUntilEnd >= 3 && timeUntilEnd < 4) {
			go = true;
			intro = "Now ending: ";
		} else if ($('#preEndNotifications')[0].checked && timeUntil5MinFromEnd >= 0 && timeUntil5MinFromEnd < 1 && timeUntilStart < 0) {
			go = true;
			intro = "Ending in 5 minutes: ";
		}
		if (go) {
			utterance = new SpeechSynthesisUtterance(intro + schedule[k].text);
			audio.onended = function (event) {
				speechSynthesis.speak(utterance);
			}
			audio.play();
		}
	}
}

// *************** CANVAS FUNCTIONS ******************

var cx = 500;
var cy = 400;
var r1 = 200;
var r2 = 300;
var dx = 0;
var dy = 0;
var sx = 1;
var sy = 1;
var lineWidth = 1;
var dzoom = 0.1;
var fontSize = 24;
var timeOffset = 0;  // Amount to artifically add to current time
var timeRotate = 0;  // Amount of time by which to rotate the "current time" marker
var brightColors = ['#cc0000', '#00aa00', '#0000cc'];
var dimColors = ['#221111', '#112211', '#111122'];

function updateTransform() {
	// Use zoom to update dx, dy, sx, and sy based on zoom
	sx = zoom;
	sy = zoom;
	dzoom = 0.1 * zoom;
	r2 = r1 + 50 / Math.sqrt(zoom);
	dx = cx
	dy = cy + zoom * (((r1 + r2) / 2) * (1 - 2**(1-zoom)));
	fontSize = 24 / zoom;
	drawCtx.font = fontSize + 'px Arial';
	lineWidth = 1 / zoom;
}

function clearCanvas() {
	drawCtx.save();
	drawCtx.setTransform(1, 0, 0, 1, 0, 0);
	drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
	drawCtx.restore();
}

function drawAnnulus(r1, r2) {
	drawCtx.save();
	drawCtx.lineWidth = lineWidth;

  drawCtx.beginPath();
  drawCtx.arc(0, 0, r2, 0, 2*Math.PI, false);
  drawCtx.stroke();

  drawCtx.beginPath();
  drawCtx.arc(0, 0, r1, 0, 2*Math.PI, false);
  drawCtx.stroke();

	drawCtx.restore();
}

function drawDaylight(r) {
	drawCtx.save();

	let a = getMidnightAngle()+Math.PI/2;

	// drawCtx.rotate(a);

	let gradient = drawCtx.createLinearGradient(r*Math.cos(a), r*Math.sin(a), -r*Math.cos(a), -r*Math.sin(a));
	gradient.addColorStop(0.05, "#000044");
	gradient.addColorStop(1.00, "#a0a000");

  drawCtx.beginPath();
  drawCtx.arc(0, 0, r, 0, 2*Math.PI, false);
	drawCtx.fillStyle = gradient;
  drawCtx.fill();

	drawCtx.restore();
}

function drawSegment(r1, r2, a1, a2, color) {
	let da = diffAngle(a1, a2);
	let fillStyle;
	if (color.constructor === Object) {
		// This is an object representing a two-color segment
		let r = (r1 + r2) / 2;
		let a1g = 0;
		let f;
		fillStyle = drawCtx.createConicGradient(a1g, 0, 0);
		fillStyle.addColorStop(0, color.start);
		f = (color.fraction - 0.1) * da/(2 * Math.PI);
		if (f > 0) {
			fillStyle.addColorStop(f, color.start);
		}
		f = (color.fraction + 0.1) * da/(2 * Math.PI);
		if (f < 1) {
			fillStyle.addColorStop(f, color.end);
		}
		f = 1 * (a2-a1)/(2 * Math.PI);
		fillStyle.addColorStop(f, color.end);
	} else {
		fillStyle = color;
	}
	drawCtx.save();
	drawCtx.rotate(a1+Math.PI/2);
	let borderWidth = lineWidth*4;
	let angleBorder = Math.atan(borderWidth / r1)/2;
	drawCtx.fillStyle = fillStyle;
  drawCtx.beginPath();

  drawCtx.arc(0, 0, r1+borderWidth, da-angleBorder, angleBorder, true);
  drawCtx.arc(0, 0, r2-borderWidth, angleBorder, da-angleBorder, false);

	// drawCtx.arc(0, 0, r1+borderWidth, da, 0, true);
  // drawCtx.arc(0, 0, r2-borderWidth, 0, da, false);

  drawCtx.closePath();
	drawCtx.fill();
  // drawCtx.stroke();
	drawCtx.restore();
}

function makeAnglesComparable(a1, a2) {
	let angles = [a1, a2].sort();
	let delta1 = angles[1] - angles[0];
	let delta2 = angles[0] + 2 * Math.PI - angles[1];
	if (delta1 < delta2) {
		return angles;
	} else {
		return [angles[1], angles[0] + 2 * Math.PI];
	}
}

function meanAngle(a1, a2) {
	[a1, a2] = makeAnglesComparable(a1, a2);
	return (a1 + a2) / 2;
}

function diffAngle(a1, a2) {
	[a1, a2] = makeAnglesComparable(a1, a2);
	return a2 - a1;
}

function drawLongEvent(r1, r2, t1, t2, text, color) {
	let a1 = getDayAngle(t1);
	let a2 = getDayAngle(t2);
	drawSegment(r1, r2, a1, a2, color);
	// let color = "#ff0000";
	drawLabel((r1+r2)/2, [a1,a2], text, '#ffffff');
}

function drawShortEvent(r1, r2, t, text) {
	let a = getDayAngle(t);
	drawCtx.save();
	drawCtx.rotate(a);
	drawCtx.lineWidth = lineWidth*4;
	// drawCtx.setLineDash(dash);
	// drawCtx.strokeStyle = color;

	drawCtx.beginPath();
	drawCtx.moveTo(-lineWidth*4, r1 - (r2 - r1));
	drawCtx.lineTo(-lineWidth*4, r2);
	drawCtx.stroke();
	drawCtx.restore();
	drawLabel((3*r1 - r2)/2, a, text, "#000000", 'left');
}

function drawArrow(r1, r2, a, headSize, arrowLineWidth) {
	// Draws an arrowhead at (x, y) with sides of the given length pointing in a direction defined by the angle a
	if (arrowLineWidth == undefined) {
		arrowLineWidth = lineWidth;
	}
	let angle = 55; // in degrees
	let c = Math.cos(((180 - angle/2) * Math.PI/180) + Math.PI/2);
	let s = Math.sin(((180 - angle/2) * Math.PI/180) + Math.PI/2);
	let dxL = -headSize * c;
	let dyL = headSize * s;
	let dxR = headSize * c;
	let dyR = headSize * s;

	let dash = '';
	let color = 'rgb(0, 0, 0)';

	drawCtx.save();
	drawCtx.rotate(a);
	drawCtx.lineWidth = arrowLineWidth;
	// drawCtx.setLineDash(dash);
	// drawCtx.strokeStyle = color;

	drawCtx.beginPath();
	drawCtx.lineCap = "round";
	drawCtx.lineJoin = "round";
	drawCtx.moveTo(0, r1);
	drawCtx.lineTo(0, r2);
	drawCtx.lineTo(dxL, r2 + dyL);
	drawCtx.moveTo(0, r2);
	drawCtx.lineTo(dxR, r2 + dyR);
	drawCtx.stroke();

	drawCtx.restore();
}

function drawCurrentTimeMarker(r1, r2) {
	let a = getDayAngle();
	drawArrow(r1-50, r1, a, 15/zoom, 4*lineWidth);
}

function drawLabel(r, a, text, color, justify) {
	if (color == undefined) {
		color = "#ffffff";
	}
	if (justify == undefined) {
		justify = 'center';
	}
	let currentFontSize = fontSize;
	drawCtx.save();
	drawCtx.font = currentFontSize + 'px Arial';
	let mt = drawCtx.measureText(text);
	let w = mt.width;
	let h = mt.height;
	if (a.constructor === Array) {
		// This must be an array of two angles. Size the text to fit within those.
		let da = diffAngle(a[0], a[1]);
		a = meanAngle(a[0], a[1]);
		let availableWidth = r * Math.tan(da);
		let shrinkRatio = 0.9 * availableWidth / w;
		if (shrinkRatio < 1) {
			if (shrinkRatio > 0.5) {
				// Shrink text to fit
				currentFontSize = currentFontSize * shrinkRatio;
			} else {
				// Not worth shrinking that much, just use first letter of text
				text = text[0];
			}
			// Recalculate text size;
			drawCtx.font = currentFontSize + 'px Arial';
			mt = drawCtx.measureText(text);
			w = mt.width;
			h = mt.height;
		}
	}
	let offset;
	let sign = 1;
	let extraSpace = 0;
	a = a.mod(2 * Math.PI);
	if (a > Math.PI/2 && a < 3*Math.PI/2) {
		a = a - Math.PI;
		sign = -1;
		extraSpace = 4;
	}
	a = a.mod(2 * Math.PI);

	switch (justify) {
		case 'center':
			offset = -w/2;
			break;
		case 'right':
			offset = -w + w*(1-sign)/2;
			break;
		case 'left':
			offset = -w * (1-sign)/2;
			break;
		case 'cw':
			offset = -w;
			break;
		case 'ccw':
			offset = 0;
			break;
	}
	drawCtx.rotate(a);
	drawCtx.fillStyle = color;
	drawCtx.fillText(text, offset, sign * r + (8 - extraSpace)/zoom);
	drawCtx.restore();
}

function drawTick(r, a) {
	drawCtx.save();
	drawCtx.lineWidth = lineWidth*2;
	drawCtx.rotate(a);
	drawCtx.beginPath();
	drawCtx.moveTo(0, r+8/zoom);
	drawCtx.lineTo(0, r);
	drawCtx.stroke();
	drawCtx.restore();
}

function labelTimes() {
	let midnight = new Date();
	midnight.setHours(0, 0, 0, 0);
	let timeStamp;
	let seconds;
	let angle;
	let hourIncrement;
	hourIncrement = getRelevantInterval() / 3600;
	for (let h = 0; h < 24; h+=hourIncrement) {
		seconds = Math.round(h * 3600);
		timeStamp = secondsToTimeString(seconds);
		angle = getDayAngle(seconds);
		drawLabel(r2+15/zoom, angle, timeStamp, "#000000");
		drawTick(r2, angle);
	}
}

function drawTimeHeader() {

	let seconds = getSecondsSinceMidnight();
	let timeStamp = secondsToTimeString(seconds);
	if (Math.floor(seconds) % 2 == 0) {
		timeStamp = timeStamp.replace(':', ' ');
	}

  $('#current-time').html(timeStamp);

	// drawCtx.save();
	// drawCtx.font = fontSize*2 + 'px Arial';
	// let mt = drawCtx.measureText(timeStamp);
	// let y = -(r2 + 40*(Math.pow(2, -zoom)) + 40 / Math.pow(zoom, 0.4));
	// drawCtx.fillText(timeStamp, -mt.width/2, y);
	// drawCtx.restore();
}

function updateCanvas() {
	clearCanvas();

	updateTransform();

	drawCtx.setTransform(sx, 0, 0, sy, dx, dy);

  // Draw stuff
	drawDaylight(r1-50);
	drawAnnulus(r1, r2);
	drawTimeHeader();
	labelTimes();

	drawSchedule();

	drawCurrentTimeMarker(r1, r2);

	notify();
}
