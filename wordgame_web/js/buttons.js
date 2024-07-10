/*

	Title	:	Buttons

	Info	:	Version 2.0 10th July 2024

	Author	:	Nick Fleming

	Updated	:	10th July 2024

	 Notes:
	--------

	Utilising callbacks a little more to try and make this useful file
	a bit more portable between games.

	two main structures:

	BUTTON_STRUCT (id, type, data, x,y,w,h, callback, drawing_function)
		- for each button

	BUTTON_SET 
		- for each set of buttons. usually one per screen state.



*/

var BUTTON_TYPE_TEXT = 1;
var BUTTON_TYPE_IMAGE = 2;

/*

//var BUTTON_STYLE_SQUARE = 1;
//var BUTTON_STYLE_ROUNDED = 2;
//var BUTTON_STYLE_ANGLED = 3;

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
*/

function BUTTON_STRUCT (button_id, button_type, button_data, x, y, width, height, callback, drawing_function)
{
	// for text buttons, button_data is the text for the button.

	this.button_id = button_id;
	
//	console.log ("bid:" + button_id);
	
	this.button_type = button_type;
	
	this.button_data = button_data;
	
//	this.button_style = BUTTON_STYLE_SQUARE;	// default
//	this.button_style = BUTTON_STYLE_ROUNDED;
//	this.button_style = BUTTON_STYLE_ANGLED;

//	this.highlight = false;		// true = display highlights.

	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;

//	this.r = 224;
//	this.g = 224;
//	this.b = 224;

	this.text = button_data;
	this.callback = callback;					// not yet used
	this.drawing_function = drawing_function;					// not yet used

//	this.tabstop = false;
}

BUTTON_STRUCT.prototype.hCenter = function (screen_width)
{
	this.x = Math.floor ((screen_width - this.width) / 2);
}

BUTTON_STRUCT.prototype.vCenter = function (screen_height)
{
	this.y = Math.floor ((screen_width - this.height) / 2);
}

BUTTON_STRUCT.prototype.style = function (style_code)
{
	this.button_style = style_code;
}

/*
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
*/


function _default_drawButton (button)
{
	console.log ("TO DO ");
}



/*
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
}
*/

	// ***********************************************
	//			**** BUTTON MENU STUFF ****
	// ***********************************************

function BUTTON_SET_STRUCT ()
{
	this.button_list = [];
}

BUTTON_SET_STRUCT.prototype.addButton = function (
			button_id, 
			button_type, 
			button_data, 
			x,
			y,
			width,
			height,
			callback,
			drawing_fn)
{
	var i;
	
	i = this.button_list.length;
	
	this.button_list[i] = new BUTTON_STRUCT (
				button_id, 
				button_type,
				button_data,
				x,
				y,
				width,
				height,
				callback,
				drawing_fn);

}

BUTTON_SET_STRUCT.prototype.getButtonIdx = function (button_id)
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

/*
BUTTON_SET_STRUCT.prototype.style = function (button_id, style_code)
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
*/

BUTTON_SET_STRUCT.prototype.getButtonIdFromPointer = function (mouse_x, mouse_y)
{
	// checks menu and returns id of button if pointer  is within
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

BUTTON_SET_STRUCT.prototype.draw = function ()
{
	var i;

	for (i = 0; i < this.button_list.length; i++)
	{
		if (this.button_list[i].drawing_function)
		{
			this.button_list[i].drawing_function (this.button_list[i]);
		}
		else
		{
			// default button drawing.
			_default_drawButton (this.button_list[i]);
		}
	}
}
/*
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
*/


