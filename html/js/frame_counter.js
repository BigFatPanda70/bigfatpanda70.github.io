	// ------------------ frame counter code -------------------
		// add the following paragraph tag to your code to get the fps counter working
		
		// <p id="fps">X</p>
var time_start = new Date().getTime();
var frame_number;
var frames_per_second;

function UpdateFrameCounter()
{
	var dt;
	var time_now;

	time_now = new Date().getTime();
	frame_number++;
	
	dt = (time_now - time_start)/1000;
	if (dt > 1)
	{
		frames_per_second = Math.floor(frame_number / dt);
		time_start = time_now;
		frame_number = 0;
	}
	
	document.getElementById ("fps").innerHTML = "&nbsp&nbsp" + frames_per_second;
};

	// ---------------- end of frame counter stuff ---------------
