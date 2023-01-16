/*

	Title	:	DrawList 2

	Info	:	Version 2.0	27th December 2022

	Author	:	Nick Fleming

	Updated	:	31st December 2022


	 Notes:
	--------
		The original version of this routine used .slice to create an
	internal copy of the data, which worked well, but just meant that
	a *lot* of data was moved around unneccessarily.

		This version just stores an index value in the list and
	bucket sorts the list on z value.

		- changed to a fixed size draw buffer for optimisation 
	purposes.


		notes from original version (5th September 2019)
	---------------------------------------------------------
	
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



	 27th December 2022
	---------------------
		Checking code.
	
	added num_draw_items to the draw list struct.. so I can reuse
	draw list items without having to reallocate them each time.


	 28th December 2022
	---------------------
	Reinstating .slice() as the draw list may be the only instance of
	the draw data that exists.

	 29th December 2022
	----------------------
		Setting limits on how big the draw list can get by changing to
	a static draw buffer. The goal is to move data around as little
	as possible.

	 31st December 2022
	--------------------
		Back to storing a single data item in this list, which is now
	just a huge sorting algorithm, and could probably be done much better.
*/

var DRAWLIST_INVALID_INDEX = -1;

var _drawlist_bucket_list_error = false;

function STRUCT_DRAW_LIST_ITEM (data, zidx)	//DrawListItem(data, zidx)
{
	this.data = data;
	this.zindex = zidx;
	this.previous_idx = null;
	this.next_idx = null;
}

function STRUCT_DRAW_LIST(zmin, zmax, num_buckets, max_items)
{
		// num_buckets -> the more buckets, the better the sort.
		// 1024 is a good number to start with.

	var i;

	this.draw_list = [];
	this.num_draw_items = 0;

	this.max_items = max_items;

	this.new_id = 0;
	this.zmin = zmin;
	this.zmax = zmax;
	this.z_range = (this.zmax - this.zmin);

	if (this.z_range == 0)
	{
		console.log ("** ERROR : *** draw list z range = 0");
		return;
	}

	this.zmin = 0;
	this.max_buckets = num_buckets;
	this.bucket_list = [this.max_buckets];
	
	for (i = 0; i < max_items; i++)
	{
		this.draw_list[i] = new STRUCT_DRAW_LIST_ITEM(0,0);
	}

	this.clear();
}

STRUCT_DRAW_LIST.prototype.clear = function()
{
	var lp;
	var item;

	for (lp = 0; lp < this.max_buckets; lp++)
	{
		this.bucket_list[lp] = DRAWLIST_INVALID_INDEX;
	}
	this.num_draw_items = 0;
}

STRUCT_DRAW_LIST.prototype.add = function (data, z)
{
	// returns an index to the item added so the calling routine
	// can decide how it wants to store the data.

		
	var idx;
	var i;
	var b;		// bucket index
	var k;
	
	if (this.num_draw_items == this.max_items)
	{
		return -1;		// draw buffer is full.
	}
	
	if ((z < this.zmin) || (z > this.zmax))
	{
		// z value is outside range, so don't try to add.
		// perhaps could just z sort anyway, using end buckets ?? 
		// return;
	}

	b = ((z - this.zmin) * this.max_buckets) / this.z_range;	//(this.zmax - this.zmin);
	b = Math.floor(b);
	
//	console.log ("b:" + b + " z:" + z);
	
	if ((b < 0) || (b >= this.max_buckets))
	{
			// should never get here if everything is working.
			
		if ( _drawlist_bucket_list_error == false)
		{
			console.log ("drawlist.prototype.addItem: b is outside bucket range");
			console.log ("Z : " + z + " B " + b);
		
			_drawlist_bucket_list_error = true;		// only report the error once.
		}
		return -1;	// error
	}
	
	if (this.bucket_list[b] == DRAWLIST_INVALID_INDEX)
	{
			// unused bucket, so just add to the draw list
		idx = this.num_draw_items;
//		console.log ("idx:" + idx);
		if (idx == this.draw_list.length)
		{
				// create new item if it doesn't exist already.
			this.draw_list[idx] = new STRUCT_DRAW_LIST_ITEM (data, z);
		}
		else
		{
				// otherwise reuse existing structure.
			this.draw_list[idx].data = data;	//.slice();
			this.draw_list[idx].zindex = z;
		}
		this.draw_list[idx].previous_idx = DRAWLIST_INVALID_INDEX;
		this.draw_list[idx].next_idx = DRAWLIST_INVALID_INDEX;

		this.bucket_list[b] = idx;

		this.num_draw_items++;
		return;
	}
	
	// bucket is used, so need to insert sort into this z list.
	// z values are sorted largest first to smallest (i.e. in required drawing order)
	
	i = this.bucket_list[b];		// get draw list index of first item in z list

	if ((i < 0) || (i >= this.draw_list.length))
	{
		console.log ("first i out of range");
		return;
	}

//	console.log ("first i:" + i);

		// this is a HUGE  bottle neck for large numbers of items
		// with a similar z value.
		
		// possible improvements :
		// store max and min values for the ends of the list
		// to avoid having to iterate through the list.
		// bucket structure could be updated to store this.
		
	while (z < this.draw_list[i].zindex)
	{
		if (this.draw_list[i].next_idx == DRAWLIST_INVALID_INDEX)
		{
			// reached the end of the list, so just add item.
			
			idx = this.num_draw_items;
			if (idx == this.draw_list.length)
			{
					// create new item if it doesn't exist already.
				this.draw_list[idx] = new STRUCT_DRAW_LIST_ITEM (data, z);
			}
			else
			{
					// otherwise reuse existing structure.
				this.draw_list[idx].data = data;	//.slice();
				this.draw_list[idx].zindex = z;
			}

			//idx = this.draw_list.length;
			this.draw_list[i].next_idx = idx;

			//this.draw_list[idx] = new DrawListItem (data, z);
			this.draw_list[idx].previous_idx = i;
			this.draw_list[idx].next_idx = DRAWLIST_INVALID_INDEX;
 
			this.num_draw_items++;
			return;
		}
		i = this.draw_list[i].next_idx;
//		console.log ("i:" + i);
		
		if ((i < 0) || (i >= this.draw_list.length))
		{
			console.log ("i out of range");
		}
	}
	
	// z >= current item, so insert before it.
//	idx = this.draw_list.length;
//	this.draw_list[idx] = new DrawListItem (data, z);

	idx = this.num_draw_items;
	if (idx == this.draw_list.length)
	{
			// create new item if it doesn't exist already.
		this.draw_list[idx] = new STRUCT_DRAW_LIST_ITEM(data, z);
	}
	else
	{
			// otherwise reuse existing structure.
		this.draw_list[idx].data = data;	//.slice();
		this.draw_list[idx].zindex = z;
	}

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

	this.num_draw_items++;
}

STRUCT_DRAW_LIST.prototype.generateList = function (draw_list_array)
{
	// generate a list of data, based on current draw list structure.
	// draw_list_array should be an empty array [].
	// it gets filled with the draw list data.

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
}
