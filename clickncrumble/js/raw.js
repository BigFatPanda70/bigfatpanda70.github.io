/*
	Title	:	Raw Image File Loading

	Info	:	Version 0.0	29th May 2023

	Author	:	Nick Fleming

	Updated	:	29th May 2023

	 Notes:
	--------
		It's a bit of a no brainer..  Even when storing png files 
	as base64 encoded images they take up way less space than the raw
	data equivelent.

		And since bandwidth is a finite resource.. smaller is definitely
	better when you are paying for your data.

		But.. I still need to be able to use the raw image data for 
	speed & processing, so this file just loads the data and converts
	it to the 'raw' data format and *stores* it.
	
	raw format:
		header block.
			index		description
			0			version number (currently 0)
			1			width in pixels
			2			height in pixels
			3			reserved.
		data area:
			r,g,b,a data for each pixel of the image - all uncompressed.


	 onload Callback
	------------------
		I've added a custom data attribute to the image data so that
	when the onload callback completes it can find its own object
	in the _RawImageList and create the raw data version of itself.

		I couldn't think of a cleaner way to do this (avoids a lot
	of convoluted code solutions!!) - not that this is easy to follow
	anyway !!

		To Use:
	--------------
	
		1. Call LoadImageData for every image you want to use
		
		2. This will trigger _RawImageLoaded when the data is available.
			_RawImageLoaded handles converting the image data to raw
			rgba data by creating a temporary canvas, drawing to it
			and then extracting the data to an array.
		
		3. Call RawDrawImage to draw the image. Images that are still
			 in the process of loading will not be drawn.


*/

var _RawImageList = [];


function RAW_IMAGE_STRUCT (id, filename)
{
	this.id = id;
	this.img = new Image();
	this.img.onload = _RawImageLoaded;
	this.img.src = filename;
	this.img.myData = id;			// custom data attribute so it can find itself after onload completes :-)
	this.width;
	this.height;
	this.data;			// raw data from a canvas element.
}


function _RawImageLoaded (e)
{
	var c;
	var x;
	var img;

//	console.log ("_RawImageLoaded");
//	console.log ("e:");
//	console.log (e);
//	console.log ("this:");
//	console.log (this);
	
	img = _RawImageList[this.myData];
	
	img.width = this.width;
	img.height = this.height;

		// create a canvas, get a context to it and draw the image into the canvas.
	c = document.createElement("canvas");
	c.width = this.width;
	c.height= this.height;
	x = c.getContext("2d");
	x.drawImage(this,0,0);

	img.data = x.getImageData (0,0,img.width, img.height);
	
	x = null;		// release data
	c = null;		// release data.
}

function LoadImageData (filename)
{
	// 
	var i;
	var id;

	i = _RawImageList.length;
	
	id = i;	//42;
	_RawImageList[i] = new RAW_IMAGE_STRUCT (id, filename);

	return i;
}

function RawDrawImage (scrbuffer, img_id, sx, sy)
{
	var img;
	
	img = _RawImageList[img_id];
	
	if (img.data == undefined)	return;		// don't draw undefined images !!

	scrbuffer.drawImgA (sx, sy, img.width, img.height, img.data.data);
}

function Raw_GetImageData (img_id)
{
	var img;

	img = _RawImageList[img_id];
	
	if (img.data == undefined)	return null;
	
	return img;
}
