	// ------------------ frame counter code -------------------
		// add the following paragraph tag to your code to get the fps counter working
		
		// <p id="fps">X</p>
var _fc_time_start = new Date().getTime();
var _fc_frame_number;
var _fc_div_id = "";
var _fc_frames_per_second;

function FrameCounter_Update()
{
	var dt;
	var time_now;

	time_now = new Date().getTime();
	_fc_frame_number++;
	
	dt = (time_now - _fc_time_start)/1000;
	if (dt > 1)
	{
		_fc_frames_per_second = Math.floor(_fc_frame_number / dt);
		_fc_time_start = time_now;
		_fc_frame_number = 0;
	}
	
	document.getElementById (_fc_div_id).innerHTML = "&nbsp&nbspfps:" + _fc_frames_per_second;
};

function FrameCounter_Init (div_id)
{
	_fc_div_id = div_id;
	_fc_time_start = new Date().getTime();
	_fc_frame_number = 0;
	_fc_frames_per_second = 0;
}

	// ---------------- end of frame counter stuff ---------------
