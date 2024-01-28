/*
	Title	:	2D box Animation 

	Info	:	Version 0.0	17th May 2023

	Author	:	Nick Fleming

	Updated	:	23rd May 2023

	 Notes:
	--------
		'simple' 2D box animation..
	
	.. each animation frame is made of n points and a time value.

	This code just interpolates between frames using a time based
	system. Done this way so it is frame rate independent.




	 To Use:
	---------
		1. Create arrays for each animation frame. These arrays are just
	a list of (x,y) coordinates.

		e.g.
		var box_frame_0 = [-0.5,1, 0.5,1,	0.5,0,	-1,0];
		var box_frame_1 = [-1,0.5, 1,0.5,	1,0,	-1,0];

		Create another array with references to these arrays along with
		the relative time offset for each frame
	
		e.g.
		var box_frames = [box_frame_0, 0,	box_frame_1, 0.25];


		2. Create a ANIM_FRAMELIST_STRUCT object to upload 
		all the animation point data to the internal frame list structure.

	 22nd May 2023
	---------------
		redoing time stuff to make animation loops easier.. so when
		end_time is reached, the animation auto repeats.

	 23rd May 2023
	----------------
		For a simple animation, this is taking rather a long time
	to finish...sigh.
		- its working..!!! Now all that needs to do is the following
	sequence

		create animation:

		BoxAnim = new ANIM_FRAMELIST_STRUCT (start_time, duration, box_frames, true);

		update :
		BoxAnim.update (current_time);

		then just call your custom drawing code :
		DrawBoxAnim(BoxAnim);

	Thats it :-D

*/

function ANIM_FRAME_STRUCT (point_array, time_offset)
{
	// point array is just a collection of (x,y) pairs.
	// e.g. pa[0] = x0,	pa[1] = y0,	pa[2] =x1, pa[3] = y1 ..etc

	// point array can be null for blank (tween) frames.

	// time_offset should be a relative offset from the start of the
	// animation sequence.

	var i;
	var idx;
	this.px = [];
	this.py = [];
	this.t = time_offset;
	
	if (point_array != null)
	{
		idx = 0;
		for (i = 0; i < point_array.length; i += 2)
		{
			this.px[idx] = point_array[i+0];
			this.py[idx] = point_array[i+1];
			idx++;
		}
	}
}

function Anim_CreateTween (anim_frame_0, anim_frame_1, tween_frame, current_t)
{
	var i;
	var dt;
	var t;
	
	// anim_frame_0 = start ANIM_FRAME_STRUCT
	// anim_frame_1 = end   ANIM_FRAME_STRUCT
	// tween frame = output tween ANIM_FRAME_STRUCT

	// for now, just doing a straight tween.

	dt = anim_frame_1.t - anim_frame_0.t;

	if (dt == 0)	return;		// shouldn't get here??

	t = (current_t - anim_frame_0.t) / dt;		// t = [0..1]
	if (t < 0)	t = 0;	// clamp.
	if (t > 1)	t = 1;	// clamp.

	for (i = 0; i < anim_frame_0.px.length; i++)
	{
		tween_frame.px[i] = anim_frame_0.px[i] + ((anim_frame_1.px[i] - anim_frame_0.px[i]) * t);
		tween_frame.py[i] = anim_frame_0.py[i] + ((anim_frame_1.py[i] - anim_frame_0.py[i]) * t);
	}
	
	tween_frame.t = current_t;
}

	// ----------------------------------------------
	//			--- Frame List code ---
	// ----------------------------------------------

function ANIM_FRAMELIST_STRUCT (start_time, duration, anim_frame_array, loop_animation)
{
	// start_time = time in milliseconds
	// duration = duration in time in milliseconds.

	// anim_frame_array = array of references to point data arrays, 
	// along with a time offset value.
	// 	e.g. point_data_array0, time0,
	// 	e.g. point_data_array1, time1,
	//			:			  ,   :,
	//	etc.

	// loop_animation -> true = continuous loop, false = no loop.

	var i;
	var idx;
	var point_data;
	var time_offset;

	this.start_time = start_time;
	this.duration = duration;
	this.loop_animation = loop_animation;
	this.frame_list = [];
	this.tween_frame = new ANIM_FRAME_STRUCT (null,0);	// create blank tween frame.

	this.end_time = start_time + duration;	//end_time;
	
		// copy frame data into buffers.
	idx = 0;
	for (i = 0; i < anim_frame_array.length; i += 2)
	{
		point_data = anim_frame_array[i+0];
		time_offset = anim_frame_array[i+1];
		this.frame_list[idx] = new ANIM_FRAME_STRUCT (point_data, time_offset);
		idx++;
	}
	
//	console.log ("loop animation:" + this.loop_animation);
}

ANIM_FRAMELIST_STRUCT.prototype.reset = function (start_time)
{
	this.start_time = start_time;
	this.end_time = start_time + this.duration;
}


ANIM_FRAMELIST_STRUCT.prototype.createTween = function (current_time)
{
	var i;
	var idx;
	var relative_time;
	
	if (this.frame_list.length == 0)
	{
		return;	// nothing to do
	}
	
	if ((this.frame_list.length < 2) || (current_time <= this.start_time)
		|| (current_time >= this.end_time))
	{
		idx = 0;
		if (current_time >= this.end_time)	{ idx = this.frame_list.length-1; }

			// if current time outside start or end times, 
			// just use start|end frame as tween.

		for (i = 0; i < this.frame_list[idx].px.length; i++)
		{
			this.tween_frame.px[i] = this.frame_list[idx].px[i];
			this.tween_frame.py[i] = this.frame_list[idx].py[i];
			this.tween_frame.t = current_time;	//	not required ???this.frame_list[0].t;
		}
		return;
	}

	// find frames to tween between.

	relative_time = current_time - this.start_time;

	idx = 0;
	while ((this.frame_list[idx+1].t < relative_time) && (idx < (this.frame_list.length-2)))
	{
		idx++;
	}

	Anim_CreateTween (
		this.frame_list[idx],
		this.frame_list[idx+1],
		this.tween_frame,
		relative_time);
}

ANIM_FRAMELIST_STRUCT.prototype.update = function (current_time)
{
//	var rt;

	if (current_time < this.start_time)
	{
				// don't show animation frame if not started yet ??
		return;
	}

	if ((this.end_time <= current_time) && (this.loop_animation == true))
	{
		// reset.
		this.reset (current_time);
	}

//	rt = current_time - this.start_time;
	this.createTween (current_time);

}
