/*

	Title	:	Bitmapped Font Loading routines

	Info	:	Version 0.0	21st January 2024

	Author	:	Nick Fleming

	Updated	:	22nd January 2024

	 Notes:
	---------

	Looking at various ways to implement bitmapped fonts, in this age
	of true type fonts and unicode glyphs that still makes some kind
	of sense.

	Handling every type of script available is frankly impossible given
	my limited resources, so just going to try and handle the common
	ascii extended (latin?) characters where possible.

	Also trying to decouple the font stuff from the text drawing code
	so that I can change fonts more easily, so I am sacrificing a little
	speed for more flexibility in the long run.


	 font image data
	------------------
		.. expected to be stored as a b64 encoded array and converted to
	a raw data format for use.


	 22nd January 2024
	--------------------
		Got the code working to load the data into a raw format. 
	It's a bit weird, as it assumes the data is loaded asynchronously,
	so you have to indirectly destroy the original image object from
	within the routine that generates the raw data. Like I said, its
	weird.


*/

function _bitmap_font_image_loaded (e)
{
	// gets called when the image data has been loaded.. now need
	// to convert the image data to a RAW format for drawing.
	
	// note : 'this' points to the image object itself.


//	console.log ("BITMAP_FONT_STRUCT.prototype._loaded");
//	console.log (e);

//	console.log ("e:");
//	console.log (e);
//	console.log ("this:");
//	console.log (this);
	
//	console.log ("parent:");
//	console.log (this.parent);
	
	var c;
	var x;
	
	c = document.createElement("canvas");
	c.width = this.width;
	c.height= this.height;
	x = c.getContext("2d");
	x.drawImage(this,0,0);

	this.parent.data = x.getImageData (0,0, this.width, this.height);
	this.parent.img_width = this.width;
	this.parent.img_height= this.height;

	x = null;		// release data
	c = null;		// release data.
	
	this.parent.img = null;		// will this work ???
}


function BITMAP_FONT_STRUCT (metrics_array, first_ch_idx, last_ch_idx, b64_img_data)
{
	var img;

	this.metrics = metrics_array;
	this.first_idx = first_ch_idx;
	this.last_idx = last_ch_idx;
	
	this.img = new Image();
	this.img.onload = _bitmap_font_image_loaded;
	this.img.src = b64_img_data;
	this.img.parent = this;			
	
	this.img_width = null;
	this.img_height = null;
	this.data = null;
}

