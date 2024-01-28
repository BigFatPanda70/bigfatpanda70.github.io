/*
	Title	:	RAM based screen buffer

	Info	:	Version 0.8	24th January 2024

	Author	:	Nick Fleming.

	Updated	:	24th January 2024

	 Notes:
	---------
	RAM based screen buffer, used to minimise data transfer between RAM
	and the GPU when a large number of pixel operations need to be done.

	notes:
	ScreenArrayBuffer = pointer to a block of memory used by the buffer.
	screenBuf8 = pointer for ScreenBufferArray as array of bytes.
	screenData = pointer for ScreenBufferArray as array of 32 bit integers.
				.. screenData is used to write 4 bytes of colour info
				simultaneously.

	 30th September 2020
	----------------------
		Correcting typo's.. javascript does NOT flag up all undefined
	variables.

	 28th September 2022
	-----------------------
		trying experimental code based on this:

https://www.reddit.com/r/javascript/comments/5nw6uf/big_canvas_buffer_mistake_even_tutorial_sites_miss/

	where the pixel data is addressed directly, so should be faster
	(no need to do .set call)

	... appears to work ok :-)

	 30th January 2023
	-------------------
		Adding some simple code to draw a rectangle. Works.. so now
	adding code to draw an image (as the next logical step...)


	 10th May 2023
	---------------
		added alphaSetPixel for fx based stuff.

	 29th May 2023
	---------------
		Updated drawImgA to have the width and height of the image
	stored as part of the raw data rather than being passed in as 
	a parameter.

		Nope - back to having it passed as a parameter, so I can just
	use raw(generated) image data without having to modify it.

	 30th May 2023
	----------------
		Moved FastAlphaRect to this file to make it available to
	other programs.

	 31st May 2023
	---------------
		Added code for generalised polygon drawing.


		notice that lines are drawn different (vertically) depending
	on how points are ordered.. somethings wrong ?? 
	
		- not actually wrong, just when the dda values are different
	at either end of the line, you get different pixels being 
	filled depending on if you are drawing up or down.. solution..
	set the 'e' or 's' value to dy/2 at the start, and always calculate
	lines from top to bottom.


	 15th June 2023
	----------------
		Adding fast scaled image span drawing.

	 16th June 2023
	----------------
		Wondering if I can specify negative width for scaled drawing.


	 23rd June 2023
	-----------------
		Added scaled image drawing for a rectangle within an image.
	For once, just used a scaling factor and let the hardware do the
	heavy lifting (no fixed point arithmetic or other speed hacks..).


	 1st July 2023
	---------------
		Polygon drawing isnt working :-( . There is a bug when I
	specify the following 3 coordinates:
		(10,20), (50,80), (50,40)
	.. so going to do tests.

	 4th July 2023
	---------------
		Adding global fade fx. Each colour is reduced by n%. 

	 7th November 2023
	--------------------
	Corrected polygon drawing (hopefully!). the last point of each line
	is not added to the scanline list to prevent points being 
	added twice.

	 22nd January 2024
	--------------------
		Adding some very basic font handling code (perhaps...??)
	- putting the font stuff in a separate file, so the only thing
	that is added to this file is a 'font' variable as a placeholder.
	
	Im sure this breaks some oop rule somewhere but im trying to 
	encapsulate stuff and keep dependencies to a minimum where i can.

	 24th January 2024
	--------------------
	Adding some alpha blending to scaled image drawing to try and
	improve text rendering - no idea if this will work.


*/

function ScrBuffer (canvas_id)
{
		// Creates an offscreen fixed array buffer copy of the 
		// existing canvas, and two views for writing per byte and
		// per longword for speed.

	var lp;
	var rgba;

	this.canvas = document.getElementById (canvas_id);
	this.ctx = this.canvas.getContext('2d');
	this.screenImgData = this.ctx.getImageData (0,0, this.canvas.width, this.canvas.height);

	this.width = this.canvas.width;
	this.height = this.canvas.height;

//	this.screenArrayBuffer = new ArrayBuffer (this.screenImgData.data.length);
//	this.screenBuf8 = new Uint8ClampedArray (this.screenArrayBuffer);
//	this.screenData = new Uint32Array (this.screenArrayBuffer);

//	this.screenBuf8 = new Uint8Array (this.screenImgData.data.buffer);

	this.screenBuf8 = this.screenImgData.data;

	this.screenData = new Uint32Array (this.screenImgData.data.buffer);

		// pixel test
	for (lp = 0; lp < (this.canvas.width * this.canvas.height); lp++)
	{
		rgba = 	(255 << 24)	|		// alpha
				(lp << 16) |		// blue
				(255-lp <<  8) |	// green
				lp*lp;				// red
		this.screenData[lp] = rgba;	//255<<24;
	}

		// screen buffer copy (for fx)
	this.screenCopy = this.ctx.getImageData (0,0, this.canvas.width, this.canvas.height);
	
	this.font = null;		// reserved for font stuff.
}

ScrBuffer.prototype.drawBuffer = function()
{
//	this.screenImgData.data.set (this.screenBuf8);	// <== DONT USE THIS, ITS SLOWER!
	this.ctx.putImageData(this.screenImgData, 0, 0);
}

ScrBuffer.prototype.clear = function(r,g,b)
{
	var lp;
	rgba = 	(255 << 24)	|		// alpha
			((b&255) << 16) |	// blue
			((g&255) <<  8) |	// green
			(r&255);			// red

	for (lp = 0; lp < (this.canvas.width * this.canvas.height); lp += 4)
	{
		this.screenData[lp] = rgba;
		this.screenData[lp+1] = rgba;
		this.screenData[lp+2] = rgba;
		this.screenData[lp+3] = rgba;
	}
}

ScrBuffer.prototype.setPixel = function(sx, sy, r,g,b)
{
	var i;
	var rgba;

	if ((sx < 0) || (sy < 0) || (sx >= this.canvas.width) || (sy >= this.canvas.height))
	{
		return;
	}

	rgba = 	(255 << 24)	|		// alpha
			((b&255) << 16) |	// blue
			((g&255) <<  8) |	// green
			(r&255);			// red

	i = Math.floor(sx) + (Math.floor(sy) * this.canvas.width);	//GameScreenWidth );
	this.screenData[i] = rgba;
}

//var jjkl = 0;

ScrBuffer.prototype.alphaSetPixel = function(sx, sy, red,green,blue,alpha)
{
	// uses alpha component to blend pixel with screen.
	// (useful for fx !!)

/*
INK_STRUCT.prototype.alphaBlend = function (red,green,blue,alpha)
{
	// does alpha blend calculation with ink and r,g,b,a parameters

	var ab;
	var a0;

	ab = this.a / 255;					// need range to be [0..1]

	a0 = alpha + (ab*(1-alpha));

	if (a0 != 0)
	{
		this.r = ((red*alpha) + ((this.r*ab)*(1-alpha))) / a0;
		this.g = ((green*alpha) + ((this.g*ab)*(1-alpha))) / a0;
		this.b = ((blue*alpha) + ((this.b*ab)*(1-alpha))) / a0;
	}
}
*/

	var i;
	var r;
	var g;
	var b;
	var a;
	var d;

	var a0;
	var al;

	if ((sx < 0) || (sy < 0) || (sx >= this.canvas.width) || (sy >= this.canvas.height))
	{
		return;
	}
	
//	if (jjkl  < 10)
//	{
//		console.log ("sx:" + sx + " sy:" + sy + " r:" + red + " g:" + green + " b:" + blue + " a:" + alpha);
//		jjkl++;
//	}
	
	d = this.screenImgData;
	
	i = Math.floor(sx*4) + (Math.floor(sy) * 4 * this.canvas.width);
	r = d.data[i+0];
	g = d.data[i+1];
	b = d.data[i+2];
	a = d.data[i+3];

	a = a / 255;
	al = alpha / 255;
	
	a0 = al + (a*(1-al));

	r = ((red*al) + ((r*a)*(1-al))) / a0;
	g = ((green*al) + ((g*a)*(1-al))) / a0;
	b = ((blue*al) + ((b*a)*(1-al))) / a0;

	d.data[i+0] = r;
	d.data[i+1] = g;
	d.data[i+2] = b;
//	d.data[i+3] = a0 * 255;

//	rgba = 	(255 << 24)	|		// alpha
//			((b&255) << 16) |	// blue
//			((g&255) <<  8) |	// green
//			(r&255);			// red

//	i = Math.floor(sx) + (Math.floor(sy) * this.canvas.width);	//GameScreenWidth );
//	this.screenData[i] = rgba;
}

ScrBuffer.prototype.drawLine = function (x0,y0,x1,y1,r,g,b)
{
	// draws a line to the screen buffer : note that it does *NOT*
	// do any clipping - assumes all points are on screen.

	// modifying code so that lines are always drawn either
	// left to right or top to bottom , to be consistent with
	// margin of error (drawing bottom to top will give slightly 
	// different results).

	var dx;
	var dy;
	var incx;
	var incy;
	var rgba;
	var d;
	var s;
	var i;
	
	var xa;
	var ya;
	var xb;
	var yb;
	
	rgba = 	(255 << 24)	|		// alpha
			((b&255) << 16) |	// blue
			((g&255) <<  8) |	// green
			(r&255);			// red

	i = Math.floor (x0) + (Math.floor(y0) * this.canvas.width);

	if (x0 == x1)
	{
		// draw vertical line.
		dy = y1 - y0;
		incy = this.canvas.width;
		if (y1 < y0)
		{
			incy = -incy;
			dy = -dy;
		}
		d = 0;
		while (d <= dy)
		{
			this.screenData[i] = rgba;
			i += incy;
			d++;
		}
		return;
	}

	if (y0 == y1)
	{
		// draw horizontal line.
		dx = x1 - x0;
		incx = 1;
		if (x1 < x0)
		{
			incx = -incx;
			dx = -dx;
		}
		d = 0;
		while (d <= dx)
		{
			this.screenData[i] = rgba;
			i += incx;
			d++;
		}
		return;
	}

		// draw general line.

	dx = x1 - x0;
	dy = y1 - y0;

	incx = 1;
	if (dx < 0)
	{
		incx = -incx;
		dx = -dx;
	}

	incy = this.canvas.width;
	if (dy < 0)
	{
		incy = -incy;
		dy = -dy;
	}

	d = 0;
	s = 0;
	if (dx >= dy)
	{
		s = 0;	// Math.floor (dx/2);

		while (d <= dx)
		{
			this.screenData[i] = rgba;

			i = i + incx;
			s = s + dy;
			if (s >= dx)
			{
				i = i + incy;
				s -= dx;
			}
			d++;
		}
	}
	else
	{
		s =  Math.floor (dy/2);	//*1)-(dx*2.8);
		if (y0 > y1)
		{
			// reverse stuff.
			i = Math.floor (x1) + (Math.floor(y1) * this.canvas.width);
			incy = -incy;
			incx = -incx;
		}

		while (d <= dy)
		{
			this.screenData[i] = rgba;

			i = i + incy;
			s = s + dx;
			if (s >= dy)
			{
				i = i + incx;
				s -= dy;
			}
			d++;
		}
	}
}

ScrBuffer.prototype.drawCircle = function (cx, cy, radius, r,g,b)
{
		// converted from my c code library :-)

	var MajorAxis;
	var MinorAxis;
	var RadiusSqrMinusMajorAxisSqr;
	var MinorAxisSquaredThreshold;

	var px;
	var py;

	if (radius < 1)		return;		// don't draw invalid circles.

	if ((cx + radius) < 0)		return;		// dont draw a thing
	if ((cy + radius) < 0)		return;		// if completely off
	if ((cx - radius) > this.canvas.width)		return;		// screen.
	if ((cy - radius) > this.canvas.height)		return;

	MajorAxis = 0;
	MinorAxis = radius;

	// Set initial radius**2 - majoraxis**2	(majoraxis is initialy 0

	RadiusSqrMinusMajorAxisSqr = radius * radius;	// see -I need big ints!

	// set threshold for minoraxis movement at (MinorAxis - 0.5)**2

	MinorAxisSquaredThreshold = (MinorAxis * MinorAxis) - MinorAxis;

	while (MajorAxis <= MinorAxis)
	{
		px = cx + MajorAxis;	// draw 8 symmetries.
		py = cy - MinorAxis;
		this.setPixel (px, py, r,g,b);

		px = cx - MajorAxis;	// 2
		py = cy - MinorAxis;
		this.setPixel (px, py, r,g,b);

		px = cx + MajorAxis;	// 3
		py = cy + MinorAxis;
		this.setPixel (px, py, r,g,b);

		px = cx - MajorAxis;	// 4
		py = cy + MinorAxis;
		this.setPixel (px, py, r,g,b);

	// -- first four done.
		px = cx + MinorAxis;	// 5
		py = cy - MajorAxis;
		this.setPixel (px, py, r,g,b);

		px = cx - MinorAxis;	// 6
		py = cy - MajorAxis;
		this.setPixel (px, py, r,g,b);

		px = cx + MinorAxis;	// 7
		py = cy + MajorAxis;
		this.setPixel (px, py, r,g,b);

		px = cx - MinorAxis;	// 8
		py = cy + MajorAxis;
		this.setPixel (px, py, r,g,b);

		// advance one pixel along major axis.

		MajorAxis++;
		RadiusSqrMinusMajorAxisSqr -= MajorAxis + MajorAxis - 1;
		if (RadiusSqrMinusMajorAxisSqr <= MinorAxisSquaredThreshold)
		{
			MinorAxis--;
			MinorAxisSquaredThreshold -= MinorAxis + MinorAxis;
		}
	}
}

ScrBuffer.prototype.drawWuLine = function (x0,y0,x1,y1,r,g,b)
{
	// based on the wikipedia version.
	
	//https://en.wikipedia.org/wiki/Xiaolin_Wu%27s_line_algorithm

//	function plot(x, y, c) is
//    plot the pixel at (x, y) with brightness c (where 0 ≤ c ≤ 1)

// integer part of x
//function ipart(x) is
//    return floor(x)

//function round(x) is
//    return ipart(x + 0.5)

// fractional part of x
//function fpart(x) is
//    return x - floor(x)

//function rfpart(x) is
//    return 1 - fpart(x)

//function drawLine(x0,y0,x1,y1) is

//return 1 - (x - floor(x))

	var steep;
	var t;
	var dx;
	var dy;
	var gradient;

	var xend;
	var yend;

	var xgap;

	var xpxl1;
	var ypxl1;

	var xpxl2;
	var ypxl2;

	var intery;
	var x;
	
	var step;

	var f;
	var rf;

		//     boolean steep := abs(y1 - y0) > abs(x1 - x0)

	steep = false;
	if (Math.abs (y1-y0) > Math.abs (x1-x0))
	{
		steep = true;
	}

	if (steep == true)				//     if steep then
	{
		t = x0; x0 = y0; y0 = t;	// 			swap(x0, y0)
		t = x1; x1 = y1; y1 = t;	//       	swap(x1, y1)
	}								//	    end if

	if (x0 > x1)					//	if x0 > x1 then
	{
        t = x0; x0 = x1; x1 = t;	//		swap(x0, x1)
        t = y0; y0 = y1; y1 = t;	//		swap(y0, y1)
	}								//  end if

    dx = x1 - x0;					// dx := x1 - x0
    dy = y1 - y0;					// dy := y1 - y0

	if (dx == 0.0)
	{
		gradient = 1.0;
	}
	else
	{
		gradient = dy / dx;
	}

		// handle first endpoint
    xend = Math.floor (x0 + 0.5);						// xend := round(x0)
    yend = y0 + gradient * (xend - x0);					// yend := y0 + gradient * (xend - x0)
    xgap = 1 - ((x0 + 0.5) - Math.floor(x0 + 0.5));		// xgap := rfpart(x0 + 0.5)
	xpxl1 = xend;										// xpxl1 := xend // this will be used in the main loop
    ypxl1 = Math.floor(yend);							// ypxl1 := ipart(yend)
	f = yend - Math.floor (yend);
	rf = 1 - f;
	f = f * xgap;
	rf = rf * xgap;
    if (steep == true)									// if steep then
    {
		this.setPixel (ypxl1,   xpxl1, r*rf,g*rf,b*rf);	// plot(ypxl1,   xpxl1, rfpart(yend) * xgap)
        this.setPixel (ypxl1+1, xpxl1, r*f,g*f,b*f);	// plot(ypxl1+1, xpxl1,  fpart(yend) * xgap)
	}
    else
    {
		
        this.setPixel (xpxl1, ypxl1  , r*rf,g*rf,b*rf);			// plot(xpxl1, ypxl1  , rfpart(yend) * xgap)
        this.setPixel (xpxl1, ypxl1+1, r*f,g*f,b*f);			// plot(xpxl1, ypxl1+1,  fpart(yend) * xgap)
    }										// end if
	intery = yend + gradient;				// intery := yend + gradient // first y-intersection for the main loop

		// handle second endpoint 
    xend = Math.floor(x1 + 0.5);						// xend := round(x1)
    yend = y1 + gradient * (xend - x1);					// yend := y1 + gradient * (xend - x1)
    xgap = (x1+0.5) - Math.floor (x1 + 0.5);			// xgap := fpart(x1 + 0.5)
    xpxl2 = xend;										// xpxl2 := xend //this will be used in the main loop
    ypxl2 = Math.floor(yend);							// ypxl2 := ipart(yend)
	f = yend - Math.floor (yend);
	rf = 1 - f;
	f = f * xgap;
	rf = rf * xgap;
    if (steep == true)									//if steep then
	{
        this.setPixel (ypxl2  , xpxl2, r*rf,g*rf,b*rf);		// plot(ypxl2  , xpxl2, rfpart(yend) * xgap)
        this.setPixel (ypxl2+1, xpxl2, r*f,g*f,b*f);		// plot(ypxl2+1, xpxl2,  fpart(yend) * xgap)
	}
    else
	{
        this.setPixel (xpxl2, ypxl2,   r*rf,g*rf,b*rf);	// plot(xpxl2, ypxl2,  rfpart(yend) * xgap)
        this.setPixel (xpxl2, ypxl2+1, r*f,g*f,b*f);	// plot(xpxl2, ypxl2+1, fpart(yend) * xgap)
	}													//    end if

		// main loop
	step = 1;
//	if ((xpxl1 + 1) > (xpxl2 - 1))
//	{
//		step = -1;
//	}

    if (steep == true)												// if steep then
    {
        for (x = (xpxl1 + 1); x != (xpxl2); x += step)			// for x from xpxl1 + 1 to xpxl2 - 1 do
		{															//begin
			f = intery - Math.floor (intery);
			rf = 1 - f;
			this.setPixel (Math.floor(intery)  , x, r*rf,g*rf,b*rf);	// plot(ipart(intery)  , x, rfpart(intery))
			this.setPixel (Math.floor(intery)+1, x, r*f,g*f,b*f);	// plot(ipart(intery)+1, x,  fpart(intery))
			intery = intery + gradient;								// intery := intery + gradient
		}															//end
	}
    else
	{
        for (x  = xpxl1 + 1; x != (xpxl2 ); x += step)		// for x from xpxl1 + 1 to xpxl2 - 1 do
        {															// begin
			f = intery - Math.floor (intery);
			rf = 1 - f;
			this.setPixel (x, Math.floor(intery),   r*rf,g*rf,b*rf);	// (x, Math.floor(intery),  rfpart(intery))
			this.setPixel (x, Math.floor(intery)+1, r*f,g*f,b*f);	// (x, Math.floor(intery)+1, fpart(intery))
			intery = intery + gradient;								// intery := intery + gradient
		}															// end
	}																// end if
}																	// end function



ScrBuffer.prototype.drawWuCircle = function (x,y, radius, r,g,b)
{
	// based heavily on the code from : https://yellowsplash.wordpress.com/2009/10/23/fast-antialiased-circles-and-ellipses-from-xiaolin-wus-concepts/
	// and
	// https://landkey.net/d/L/J/RF/WUCircle/Intro.txt.legacy.htm
	// and
	
	
}


ScrBuffer.prototype.drawRect = function (x0,y0,width,height, r,g,b)
{
	var rgba;

	var left;
	var right;
	var top;
	var bottom;

	var y;
	var x;

	var i;

	rgba = 	(255 << 24)	|		// alpha
			((b&255) << 16) |	// blue
			((g&255) <<  8) |	// green
			(r&255);			// red

	left = x0;
	right = x0 + width;
	top = y0;
	bottom = y0 + height;
	
	if ((bottom < 0) || (right < 0) || (top >= this.canvas.height) || (left >= this.canvas.width))
	{
		return;
	}

	if (left < 0)	left = 0;
	if (top < 0)	top = 0;
	if (right >= this.canvas.width)	right = this.canvas.width - 1; 
	if (bottom >= this.canvas.height) bottom = this.canvas.height-1;

	for (y = top; y < bottom; y++)
	{
		i = Math.floor(left) + (Math.floor(y) * this.canvas.width);	//GameScreenWidth );

		for (x = left; x < right; x++)
		{
			this.screenData[i++] = rgba;
		}
	}
}

ScrBuffer.prototype.drawImg = function (x0, y0, width, height, img_data)
{
	// no horizontal clipping done (yet)

	// img data = array of r,g,b data.
	// could probably speed this up by pre-processing the img data.

	var rgba;
	var r;
	var g;
	var b;
	var alpha;

	var left;
	var right;
	var top;
	var bottom;

	var y;
	var x;

	var idx;
	var tmp_idx;

//	rgba = 	(255 << 24)	|		// alpha
//			((b&255) << 16) |	// blue
//			((g&255) <<  8) |	// green
//			(r&255);			// red

	alpha = 255;

	idx = 0;		// index for start of image data.

	left = x0;
	right = x0 + width;
	top = y0;
	bottom = y0 + height;
	
	if ((bottom < 0) || (right < 0) || (top >= this.canvas.height) || (left >= this.canvas.width))
	{
		return;
	}

	if (top < 0)
	{
		idx += ((-top) * width * 3);		// r,g,b = 3 items per ink
		top = 0;
	}
	if (bottom >= this.canvas.height) bottom = this.canvas.height-1;

		// draw image from top to bottom.
	for (y = top; y < bottom; y++)
	{
		i = Math.floor(left) + (Math.floor(y) * this.canvas.width);	//GameScreenWidth );

		tmp_idx = idx;

		for (x = left; x < right; x += 1)
		{
			r = img_data[idx+0];
			g = img_data[idx+1];
			b = img_data[idx+2];
			idx += 3;

			rgba = 	(alpha << 24)	|		// alpha
					((b&255) << 16) |	// blue
					((g&255) <<  8) |	// green
					(r&255);			// red
			
			this.screenData[i++] = rgba;
		}
		idx = tmp_idx + (width * 3);
	}
}

ScrBuffer.prototype.drawImgA = function (x0, y0, width, height, img_data)
//ScrBuffer.prototype.drawImgA = function (x0, y0, img_data)
{
	// no horizontal clipping done (yet)

	// img data = array of r,g,b,a data.
	// a = 0 = dont draw pixel a = 255 = draw pixel.
	// could probably speed this up by pre-processing the img data.
	
	// note : first two values of the image data are width and height

	var rgba;
	var r;
	var g;
	var b;
	var alpha;

	var left;
	var right;
	var top;
	var bottom;

	var y;
	var x;

	var idx;
	var tmp_idx;
	
	var width;
	var height;

//	rgba = 	(255 << 24)	|		// alpha
//			((b&255) << 16) |	// blue
//			((g&255) <<  8) |	// green
//			(r&255);			// red

//	alpha = 255;

	idx = 0;		// index for start of image data.

//	width = img_data[idx++];
//	height= img_data[idx++];

	left = x0;
	right = x0 + width;
	top = y0;
	bottom = y0 + height;
	
	if ((bottom < 0) || (right < 0) || (top >= this.canvas.height) || (left >= this.canvas.width))
	{
		return;
	}

		// crude clipping for now
	if (top < 0)
	{
		idx += ((-top) * width * 4);		// r,g,b,a = 4 items per ink
		top = 0;
	}
	if (bottom >= this.canvas.height) bottom = this.canvas.height;

		// draw image from top to bottom.
	for (y = top; y < bottom; y++)
	{
		i = Math.floor(left) + (Math.floor(y) * this.canvas.width);	//GameScreenWidth );

		tmp_idx = idx;

		for (x = left; x < right; x += 1)
		{
//			r = img_data[idx+0];
//			g = img_data[idx+1];
//			b = img_data[idx+2];
			a = img_data[idx+3];
//			idx += 4;

			if (a != 0)
			{
				r = img_data[idx+0];
				g = img_data[idx+1];
				b = img_data[idx+2];
				rgba = 	(a << 24)	|		// alpha
					((b&255) << 16) |	// blue
					((g&255) <<  8) |	// green
					(r&255);			// red
			
				this.screenData[i] = rgba;
			}
			idx += 4;
			i++;
		}
		idx = tmp_idx + (width * 4);
	}
}

ScrBuffer.prototype.FastAlphaRect = function (sx,sy, w,h, red,green,blue)
{
	// creates a rectangle with approx 25% red,green,blue over
	// 75% background colour using shifts.

	var i;
	var x;
	var y;
	var d;

	d= this.screenImgData;

	for (y = sy; y < (sy+h); y++)
	{
		for (x = sx; x < (sx + w); x++)
		{
//			i = (4*x) + (4 * CvsWidth * y);
			i = (4*x) + (4 * this.canvas.width * y);
			
				// 50% alpha:
//			d.data[i+0] = (r + red)>>1;
//			d.data[i+1] = (g + green)>>1;
//			d.data[i+2] = (b + blue)>>1;

				// 25% alpha
//			d.data[i+0] = ((r*3)>>2) + (red>>2);
//			d.data[i+1] = ((g*3)>>2) + (green>>2);
//			d.data[i+2] = ((b*3)>>2) + (blue>>2);

				// optimised
			d.data[i+0] = ((d.data[i+0]*3)>>2) + (red>>2);
			d.data[i+1] = ((d.data[i+1]*3)>>2) + (green>>2);
			d.data[i+2] = ((d.data[i+2]*3)>>2) + (blue>>2);

		}
	}
}

ScrBuffer.prototype.FastAlphaRect50 = function (sx,sy, w,h, red,green,blue)
{
	// creates a rectangle with approx 50% red,green,blue over
	// 50% background colour using shifts.

	var i;
	var x;
	var y;
	var d;

	d= this.screenImgData;

	for (y = sy; y < (sy+h); y++)
	{
		for (x = sx; x < (sx + w); x++)
		{
//			i = (4*x) + (4 * CvsWidth * y);
			i = (4*x) + (4 * this.canvas.width * y);
			
				// 50% alpha:
			d.data[i+0] = (d.data[i+0] + red)>>1;
			d.data[i+1] = (d.data[i+1] + green)>>1;
			d.data[i+2] = (d.data[i+2] + blue)>>1;

				// 25% alpha
//			d.data[i+0] = ((r*3)>>2) + (red>>2);
//			d.data[i+1] = ((g*3)>>2) + (green>>2);
//			d.data[i+2] = ((b*3)>>2) + (blue>>2);

				// optimised
//			d.data[i+0] = ((d.data[i+0]*3)>>2) + (red>>2);
//			d.data[i+1] = ((d.data[i+1]*3)>>2) + (green>>2);
//			d.data[i+2] = ((d.data[i+2]*3)>>2) + (blue>>2);

		}
	}
}

ScrBuffer.prototype.FastAlphaRect3 = function (sx,sy, w,h, red,green,blue)
{
	// creates a rectangle with approx 75% red,green,blue over
	// 25% background colour using shifts.

	var i;
	var x;
	var y;
	var d;

	d= this.screenImgData;

	for (y = sy; y < (sy+h); y++)
	{
		for (x = sx; x < (sx + w); x++)
		{
//			i = (4*x) + (4 * CvsWidth * y);
			i = (4*x) + (4 * this.canvas.width * y);
			

				// 25% alpha
			d.data[i+0] = ((d.data[i+0])>>2) + ((red*3)>>2);
			d.data[i+1] = ((d.data[i+1])>>2) + ((green*3)>>2);
			d.data[i+2] = ((d.data[i+2])>>2) + ((blue*3)>>2);


		}
	}
}



	// -------------------------------------------------
	//		Scaled Image stuff
	// -------------------------------------------------

ScrBuffer.prototype.ScaledImageLine = function (sx,sy, width, raw_img_data, img_offset, img_width)
{
	// (sx,sy) = screen buffer coordinates.
	// width = on screen width (can be -ve)
	// raw_img_data = raw rgba image data.
	// img_offset = offset into image data to start drawing at.
	// img_width = width in pixels to draw.
	
	// note : no clipping or blending  done here, only raw speed !!
		
	// aliasing will be horrible !!

	var d;
	var i;
	var dx;
	var w;
	var idx;
	
	if (img_width < 1)	return;
	
	d = this.screenImgData;
	i = (4*sx) + (4 * this.canvas.width * sy);
//	console.log ("i:"+i + " sx:" + sx + " sy:" + sy);
	
	dx = img_width / width;

	if (dx >= 0)
	{
		for (w = 0; w < img_width; w += dx)
		{
			idx = img_offset + (4*Math.floor (w));

			if (raw_img_data[idx+3] != 0)
			{
				d.data[i+0] = raw_img_data[idx+0];
				d.data[i+1] = raw_img_data[idx+1];
				d.data[i+2] = raw_img_data[idx+2];
			}
			i += 4;
		}
	}
	else
	{
//		console.log ("iw:" + img_width + " dx:" + dx);
		dx = -dx;
		for (w = 0; w < img_width; w += dx)
		{
			idx = img_offset + ((img_width*4)- 4) - (4*Math.floor (w));
//			idx = img_offset + (img_width*4) - (4*Math.floor (w));

			if (raw_img_data[idx+3] != 0)
			{
				d.data[i+0] = raw_img_data[idx+0];
				d.data[i+1] = raw_img_data[idx+1];
				d.data[i+2] = raw_img_data[idx+2];
			}
			i += 4;
		}

	}
}

ScrBuffer.prototype.ScaledHeightImageLine = function (sx,sy, height, raw_img_data, img_width_bytes,
									img_byte_offset, num_img_pixels)
{
	// (sx,sy) = screen buffer coordinates.
	// width = on screen width (can be -ve)
	// raw_img_data = raw rgba image data.
	// img_offset = offset into image data to start drawing at.
	// img_width = width in pixels to draw.
	
	// note : no clipping or blending  done here, only raw speed !!
		
	// aliasing will be horrible !!

	var d;
	var i;
	var dy;
	var h;
	var idx;
	
	if (num_img_pixels < 1)	return;
	
	d = this.screenImgData;
	i = (4*Math.floor(sx)) + (4 * this.canvas.width * Math.floor(sy));
//	console.log ("i:"+i + " sx:" + sx + " sy:" + sy);
	
	dy = num_img_pixels / height;

	if (dy >= 0)
	{
		for (h = 0; h < num_img_pixels; h += dy)
		{
			idx = img_byte_offset + (img_width_bytes * Math.floor (h));

			if (raw_img_data[idx+3] != 0)
			{
				d.data[i+0] = raw_img_data[idx+0];
				d.data[i+1] = raw_img_data[idx+1];
				d.data[i+2] = raw_img_data[idx+2];
			}

			i += this.canvas.width * 4;
		}
	}
	else
	{
	/*
//		console.log ("iw:" + img_width + " dx:" + dx);
		dx = -dx;
		for (w = 0; w < img_width; w += dx)
		{
			idx = img_offset + ((img_width*4)- 4) - (4*Math.floor (w));
//			idx = img_offset + (img_width*4) - (4*Math.floor (w));

			if (raw_img_data[idx+3] != 0)
			{
				d.data[i+0] = raw_img_data[idx+0];
				d.data[i+1] = raw_img_data[idx+1];
				d.data[i+2] = raw_img_data[idx+2];
			}
			i += 4;
		}
*/
	}
}


ScrBuffer.prototype.ScaledImgLine = function (sx0,sy0, sx1,sy1,
								tx0,ty0,tx1,ty1,
								raw_img_data,
								raw_img_offset,
								raw_img_width,
								raw_img_height)
{
	// ** UNDER CONSTRUCTION **
	// doing general purpose image line drawing routine, which is a
	// simplified texture mapping routine. Done this way to accomodate
	// a variety of visual fx with minimal code overhead (hopefully)
	
	// (sx0,sy0)->(sx1,sy1) = line start and end coordinates
	// (tx0,ty0)->(tx1,ty1) = texture start and end coordinates

	var d;
	var i;
	var dx;
	var dy;
	var dtx;
	var dty;
	var e;
	var incx;
	var incy;
	var inctx;
	var incty;
	
	dx = sx1 - sx0;
	dy = sy1 - sy0;
	incx = 1;
	if (dx < 0) { incx = -1; }
	incy = 1;
	if (dy < 0)	{ incy = -1; }
	
	
	if (num_img_pixels < 1)	return;
	
	d = this.screenImgData;
	i = (4*sx) + (4 * this.canvas.width * sy);
//	console.log ("i:"+i + " sx:" + sx + " sy:" + sy);
	
	dx = num_img_pixels / height;

	if (dx >= 0)
	{
		for (h = 0; h < num_img_pixels; h += dx)
		{
			idx = img_offset + (4*Math.floor (h));

			if (raw_img_data[idx+3] != 0)
			{
				d.data[i+0] = raw_img_data[idx+0];
				d.data[i+1] = raw_img_data[idx+1];
				d.data[i+2] = raw_img_data[idx+2];
			}
			i += 4;
		}
	}
	else
	{
/*
//		console.log ("iw:" + img_width + " dx:" + dx);
		dx = -dx;
		for (w = 0; w < img_width; w += dx)
		{
			idx = img_offset + ((img_width*4)- 4) - (4*Math.floor (w));
//			idx = img_offset + (img_width*4) - (4*Math.floor (w));

			if (raw_img_data[idx+3] != 0)
			{
				d.data[i+0] = raw_img_data[idx+0];
				d.data[i+1] = raw_img_data[idx+1];
				d.data[i+2] = raw_img_data[idx+2];
			}
			i += 4;
		}
*/
	}
}

ScrBuffer.prototype.drawScaledImage = function (sx,sy,sw,sh, tx,ty,tw,th, raw_img_data, img_width, img_height)
{
	// draws a scaled image using a section of the available image
	// e.g useful for packed bitmaps containing several animation frames 
	
	// img_width = width in pixels
	// img_height = height in pixels.
	
	// TO DO : VERTICAL CLIPPING.
	// (horizontal clipping appears to be working )

	var dx;
	var dy;
	
	var x;
	var y;
	var d;
	
	var h;
	var w;
	var i;
	
	var idx;
	
	var j;
	var k;
	
	var top;
	var bottom;
	var rhs;
	
	d = this.screenImgData;
	
	if ((sw<1)||(sh<1))	return;	// can't draw zero/-ve width images.
	
	dx = tw / sw;
	dy = th / sh;

	top = 0;
	bottom = this.height;
	rhs = this.width;

		// clip base rows to draw if off screen.
	h = sh;
//	if ((sy+sh) >= bottom)
	if ((sy+sh) > bottom)
	{
		h = sh - (sy+k-bottom);
	}
	
		// clip rhs
	w = sw;	
	if ((sx+sw) >= rhs)
	{
		w = sw - (sx + sw - rhs);
	}
	
		// clip lhs
	if (sx < 0)
	{
		sx = -sx;
		tx = tx + dx * sx;
		w -= sx;
		sx = 0;
	}

	for (k = 0; k < h; k++)
	{
		if ((sy+k)>=0)
		{
			i = (4*sx) + (4 * this.canvas.width * (sy+k));
			
			for (j = 0; j < w; j++)
			{
				if ((sx+j)>=0)
				{
					idx = (4*Math.floor(tx+(dx*j))) + (4 * img_width * Math.floor (ty+(dy*k)));
					if (raw_img_data[idx+3] != 0)
					{
						d.data[i+0] = raw_img_data[idx+0];
						d.data[i+1] = raw_img_data[idx+1];
						d.data[i+2] = raw_img_data[idx+2];
					}
					i += 4;
				}
			}
		}
	}
}




	// -------------------------------------------------
	//		Filled Polygon drawing stuff
	// -------------------------------------------------

function STRUCT_POLY_SPAN ()
{
	this.p = [];
}

STRUCT_POLY_SPAN.prototype.addPoint = function(x)
{
	var i;
	
	i = this.p.length;

	this.p[i] = x;
}

STRUCT_POLY_SPAN.prototype.sort = function()
{
	// sorts points into ascending order.
	// *bubble sort*(lazy!)

	var done;
	var a;
//	var b;
	var i;
	
	if (this.p.length < 1)	return;

	done = false;
	while (done == false)
	{
		done = true;
		for (i = 0; i < (this.p.length-1); i++)
		{
			if (this.p[i] > this.p[i+1])
			{
				a = this.p[i];
				this.p[i] = this.p[i+1];
				this.p[i+1] = a;
				done = false;
			}
		}
	}
}

STRUCT_POLY_SPAN.prototype.drawSpan = function (d, w,h, y, r,g,b)
{
	// d = data buffer for raw rgba values
	// w = width of buffer in pixels
	// h = height of buffer in pixels (used for clipping)
	// draws a span according to the following rules..
	// draws from left to right. if there are an odd number
	// of points, the right most point is discarded.
	// otherwise just draws lines between pairs of points.

	var left;
	var right;
	var k;
	var s;
	
	var row;
	
	if ((y < 0) || (y >= h))	return;
	
	row = 4 * w * y;
	
	for (k = 0; k < (this.p.length & 0xFFFE); k += 2)
	{
//		left = (4 * this.p[k]) + row;
//		right = (4 * this.p[k+1]) + row;

			// dont draw spans off screen, 
			// clip if line crosses a screen edge.
			// *requires testing*

		left = this.p[k];
		right = this.p[k+1];
		if (! ((right < 0) || (left > w)))		// dont process lines that are off the screen.
		{
			if (left < 0)	left = 0;
			if (right >= w)	right = w-1;
	
			left = row + (left * 4);
			right = row + (right * 4);
			for (s = left; s <= right; s += 4)
			{
				d[s+0] = r;		//	d.data[s+0] = r;
				d[s+1] = g;		//	d.data[s+1] = g;
				d[s+2] = b;		//	d.data[s+2] = b;
				d[s+3] = 255;
			}
		}
	}
}

function _polygon_AddSpanLine (span_list, first_y, x0,y0,x1,y1)
{
	var dx;
	var dy;
	var x;
	var y;
	var incy;
	var incx;
	var e;
	var idx;
	
	var x_start;
	var y_start;
	var x_end;
	var y_end;
	
	if (y0 == y1)	return;		// ignore horizontal spans.
	
	
	
		// arrange so that lines are drawn in the same direction
		// top to bottom (lowest to highest y).
//	if (gghhkk == 1)
//	{
//		console.log ("addspan firsty:" + first_y + " x0:" + x0 + " y0:" + y0 + " x1:" + x1 + " y1:" + y1);
//	}

	x_start = x0;
	y_start = y0;
	x_end = x1;
	y_end = y1;
	if (y0 > y1)
	{
		x_start = x1;
		y_start = y1;
		x_end = x0;
		y_end = y0;
	}
	
//	if (gghhkk == 1)
//	{
//		console.log ("y sorted: x_start:" + x_start + " y_start:" + y_start + 
//			" x_end:" + x_end + " y_end:" + y_end);
//			console.log ("---------------------");
//	}

	
	dx = x_end - x_start;
	incx = 1;
	if (dx < 0)
	{
		incx = -1;
		dx = x_start - x_end;
	}

	dy = y_end - y_start;		// always going down.
	incy = 1;

	if (dy >= dx)
	{
			// steep slope = easiest, as its just basic line algorithm.
		e = Math.floor (dy/2);		// to match line drawing code.
		x = x_start;
//		for (y = y_start; y <= y_end; y++)	// += incy)
		for (y = y_start; y < y_end; y++)	// += incy)
		{
			idx = y - first_y;

			span_list[idx].addPoint (x);
			e = e + dx;
			if (e >= dy)
			{
				e -= dy;
				x += incx;
			}
		}
	}
	else
	{
		// add slope < 45'
		// adding last (x,y) coordinate before changing y value ??
//		console.log ("slope < 45'" + x_start);
		e = 0;
		y = y_start;	//y0;
		idx = y - first_y;
//		span_list[idx].addPoint (x0);
		for (x = x_start; x != x_end; x += incx)
		{
			e = e + dy;
			if (e >= dx)
			{
				idx = y - first_y;
				span_list[idx].addPoint (x);
				e -= dx;
				y += incy;
			}
		}
		//idx = y1 - first_y;
//		span_list[idx].addPoint (x);
	}
}

//var llkj = 0;
ScrBuffer.prototype.drawPolygon = function (coord_array, r,g,b, filled)
{
	// draws a polygon given a set of (x,y) coordinates.
	// last coordinate is automatically connected to first point.
	// filled = true will draw a filled polygon. false = outline only.
	
	// 

	var i;
	var d;
	
	var k;
	
	var first_y;
	var last_y;
	var y;
	
	var _poly_SpanList;

	if (filled == false)
	{
		// just draw outline as a series of lines.
		for (i = 0; i < coord_array.length-2; i += 2)
		{
			this.drawLine (
				coord_array[i+0],
				coord_array[i+1],
				coord_array[i+2],
				coord_array[i+3],
				r,g,b);
		}
		this.drawLine (
			coord_array[0],
			coord_array[1],
			coord_array[i+0],
			coord_array[i+1],
			r,g,b);
		return;
	}

		// find vertical range.
	first_y = this.canvas.height;
	last_y = -1;
	for (k = 0; k < coord_array.length; k += 2)
	{
		if (coord_array[k+1] < first_y)	first_y = coord_array[k+1];
		if (coord_array[k+1] > last_y)	last_y = coord_array[k+1];
	}
	if ((last_y < 0) || (first_y >= this.canvas.height))
	{
		// off screen
		return;
	}
	
	first_y = Math.floor (first_y);	// must be an integer.
	last_y = Math.floor (last_y);
	
		// create span list structure
	_poly_SpanList = [];
	for (k = first_y; k <= last_y; k++)
	{
		_poly_SpanList[k-first_y] = new STRUCT_POLY_SPAN();
	}

		// add polygon edges to the span structure.
	x0 = Math.floor(coord_array[0]);
	y0 = Math.floor(coord_array[1]);
	for (k = 2; k < coord_array.length; k += 2)
	{
		x1 = Math.floor(coord_array[k+0]);
		y1 = Math.floor(coord_array[k+1]);

		// add span line (x0,y0,x1,y1)
		_polygon_AddSpanLine (_poly_SpanList, first_y, x0,y0,x1,y1);
		
		x0 = x1;
		y0 = y1;
	}
		// close shape
	x1 = Math.floor(coord_array[0]);
	y1 = Math.floor(coord_array[1]);

	_polygon_AddSpanLine (_poly_SpanList, first_y, x0,y0,x1,y1);

//	if (gghhkk == 1)
//	{
//		llkj++;
//		console.log ("unsorted span list");
//		console.log (_poly_SpanList);
//	}



	for (k = 0; k < _poly_SpanList.length; k ++)
	{
		_poly_SpanList[k].sort();
	}

	d = this.screenImgData;	

//	if (gghhkk == 1)
//	{
//		llkj++;
//		console.log ("sorted span list");
//		console.log (_poly_SpanList);
//	}


	// draw spans.
	for (y = first_y; y <= last_y; y++)
	{
		_poly_SpanList[y-first_y].drawSpan (d.data, cvs.width, cvs.height, y, r,g,b);
	}

	_poly_SpanList = null;
}

	// ------------------------------------
	//		---- global fx ----
	// ------------------------------------
	
var _fadeTable = [];
var _fadePcent = 2;
ScrBuffer.prototype.fade = function (pcent)
{
		// oldskool fade fx. Basically updates the pixel value
		// from a small table so the inner loop is just integer calculations.

	var i;
	var table;
	var d;

	if (pcent == 0)	return;

	if ((_fadeTable.length < 1) || (_fadePcent != pcent))
	{
		for (i = 0; i < 256; i++)
		{
			_fadeTable[i] = Math.floor (i - ((i*pcent)/100));
		}
		console.log (_fadeTable);
		_fadePcent = pcent;
	}
	
	d = this.screenImgData;
	for (i = 0; i < d.data.length; i += 4)
	{
		d.data[i+0] = _fadeTable [d.data[i+0]];
		d.data[i+1] = _fadeTable [d.data[i+1]];
		d.data[i+2] = _fadeTable [d.data[i+2]];
		d.data[i+3] = 255;	//_fadeTable [d.data[i+2]];
	}
}

ScrBuffer.prototype.copyToBuffer = function()
{
	// Copies the current screen to the internal screen copy buffer
	// for now, it works, probably needs optimising at some point.

	var d;
	var c;
	var i;

	d = this.screenImgData;
	c = this.screenCopy;

	for (i = 0; i < (4 * this.canvas.width * this.canvas.height); i += 4)
	{
		c.data[i+0] = d.data[i+0];
		c.data[i+1] = d.data[i+1];
		c.data[i+2] = d.data[i+2];
		c.data[i+3] = d.data[i+3];
	}
}

ScrBuffer.prototype.clearBuffer = function(r,g,b)
{
	var i;
	var c;

	c = this.screenCopy;

	for (i = 0; i < (4 * this.canvas.width * this.canvas.height); i += 4)
	{
		c.data[i+0] = r;
		c.data[i+1] = g;
		c.data[i+2] = b;
		c.data[i+3] = 255;
	}
}

ScrBuffer.prototype.blendBuffer = function (pcent)
{
	// blends current screen and copy buffer using a simple linear
	// blending formula.
	// formula:
	// x = pcent/100
	// pixel = (screen * (1-x)) + (buffer * x);
	
	var i;
	var s;
	var b;
	var x;
	var d;
	var c;
	var ox;

	x = pcent/100;
	ox = 1-x;
	
	d = this.screenImgData;
	c = this.screenCopy;

	for (i = 0; i < (4 * this.canvas.width * this.canvas.height); i += 4)
	{
		d.data[i+0] = (d.data[i+0]*ox) + (c.data[i+0]*x);
		d.data[i+1] = (d.data[i+1]*ox) + (c.data[i+1]*x);
		d.data[i+2] = (d.data[i+2]*ox) + (c.data[i+2]*x);
		d.data[i+3] = (d.data[i+3]*ox) + (c.data[i+3]*x);	// not sure if blending alpha channel will work.
	}
}





	// ---- some font-related drawing code goes here.
	
ScrBuffer.prototype.drawAlphaImage = function (sx,sy,sw,sh, tx,ty,tw,th, raw_img_data, img_width, img_height)
{
	// pixels that are not completely opaque are drawn using the 
	// alpha pixel drawing code. Hopefully this will help with blending
	// for font based images.

	// draws a scaled image using a section of the available image
	// e.g useful for packed bitmaps containing several animation frames 
	
	// img_width = width in pixels
	// img_height = height in pixels.
	
	// TO DO : VERTICAL CLIPPING.
	// (horizontal clipping appears to be working )

	var dx;
	var dy;
	
	var x;
	var y;
	var d;
	
	var h;
	var w;
	var i;
	
	var idx;
	
	var j;
	var k;
	
	var top;
	var bottom;
	var rhs;
	
	d = this.screenImgData;
	
	if ((sw<1)||(sh<1))	return;	// can't draw zero/-ve width images.
	
	dx = tw / sw;
	dy = th / sh;

	top = 0;
	bottom = this.height;
	rhs = this.width;

		// clip base rows to draw if off screen.
	h = sh;
//	if ((sy+sh) >= bottom)
	if ((sy+sh) > bottom)
	{
		h = sh - (sy+k-bottom);
	}
	
		// clip rhs
	w = sw;	
	if ((sx+sw) >= rhs)
	{
		w = sw - (sx + sw - rhs);
	}
	
		// clip lhs
	if (sx < 0)
	{
		sx = -sx;
		tx = tx + dx * sx;
		w -= sx;
		sx = 0;
	}

	for (k = 0; k < h; k++)
	{
		if ((sy+k)>=0)
		{
			i = (4*sx) + (4 * this.canvas.width * (sy+k));
			
			for (j = 0; j < w; j++)
			{
				if ((sx+j)>=0)
				{
					idx = (4*Math.floor(tx+(dx*j))) + (4 * img_width * Math.floor (ty+(dy*k)));
					if (raw_img_data[idx+3] != 0)
					{
						if (raw_img_data[idx+3] == 255)
						{
							d.data[i+0] = raw_img_data[idx+0];
							d.data[i+1] = raw_img_data[idx+1];
							d.data[i+2] = raw_img_data[idx+2];
						}
						else
						{
							// draw alpha pixel
							this.alphaSetPixel (sx+j, sy+k,
									raw_img_data[idx+0],
									raw_img_data[idx+1],
									raw_img_data[idx+2],
									raw_img_data[idx+3]);	//;red,green,blue,alpha)

						}
					}
					i += 4;
				}
			}
		}
	}
}



