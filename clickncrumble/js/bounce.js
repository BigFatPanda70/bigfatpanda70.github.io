/*
	Title	:	Bounce Animation

	Info	:	Version 0.0	16th May 2023

	Author	:	Nick Fleming

	Updated	:	17th May 2023

	 Notes:
	--------

	Cycles through a very simple 'bounce' style animation with 
	squash and stretch fx.

	first.. object squashses out to its maximum width... then
	its midpoint ascends as the object then moves to its minimum width

	once it is off the floor it moves to its default width and remains
	in that shape until it hits the floor where the animation 
	begins once more.

*/

function BOUNCE_STRUCT (initial_cx, initial_cy, width, height, min_width, max_width, speed)
{
		// note : (cx,cy) = object center, not screen coordinates !

	this.initial_cx = initial_cx;
	this.initial_cy = initial_cy;		// reference point.
	this.initial_width = width;
	this.initial_height = height;
	this.initial_speed = speed;
	this.initial_ground_y = initial_cy + Math.floor (height/2);
	
	this.ground_y = this.initial_ground_y;
	
	this.min_width = min_width;
	this.max_width = max_width;

	this.cx = initial_cx;
	this.cy = initial_cy;
	this.width = width;
	this.height = height;
	
	this.dy = 0;				// +ve = going down, -ve = going up.
	this.dx = speed;
}

BOUNCE_STRUCT.prototype.reset = function()
{
	this.cx = this.initial_cx;
	this.cy = this.initial_cy;
	this.width = this.initial_width;
	this.height = this.initial_height;
	
	this.dy = 0;
	this.dx = this.initial_speed;
}

BOUNCE_STRUCT.prototype.doBounce = function ()
{
	var r;
	var cy;
	var h;
	var d;

	cy = this.cy;
	h = Math.floor (this.height/2);

	if (this.dy >= 0)
	{
			// move down.
			// if not touching the ground
			//		move center, keep initial shape (width & height)
			// else
			//		if h > min_width
			//			do squash
			//		else
			//			start rebound.
			
//		console.log ("down");
			// going down. if (y + (h/2)) > ground_y, need to squash.
		if ((cy+h) < this.ground_y)
		{
//			console.log ("above g");
			this.cy++;
			this.width = this.initial_width;
			this.height = this.initial_height;
		}
		else
		{
//			console.log ("h:" + h + " w:" + this.min_width);
			if (h > this.min_width)
			{
					// squash
				cy++;
				this.cy++;
				d = (cy+h) - this.ground_y;
				this.width += d;
				this.height -= d;
//				this.cx += Math.floor (d/2);
			}
			else
			{
				// do rebound
				this.dy = -1;
			}
		}
	}
	else
	{
		// moving up.
		// if not touching the ground, 
		// 		move up until max height reached.
		//	 change shape to initial h & w.
		
//		console.log ("up");
		if ((cy+h) < this.ground_y)
		{
			this.cy--;
			if (this.width < this.min_width)	this.width++;
			if (this.width > this.min_width)	this.width--;
			if (this.height < this.initial_height)	this.height++;
			if (this.height > this.initial_height)	this.height--;
			// TO DO ** MAX HEIGHT REVERSE DIRECTION
		}
		else
		{
			// stretch
			cy--;
			this.cy--;
			d = this.ground_y - (cy+h);
			this.height += d;
			this.width -= d;
		}
	}	
}

