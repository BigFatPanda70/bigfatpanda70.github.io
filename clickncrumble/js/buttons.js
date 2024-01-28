/*

	Title	:	Buttons

	Info	:	Version 0.0 15th May 2023

	Author	:	Nick Fleming

	Updated	:	5th January 2024

	 Notes:
	--------

	Which is the better design, a callback per button or a single
	callback to process all button events.

	callback per button
		- no need to store a button id.
		- each button has to handle its own logic & drawing 
		- need logic to detect context (e.g. ok button used multiple times).

	callback to button array handler@
		- need to store button id
		- common button drawing code
		- logic centrally controlled
		- single event required to handle all buttons.
		- consistent behaviour for ever interaction.



	 29th May 2023
	----------------
		All the buttons work the same, so this code should handle
	*all* button stuff, no exceptions!

	Im going to break a *lot* of code today to improve stuff.

	added button type to the button structure so I can handle both
	text and graphic based buttons.


	 30th May 2023
	----------------

	 When to acknowledge a click ? Mouse down or Mouse Up
	 
	 For push buttons, the callback should occur on a Mouse Up event.
	
	 (This seems to be standard behaviour across browsers).
	


	 30th June 2023
	-----------------
		Getting this working, so it can be used for different projects.
	
	 4th January 2024
	-------------------
		Fixed angled button drawing issues (hopefully).
*/

var BUTTON_TYPE_TEXT = 1;
var BUTTON_TYPE_ICON = 2;

var BUTTON_STYLE_SQUARE = 1;
var BUTTON_STYLE_ROUNDED = 2;
var BUTTON_STYLE_ANGLED = 3;

var _button_Curve8x8 = 
[
	// data = offset from lhs for each row of 8x8 square for 1/4 circle
	5,
	3,
	2,
	1,
	1,
	0,
	0,
	0
];

function STRUCT_BUTTON (button_id, button_type, button_data, x, y, width, height)
{
	this.button_id = button_id;
	
	console.log ("bid:" + button_id);
	
	this.button_type = button_type;
	
	this.button_data = button_data;		// ??? 
	
	this.button_style = BUTTON_STYLE_SQUARE;	// default
//	this.button_style = BUTTON_STYLE_ROUNDED;
	this.button_style = BUTTON_STYLE_ANGLED;

	this.highlight = false;		// true = display highlights.

	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;

	this.r = 224;
	this.g = 224;
	this.b = 224;

	this.text = button_data;
//	this.callback = callback;
	this.tabstop = false;
}

STRUCT_BUTTON.prototype.hCenter = function (screen_width)
{
	this.x = Math.floor ((screen_width - this.width) / 2);
}

STRUCT_BUTTON.prototype.vCenter = function (screen_height)
{
	this.y = Math.floor ((screen_width - this.height) / 2);
}

STRUCT_BUTTON.prototype.style = function (style_code)
{
	this.button_style = style_code;
}

function _button_DrawCurve8x8 (scr,cx,cy,r,g,b,flip,mirror)
{
	// draws an 8x8 filled curve centered on cx,cy.
	// r,g,b = colour to fill with.
	// flip = true =  flip along horizontal x axis
	// mirror = true = mirror along vertical y axis.
	
	var n;
	var k;
	var x0;
	var x1;
	var y;
	
	k = 8;

	y = cy - k + 1
	for (n = 0; n < _button_Curve8x8.length; n++)
	{
		x0 = cx - k +1 + _button_Curve8x8[n];
		x1 = cx;
		if (mirror == true)
		{
			x0 = cx;
			x1 = x0 + k - _button_Curve8x8[n] - 1;
		}
		if (flip == true)
		{
			y = cy + k - n - 1;
		}
		Scr.drawLine (x0,y,x1,y,r,g,b);
		y++;
	}
}

function DrawButton (scr, button)	//x0,y0,w,h, r,g,b)
{
	// draws a button, depending on its style . with rounded corners.
	// note (button has to be at least 16x16 pixels in size

	var h;
	var k;
	var s;
	var x;
	var y;
	var w;
	var lh;
	var r;
	var g;
	var b;

	var plist;

	x = button.x;
	y = button.y;
	w = button.width;
	h = button.height;
	r = button.r;
	g = button.g;
	b = button.b;

	lh = Math.floor (h/2);

	switch (button.button_style)
	{
		case BUTTON_STYLE_ROUNDED:
			s = 4;
			k = 8;
			
			scr.FastAlphaRect (x+k,y+h, w-k,s, 0,0,0);
			scr.FastAlphaRect (x+w,y+k, s,h-k, 0,0,0);
			scr.FastAlphaRect (x+w-s-1,y+h-s-1, s+1,s+1, 0,0,0);
			scr.FastAlphaRect (x+w,y+h, s-2,s-2, 0,0,0);
			scr.FastAlphaRect (x+k-2,y+h, 2,2, 0,0,0);
			scr.FastAlphaRect (x+w,y+k-2, 2,2, 0,0,0);

			_button_DrawCurve8x8 (scr, x+k-1, y + k-1, r,g,b, false, false);
			_button_DrawCurve8x8 (scr, x+w-k, y + k-1, r,g,b, false, true);
			_button_DrawCurve8x8 (scr, x+k-1, y + h - k, r,g,b, true, false);
			_button_DrawCurve8x8 (scr, x+w-k, y + h - k, r,g,b, true, true);

			scr.drawRect (x+k,y, w-k-k,k, r,g,b);
			scr.drawRect (x,y+k, w,h-k-k, r,g,b);
			scr.drawRect (x+k,y+h-k, w-k-k,k, r,g,b);

			break;

		case BUTTON_STYLE_ANGLED:
				// polygon and possibly line drawing not drawing 
				// right for certain cases.
		
			plist = [];
			plist[0] = x;
			plist[1] = y + lh;	//-1;
			plist[2] = x + lh;	//-1;
			plist[3] = y;
			plist[4] = x + w - lh;
			plist[5] = y;
			plist[6] = x + w;	// - 1;
			plist[7] = y + lh;	// -1;
			scr.drawPolygon (plist, r,g,b, true);
			
			scr.drawLine (plist[0],plist[1],plist[2],plist[3]);
			scr.drawLine (plist[2],plist[3],plist[4],plist[5]);
			scr.drawLine (plist[4],plist[5],plist[6],plist[7]);

//			scr.setPixel (plist[0],plist[1], 255,0,0);
//			scr.setPixel (plist[2],plist[3], 255,255,255);
//			scr.setPixel (plist[4],plist[5], 255,255,255);
//			scr.setPixel (plist[6],plist[7], 255,255,255);

			r = Math.floor (r * 0.90);
			g = Math.floor (g * 0.90);
			b = Math.floor (b * 0.90);
			plist[0] = x;
			plist[1] = y + lh;
			plist[2] = x + lh;
			plist[3] = y + h-1;
			plist[4] = x + w - lh;	//-1;
			plist[5] = y + h - 1;
			plist[6] = x + w;	// - 1;
			plist[7] = y + lh ;
			scr.drawPolygon (plist, r,g,b, true);
			
			r = 0; g = 0; b = 0;
			scr.drawLine (plist[0],plist[1],plist[2],plist[3]);
			scr.drawLine (plist[2],plist[3],plist[4],plist[5]);
			scr.drawLine (plist[4],plist[5],plist[6],plist[7]);


//			scr.setPixel (plist[0],plist[1], 0,255,0);
//			scr.setPixel (plist[2],plist[3], 0,255,0);
//			scr.setPixel (plist[4],plist[5], 0,255,0);
//			scr.setPixel (plist[6],plist[7], 0,255,0);


//			scr.drawLine (x+lh-1, y, x+w-lh-1,y);
//			scr.drawLine (x+lh-1, y+h-1, x+w-lh-1,y+h-1);

//			scr.drawLine (x, y+lh-1, x+lh-1,y);
//			scr.drawLine (x, y+lh-1, x+lh-1,y+h-1);
//			scr.drawLine (x+w-lh-1, y, x+w-2,y+lh-1);
//			scr.drawLine (x+w-lh-1, y+h-1, x+w-1,y+lh);

			break;

		case BUTTON_STYLE_SQUARE:
		default:
				// basic white button
			scr.drawRect (x, y, w, h, r,g,b);

			scr.FastAlphaRect (x,y+h-lh,w, lh, 0,0,0);

				// use drawRect for fast straight lines.
			scr.drawRect (x + 2, y + 2, w-4, 1, 0,0,0);
			scr.drawRect (x + 2, y + h - 3,	w - 4, 1, 0,0,0);
			scr.drawRect (x + 2, y+2, 1, h - 4, 1, 0,0,0);
			scr.drawRect (x + w - 3, y+2, 1, h-4, 1, 0,0,0);
			break;
	}

/*
	s = 4;
	
	k = 8;

	scr.FastAlphaRect (x0+k,y0+h, w-k,s, 0,0,0);
	scr.FastAlphaRect (x0+w,y0+k, s,h-k, 0,0,0);
	scr.FastAlphaRect (x0+w-s-1,y0+h-s-1, s+1,s+1, 0,0,0);
	scr.FastAlphaRect (x0+w,y0+h, s-2,s-2, 0,0,0);

	scr.FastAlphaRect (x0+k-2,y0+h, 2,2, 0,0,0);
	scr.FastAlphaRect (x0+w,y0+k-2, 2,2, 0,0,0);

	scr.drawRect (x0+k,y0, w-k-k,k, r,g,b);
	scr.drawRect (x0,y0+k, w,h-k-k, r,g,b);
	scr.drawRect (x0+k,y0+h-k, w-k-k,k, r,g,b);

	_button_DrawCurve8x8 (scr, x0+k-1, y0 + k-1, r,g,b, false, false);
	_button_DrawCurve8x8 (scr, x0+w-k, y0 + k-1, r,g,b, false, true);
	_button_DrawCurve8x8 (scr, x0+k-1, y0 + h - k, r,g,b, true, false);
	_button_DrawCurve8x8 (scr, x0+w-k, y0 + h - k, r,g,b, true, true);
*/
}


/*
function DrawButton (scr_buffer, sx,sy,w,h, red,green,blue)
{
		// rounded corners, gradient background.
		
		// (sx,sy) = screen coords
		// w,h = size of button to draw
		// red,green,blue = top row colour.

	var y;
	var d;
	var sw;
	var sh;
	var r;
	var g;
	var b;

	var shadow_offset;
	
	var lp;

	shadow_offset = 4;
	d = scr_buffer.screenImgData;
	sw = scr_buffer.canvas.width,
	sh = scr_buffer.canvas.height;

	FastAlphaRect (sx+w,sy+shadow_offset, shadow_offset-1,1, 0,0,0);
	FastAlphaRect (sx+w,sy+shadow_offset+1, shadow_offset,h-shadow_offset-2, 0,0,0);

	FastAlphaRect (sx+shadow_offset+1,sy+h-1, w-2,shadow_offset, 0,0,0);
	FastAlphaRect (sx+shadow_offset,sy+h-1, 1,shadow_offset-1, 0,0,0);
	FastAlphaRect (sx+shadow_offset+w-1,sy+h-1, 1,shadow_offset-1, 0,0,0);

//	FastAlphaRect (sx+shadow_offset,sy+h-1, w,shadow_offset, 0,0,0);
//	FastAlphaRect (sx+w,sy+shadow_offset, shadow_offset,h-shadow_offset-1, 0,0,0);

		// draw rectangle with gradient fill so that bottom row is
		// about 25% darker than the top.

	for (lp = 1; lp < h-1; lp++)
	{
		r = red - Math.floor (lp/h * (red/4));
		g = green - Math.floor (lp/h * (green/4));
		b = blue- Math.floor (lp/h * (blue/4));
		
		Scr.drawRect (sx, sy+lp, w,1, r,g,b);
	}
	DrawLine (d, sw, sh, sx+1,sy,	sx+w-1,sy, r,g,b,255, r,g,b,255);
	DrawLine (d, sw, sh, sx+1,sy+h-1,	sx+w-1,sy+h-1, r,g,b,255, r,g,b,255);

	DrawLine (d, sw, sh, sx+1,sy,	sx+w-1,sy, 255,255,255,255, 255,255,255,128);
	DrawLine (d, sw, sh, sx,sy+1,	sx,sy+h-1, 255,255,255,255, 255,255,255,128);
	DrawLine (d, sw, sh, sx+1,sy+h-1,sx+w-1,sy+h-1, 128,128,128,128, 64,64,64,128);
	DrawLine (d, sw, sh, sx+w-1,sy+1,	sx+w-1,sy+h-1, 128,128,128,128, 64,64,64,128);

//	DrawLine (d, sw, sh, sx+1,sy,	sx+w-1,sy, 255,255,255,255, 255,255,255,128);
//	DrawLine (d, sw, sh, sx,sy,	sx,sy+h, 255,255,255,255, 255,255,255,128);
//	DrawLine (d, sw, sh, sx,sy+h-1,sx+w-1,sy+h-1, 128,128,128,128, 64,64,64,128);
//	DrawLine (d, sw, sh, sx+w-1,sy+1,	sx+w-1,sy+h, 128,128,128,128, 64,64,64,128);

	w -= 4;
	h -= 4;
//	DrawLine (d, sw, sh, sx+2,sy+2,	sx+2+w-1,sy+2, 255,255,255,255, 255,255,255,128);
//	DrawLine (d, sw, sh, sx+2,sy+h,	sx+2+w-1,sy+h, 255,255,255,255, 255,255,255,128);
}
*/

	// ***********************************************
	//			**** BUTTON MENU STUFF ****
	// ***********************************************

function STRUCT_BUTTON_MENU ()
{
	this.button_list = [];
}

STRUCT_BUTTON_MENU.prototype.addButton = function (
			button_id, 
			button_type, 
			button_data, 
			x,
			y,
			width,
			height)
{
	var i;
	
	i = this.button_list.length;
	
	this.button_list[i] = new STRUCT_BUTTON (
				button_id, 
				button_type,
				button_data,
				x,
				y,
				width,
				height);

}

STRUCT_BUTTON_MENU.prototype.getButtonIdx = function (button_id)
{
	var i;

	for (i = 0; i < this.button_list.length; i++)
	{
		if (this.button_list[i].button_id == button_id)
		{
			return i;
		}
	}

	return -1;
}

STRUCT_BUTTON_MENU.prototype.style = function (button_id, style_code)
{
	var idx;
	
	idx = this.getButtonIdx (button_id);
	if (idx == -1)
	{
		console.log ("button id " + button_id + " not found");
		return;
	}
	
	this.button_list[i].style(style_code);
}

STRUCT_BUTTON_MENU.prototype.getButtonId = function (mouse_x, mouse_y)
{
	// checks menu and returns id of button if mouse is within
	// click area.
	
	// returns null if not in button area.

	var i;
	var x0;
	var y0;
	var x1;
	var y1;
	
	for (i = 0; i < this.button_list.length; i++)
	{
		x0 = this.button_list[i].x;
		y0 = this.button_list[i].y; 

		x1 = x0 + this.button_list[i].width;
		y1 = y0 + this.button_list[i].height;
		
		if ((mouse_x >= x0) && (mouse_x < x1) &&
			(mouse_y >= y0) && (mouse_y < y1))
		{
			return this.button_list[i].button_id;
		}
	}
	return null;
}

STRUCT_BUTTON_MENU.prototype.draw = function (scr)
{
	var i;

	for (i = 0; i < this.button_list.length; i++)
	{
		DrawButton (scr, this.button_list[i]);
	}
}

STRUCT_BUTTON_MENU.prototype.setRGB = function (button_id, r,g,b)
{
	var i;
	
	i = this.getButtonIdx (button_id);
	if (i == -1)
	{
		return;
	}

	this.button_list[i].r = r;
	this.button_list[i].g = g;
	this.button_list[i].b = b;
}

BUTTON_ID_START
