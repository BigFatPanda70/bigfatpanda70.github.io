
function INK_STRUCT()		// ink object constructor
{
	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = 255;		// default.
	this.h = 0;
	this.s = 0;
	this.l = 0;
	this.v = 0;
	this.hex = "#000";
}

function RGBtoHue (red,green,blue)
{
	// returns hue in range [0..1]
	// common to both HSV and HSL.

	var r;
	var g;
	var b;
	var max;
	var min;
	var d;
	var h;
	
	r = red / 255;
	g = green / 255;
	b = blue / 255;

	max = Math.max(r, g, b);
	min = Math.min(r, g, b);
	d = max - min;
	
	if(max == min)
	{
		return 0;	 // achromatic
	}

	switch(max)
	{
		case r:
				h = ((g - b) / d);
				if (g < b) h += 6;
				break;
		case g:
				h = ((b - r) / d) + 2;
				break;
		case b:
				h = ((r - g) / d) + 4;
				break;
	}
	h /= 6;

	return h;
}

INK_STRUCT.prototype.RGBtoHSV = function ()
{
		// from wikipedia.

	var r;
	var g;
	var b;
	var max;
	var min;

	r = this.r;
	g = this.g;
	b = this.b;

	this.h = RGBtoHue (r,g,b);

	max = Math.max(r, g, b);
	min = Math.min(r, g, b);
	
	this.s = 0;				// max = 0 <-> r=g=b=0
	if (max != 0)
	{
		this.s = (max - min) / max;
	}
	
//	this.v = max;
	this.v = max/255;

}

INK_STRUCT.prototype.HSVtoRGB = function ()
{
	var r;
	var g;
	var b;
	
	var i;
	var f;
	var p;
	var q;
	var t;
	
	var v;
	
	// based on https://www.cs.rit.edu/~ncs/color/t_convert.html

	h = this.h;
	s = this.s;
	
	v = this.v;
	
	if (s == 0)
	{
		// achromatic (grey)
		this.r = Math.floor(v*255);
		this.g = Math.floor(v*255);
		this.b = Math.floor(v*255);
		return;
	}
	
//	h /= 60;			// sector 0 to 5
	h *= 6;
	i = Math.floor( h );
	f = h - i;			// factorial part of h
	p = v * ( 1 - s );
	q = v * ( 1 - s * f );
	t = v * ( 1 - s * ( 1 - f ) );

	switch( i )
	{
		case 0:	r = v;	g = t;	b = p;	break;
		case 1:	r = q;	g = v;	b = p;	break;
		case 2:	r = p;	g = v;	b = t;	break;
		case 3:	r = p;	g = q;	b = v;	break;
		case 4:	r = t;	g = p;	b = v;	break;
		default:		// case 5:
			r = v;	g = p;	b = q;	break;
	}
	
	this.r = Math.floor (r*255);
	this.g = Math.floor (g*255);
	this.b = Math.floor (b*255);
}

INK_STRUCT.prototype.RGBtoHex = function()
{
	// https://css-tricks.com/converting-color-spaces-in-javascript/
	
	var r;
	var g;
	var b;

	r = this.r.toString(16);
	g = this.g.toString(16);
	b = this.b.toString(16);
	
//	console.log ("r:" + r + " g:" + g + " b:" + b);

	if (r.length == 1)
	{
		r = "0" + r;
	}

	if (g.length == 1)
	{
		g = "0" + g;
	}

	if (b.length == 1)
	{
		b = "0" + b;
	}

	this.hex = "#" + r + g + b;		// hex value useful for canvas colour setting.
}

