/*
	14th May 2023

	Just a useful little line drawing tool.

*/

function DrawPixel (d,w,h, x,y, r,g,b,alpha)
{
	var i;
	var ab;
	var a0;
	var a;

	if ((x<0) || (y<0) || (x>=w) || (y>=h))
	{
		return;
	}

	i = (4 * x) + (4 * w * y);
	
	if (a == 255)
	{
		d.data[i+0] = r;
		d.data[i+1] = g;
		d.data[i+2] = b;
		d.data[i+3] = a;
		return;
	}

		// alpha blending

	a = alpha / 255;
	ab = d.data[i+3] / 255;					// need range to be [0..1]

	a0 = a + (ab*(1-a));

	if (a0 != 0)
	{
		d.data[i+0] = ((r*a) + ((d.data[i+0]*ab)*(1-a))) / a0;
		d.data[i+1] = ((g*a) + ((d.data[i+1]*ab)*(1-a))) / a0;
		d.data[i+2] = ((b*a) + ((d.data[i+2]*ab)*(1-a))) / a0;
	}
}

function DrawLine (d,w,h, x0,y0, x1,y1, r0,g0,b0,a0, r1,g1,b1,a1)
{
		// d = uint8 image data
		// (w,h) = size of image.

	var dx;
	var dy;
	
	var incx;
	var incy;

	var incr;
	var incg;
	var incb;
	var inca;
	
	var e;
	
	var px;
	var py;
	var pr;
	var pg;
	var pb;
	var pa;
	
	dx = x1 - x0;
	incx = 1;
	if (dx < 0)
	{
		incx = -1;
		dx = x0 - x1;
	}

	dy = y1 - y0;
	incy = 1;
	if (dy < 0)
	{
		incy = -1;
		dy = y0 - y1;
	}

	if ((dx|dy) == 0)
	{
		return;
	}

	px = x0;
	py = y0;
	pr = r0;
	pg = g0;
	pb = b0;
	pa = a0;

	if (dx > dy)
	{
		incr = (r1-r0) / dx;
		incg = (g1-g0) / dx;
		incb = (b1-b0) / dx;
		inca = (a1-a0) / dx;
		
		e = 0;	//dx/2;
		while (px != x1)
		{
			DrawPixel (d,w,h, px,py, pr,pg,pb,pa);
			
			pr += incr;
			pg += incg;
			pb += incb;
			pa += inca;

			px += incx;
			
			e += dy;
			if (e >= dx)
			{
				e -= dx;
				py += incy;
			}
		}
	}	
	else
	{
		incr = (r1-r0) / dy;
		incg = (g1-g0) / dy;
		incb = (b1-b0) / dy;
		inca = (a1-a0) / dy;

//		console.log ("incx:" + incx);
		e = 0;	//dy/2;
		while (py != y1)
		{
			DrawPixel (d,w,h, px,py, pr,pg,pb,pa);
			
			pr += incr;
			pg += incg;
			pb += incb;
			pa += inca;

			py += incy;
			
			e += dx;
			if (e >= dy)
			{
				e -= dy;
				px += incx;
			}
		}
	}	
		
}
