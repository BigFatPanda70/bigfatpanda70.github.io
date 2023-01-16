/* ---------------------------------------------------------------

	Title	:	Z-sort Draw List
	
	Info	:	Version 0.0	4th September 2019
	
	Author:	Nick Fleming
	
	Updated:	5th September 2019
	
	 Notes:
	--------
	
		Creates a draw list of objects, based on their z value.
	done this way for those (rare) occasions when a z buffer is unavailable.

	
		5th September 2019
	-----------------------
	
	looking at a way to convert z value to bucket value to hopefully
	reduce sorting time.

				z
	znear---------------zfar
				^
				b
				
	z = znear + (((zfar-znear)/maxb)*b)

	z - znear = a*b/m
	
	(z - znear) * maxb = (zfar-znear) * b
	
	b = (z-znear) * maxb / (zfar - znear)

	b = int (b);


		so.. above calculation converts z to bucket value for visible z range.
	
	draw list seems to work, also added backface culling to reduce the amount
	of comparisons the draw list has to do. performance isn't too shabby, even
	for javascript.
	
	Note that backface culling is a helper routine to be called by the app - it isn't used
	directly in the draw list code.

----------------------------------------------------------------- */

var DRAWLIST_INVALID_INDEX = -1;

var ddd = 1;

function DrawList_BackfaceCullCheck (x0,y0,x1,y1,x2,y2)
{
	// this can determin whether a triangle is front or back facing.
	// pinched from https://cboard.cprogramming.com/game-programming/1057-backface-culling-lesson10-nehegl-tutorials.html
	
	var z=((x1-x0)*(y2-y0)) - ((y1-y0)*(x2-x0));
	return z; 
}

function DrawListItem(data, zidx)
{
	this.data = data.slice();	// creates a new copy of data.
	this.zindex = zidx;
	this.previous_idx = null;
	this.next_idx = null;
}

function DrawList(zmin, zmax)
{
	this.draw_list = [];
	this.new_id = 0;
	this.zmin = zmin;
	this.zmax = zmax;


	this.zmin = 0;
	this.max_buckets = 1024;
	this.bucket_list = [this.max_buckets];
}

DrawList.prototype.clear = function()
{
	for (lp = 0; lp < this.max_buckets; lp++)
	{
		this.bucket_list[lp] = DRAWLIST_INVALID_INDEX;
	}
}

var dldldld = 1;
DrawList.prototype.addItem = function (data, z)
{
		// pass raw z data to addItem
		
	var idx;
	var i;
	var b;		// bucket index
	
	if ((z < this.zmin) || (z > this.zmax))
	{
		// z value is outside range, so don't try to add.
		// perhaps could just z sort anyway, using end buckets ?? 
		// return;
	}

	b = ((z - this.zmin) * this.max_buckets) / (this.zmax - this.zmin);
	b = Math.floor(b);
	
	if ((b < 0) || (b >= this.max_buckets))
	{
			// should never get here if everything is working.
			
		if ( dldldld == 1)
		{
			console.log ("drawlist.prototype.addItem: b is outside bucket range");
			console.log ("Z : " + z + " B " + b);
		
			 dldldld = 0;
		}
		return;
	}

	if (this.bucket_list[b] == DRAWLIST_INVALID_INDEX)
	{
			// unused bucket, so just add to draw list
		idx = this.draw_list.length;
		this.bucket_list[b] = idx;
		this.draw_list[idx] = new DrawListItem (data, z);
		this.draw_list[idx].previous_idx = DRAWLIST_INVALID_INDEX;
		this.draw_list[idx].next_idx = DRAWLIST_INVALID_INDEX;
		return;
	}
	
	// bucket is used, so need to insert sort into this z list.
	// z values are sorted largest first to smallest (i.e. in required drawing order)
	
	i = this.bucket_list[b];		// get draw list index of first item in z list

		if ((i < 0) || (i >= this.draw_list.length))
		{
			console.log ("first i out of range");
		}

		// this is the bottle neck for large numbers of items with a similar z value.
		
	while (z < this.draw_list[i].zindex)
	{
		if (this.draw_list[i].next_idx == DRAWLIST_INVALID_INDEX)
		{
			// reached the end of the list, so just add item.
			idx = this.draw_list.length;
			this.draw_list[i].next_idx = idx;

			this.draw_list[idx] = new DrawListItem (data, z);
			this.draw_list[idx].previous_idx = i;
			this.draw_list[idx].next_idx = DRAWLIST_INVALID_INDEX;
 
			return;
		}
		i = this.draw_list[i].next_idx;
		
		if ((i < 0) || (i >= this.draw_list.length))
		{
			console.log ("i out of range");
		}
	}
	
	// z >= current item, so insert before it.
	idx = this.draw_list.length;
	this.draw_list[idx] = new DrawListItem (data, z);
	this.draw_list[idx].previous_idx = this.draw_list[i].previous_idx;
	this.draw_list[idx].next_idx = i;

	this.draw_list[i].previous_idx = idx;

	if (this.draw_list[idx].previous_idx == DRAWLIST_INVALID_INDEX)
	{
		// new item is at start of list, so update bucket list.
		this.bucket_list[b] = idx;
	}
	else
	{
		// update previous z item
		this.draw_list[this.draw_list[idx].previous_idx].next_idx = idx;
	}
}

DrawList.prototype.generateList = function (draw_list_array)
{
		// generate a list of data, based on current draw list structure.

	var n;
	var i;
	var d;
	
	d = 0;	
	for (n = this.max_buckets-1; n >= 0; n--)
	{
		if (this.bucket_list[n] != DRAWLIST_INVALID_INDEX)
		{
			i = this.bucket_list[n];
			while (i != DRAWLIST_INVALID_INDEX)
			{
				draw_list_array[d++] = this.draw_list[i].data;
				i = this.draw_list[i].next_idx;
			}
		}
	}
	
	ddd = 0;
}

