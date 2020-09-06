/*

	Title	:	WebGL wrapper routines.

	Info	:	Version 0.2	24th August 2020

	Author	:	Nick Fleming

	Updated	:	24th August 2020


	 Notes:
	--------
			** 
		Lots of devices I can get my mitts on support webgl. It seems
	wasteful to me to not take the opportunity to utilise the hardware
	available on just about every platform.

		I am also  aware that some graphics cards are blacklisted by
	the webgl team and that over time, the hardware I use today might 
	also be blocked at some point in the future.
	This annoys me greatly, as I feel there should be some degree of
	support for backwards compatibility  The hardware I use today should
	still work the same tomorrow.

		In the meantime, I desparately want a performance boost for 
	my software, without spending £1000's on a new pc every year just
	to keep things working.. think of the environmental cost !!


	 To use:
	---------
	
		Call WGL3D_Init (canvas_id) to create the gl
	context and initialise the shaders . Check the return value 
	as webgl might not be available.

		Call WGL3D_UploadModelData to store model mesh, face and colour
	data on the GPU - should only have to do this ONCE. The return
	value can be used to select which model you want to use.

	 17th April 2020
	-----------------
		adding support for 2D sprite routines, supporting up to 
	256 simultaneous sprites.

		.. not sure how to turn sprites on or off, other than
	setting the sprite position to be off the screen.

	 18th April 2020
	------------------
		Working on getting textures loaded properly.
	Sorted CORS errors out, hopefully, now just need to get textures
	loaded before trying to upload them to the GPU.



	 Textures:
	--------------

	Call WGL3D_LoadTexture(image_object) to load a texture.

	Note the return value as this is your texture id to use.
	when drawing sprites etc.



	 Sprites:
	-----------
		call WGL3D_InitSpriteBuffer (max_sprites) with the maximum
	number of sprites to allocate space for.


	to use :
		call WGL3D_InitSpriteLayer (layer_idx, texture_id, max_sprites)
	for each sprite layer required. 



	 26th April 2020
	------------------
	Trying to figure out how to group sprites by texture, so different
	sprites can use a different texture.

	sprite_arrays.. each sprite array has the following info:
		max_sprites
		texture_id
		vertex_buffer_id
		vertex_array
		uv_buffer_id
		uv_array
		sprite_faces_index_array;


	27th April 2020
	===================
		Adding sprite "layers".. so each layer uses a single texture.
	Layer is probably the wrong word to use as the z values of all
	the sprites is not layer dependant.

	also trying gl.bufferSubData to update sprite arrays. Not sure
	if this will be better or worse for performance.. 


	 9th August 2020
	-------------------
		looking at supporting 2D canvas for systems that have 3D
	acceleration disabled for some reason (driver issues perhaps??)

	 10th August 2020
	-------------------
		So.. doing 2D support.. this version also has NO support
	for a shadow buffer (research ongoing elsewhere!!).

	 13th August 2020
	-------------------
	When uploading vertices for use by the cpu (2d canvas) or gpu (webgl)
	they are handled slightly differently internally.
	For webgl, the vertices are copied verbatim (x,y,z) -> (x,y,z)
	but for the cpu an extra variable is added to help speed up
	the overall calculations (x,y,z) -> (x,y,z,w) so all the coordinates
	can be transformed in one go, without repeats for each face.

	 20th August 2020
	------------------
		Need to make a note of texture sizes for both 2D and 3D 
	operations.

	Converting 2D and 3D routines to use the same texture structure


	 21st August 2020
	------------------
		testing texture structure.


	 24th August 2020
	-------------------
		Noticed on a previous version of webgl.js (see mod1)
	there was a line drawing routine. I've copied over the code for
	working on at a future date, but for now 3D lines are under 
	construction and not supported.

	  TO USE
	 --------
	==========

	call WGL3D_Init (canvas_id) with the id of the canvas to use for drawing.

	for each 3D model you want drawing, call 
		WGL3D_UploadModelData (verts, face_indices, inks, normals, texture_uvs)
		
		verts 		 - 	should be an array with x,y,z data
						for each vertex.
		face_indices -	should be an array of vertex indices,
						3 for each triangle face.
		inks		 -	3 r,g,b values for each vertex. This is so we
						can have per vertex shading.
		normals		 -	not currently used
		texture_uvs	 -  not currently used.


	  TO USE (2D Sprite Layer)
	 --------------------------
	============================

	call WGL3D_InitSpriteLayer (layer_idx, max_sprites) for each sprite
	layer you want to create. 

	call WGL3D_LoadTexture(image_object) to load textures to be used
	for sprite drawing - note : ensure images are loaded first,
	otherwise it might generate an error.


	for each sprite in a layer, call WGL3D_SetSprite
		(layer_idx, sprite_idx, tu, tv, tw,th, sx, sy, sz, sw, sh)
	
		tu,tv = texture coorinates
		tw,th = width & height in pixels within texture
		sx,sy = screen (x,y) coordinates
		sz	  = z value for ordering sprites within each layer.
		sw,sy = screen width and height.

	
	call WGL3D_DrawSpriteLayer to draw a particular range of sprites
		within each layer.

	call WGL3D_ClearSpriteLayer (layer_idx) to clear a sprite layer.
	 (sprites still exist, they are just moved off screen).

*/

var WGL3D_HardwareEnabled = true;		// false = fallback to 2D rendering
var WGL3D_ShadowsEnabled = false;		// *under construction*

var WGL3D_MAX_MESHES = 16;		// used to limit the amount sent to the gpu

var WGL3D_MAX_SPRITES = 64;			// number of 2D sprites PER LAYER
var WGL3D_MAX_SPRITE_LAYERS = 2;	// one texture per layer.

var WGL3D_BUFFER_TYPE_GPU = 0;
var WGL3D_BUFFER_TYPE_CPU = 1;

var WGL3D_NEAR_Z = 1;
var WGL3D_FAR_Z = 1000;

function WGL3D_STRUCT_TEXTUREINFO (image_object)
{
	this.img = null;
	if (WGL3D_HardwareEnabled == false)
	{
		this.img = new Image();
		this.img.src = image_object.src;
	}

	this.loaded = image_object.complete;

	this.gpu_texture_id = -1;			// gpu specific texture id.
	this.width = image_object.width;
	this.height= image_object.height;
}

//var WGL3D_TextureInfo = [];				// replaces TextureId with WGL3D_STRUCT_TEXTUREINFO

//var WGL3D_2D_TextureBuffer = [];

	//========================================================
				// ================================
				// ----- 2D Support routines ------
				// ================================
	//========================================================

var WGL3D_PerspectiveMatrix;

function WGL3D_CopyPerspectiveMatrix (m)
{
	var i;
		
	for (i = 0; i < m.length; i++)
	{
		WGL3D_PerspectiveMatrix[i] = m[i];
	}
}

var WGL3D_backfaceCullEnabled = true;		// default for 2D is on.

function WGL3D_BackfaceCullCheck (x0,y0,x1,y1,x2,y2)
{
	// this can determine whether a triangle is front or back facing.
	// pinched from https://cboard.cprogramming.com/game-programming/1057-backface-culling-lesson10-nehegl-tutorials.html

	var z=((x1-x0)*(y2-y0)) - ((y1-y0)*(x2-x0));
	return z;
}

/*function WGL3D_2D_LoadTexture (image_object)
{
	// need to make a copy of the image data (if possible).
	// returns a reference to the texture data stored.
	
	// for now, just going to store a reference to the object.

	var i;
	var texture_idx;

	texture_idx = WGL3D_2D_TextureBuffer.length;
	
	WGL3D_2D_TextureBuffer[texture_idx] = new Image();
	WGL3D_2D_TextureBuffer[texture_idx].src = image_object.src;


	i = WGL3D_TextureId.length;
	WGL3D_TextureId[i] = texture_idx;
	
	return i;
}
*/

	// --------------------------------------------
	//		Drawing order / Drawlist stuff
	// --------------------------------------------

var WGL3D_DRAWLIST_INVALID_IDX = -1;
var WGL3D_DRAWLIST_MAXBUCKETS = 512;

	// buffers for 2d vertices. data goes here when vertices are 'uploaded'.

var buffer_2d_verts = [];
var buffer_2d_faces = [];
var buffer_2d_inks = [];

var buffer_2d_xverts = [];	// buffers for transformed vertices.

	// draw list buffers. (used if webgl or z buffer not available)

var WGL3D_DrawList = [];
var WGL3D_DrawList_BucketArray = [];
var WGL3D_DrawList_FreeItem;				// used to recycle drawlist items.

	// 2D rendering structures.
//function WGL3D_DrawListItem()
function WGL3D_STRUCT_DRAWLISTITEM()
{
//	this.object_index;		// is this required ??
	this.previous_idx;
	this.next_idx;
	this.zindex;

		// draw list 2D triangle
	this.rgbhex;
	this.x0;
	this.y0;
	this.x1;
	this.y1;
	this.x2;
	this.y2;
}

//function NormalVector (x,y,z)
function WGL3D_STRUCT_NORMAL()
{
	this.x = x;
	this.y = y;
	this.z = z;
}

WGL3D_STRUCT_NORMAL.prototype.normalise = function()
{
	var d;

	d = Math.sqrt((this.x*this.x) + (this.y*this.y)+(this.z*this.z));
	if (d != 0)
	{
		this.x /= d;
		this.y /= d;
		this.z /= d;
	}
}

//function WGL3D_Model3D (vertex_array, face_array)

function WGL3D_clearDrawList()
{
	var i;
	var i;

	for (i = 0; i < WGL3D_DRAWLIST_MAXBUCKETS; i++)
	{
		WGL3D_DrawList_BucketArray[i] = WGL3D_DRAWLIST_INVALID_IDX;
	}
	WGL3D_DrawList_FreeItem = 0;	// reuse draw list, don't  waste memory.
}

function DrawList_AddItem (object_index, object_z, x0,y0,x1,y1,x2,y2, rgbhex)
{
		// adds a triangle object to the draw list.

	var b;		// bucket hash value (0 to MAXBUCKETS)
	var i;
	var idx;		// index of new drawlist item

	// object_z should be directed into the screen (so bigger z = further away.)

//	if ((object_z < near_z) || (object_z >= far_z))
//	{
//		return;
//	}

//	b= ((object_z - near_z) * DRAWLIST_MAXBUCKETS) / (far_z - near_z);
	b= ((object_z - WGL3D_NEAR_Z) * WGL3D_DRAWLIST_MAXBUCKETS) / (WGL3D_FAR_Z - WGL3D_NEAR_Z);
	b = Math.floor(b);

	if ((b < 0) || (b >= WGL3D_DRAWLIST_MAXBUCKETS))
	{
			// reject any objects that can't be viewed.
		return;
	}

		// create drawlist item.

	idx = WGL3D_DrawList_FreeItem++;
	if (idx == WGL3D_DrawList.length)
	{
		WGL3D_DrawList[idx] = new WGL3D_STRUCT_DRAWLISTITEM();
	}
//	WGL3D_DrawList[idx].object_index = object_index;
	WGL3D_DrawList[idx].zindex = object_z;
	WGL3D_DrawList[idx].previous_idx = WGL3D_DRAWLIST_INVALID_IDX;
	WGL3D_DrawList[idx].next_idx = WGL3D_DRAWLIST_INVALID_IDX;

	WGL3D_DrawList[idx].x0 = x0;
	WGL3D_DrawList[idx].y0 = y0;
	WGL3D_DrawList[idx].x1 = x1;
	WGL3D_DrawList[idx].y1 = y1;
	WGL3D_DrawList[idx].x2 = x2;
	WGL3D_DrawList[idx].y2 = y2;
	WGL3D_DrawList[idx].rgbhex = rgbhex;

	if (WGL3D_DrawList_BucketArray[b] == WGL3D_DRAWLIST_INVALID_IDX)
	{
			// empty bucket.. add new item to bucket
		WGL3D_DrawList_BucketArray[b] = idx;
		return;
	}

	// bucket is used, so need to insert sort into this z list.
	// z values are sorted largest first to smallest (i.e. in required drawing order)

	i = WGL3D_DrawList_BucketArray[b];		// get draw list index of first item in z list

	if ((i < 0) || (i >= WGL3D_DrawList.length))
	{
		console.log ("first i out of range");
		return;
	}

	// this is the bottle neck for large numbers of items with a similar z value.

	while (object_z < WGL3D_DrawList[i].zindex)
	{
		if (WGL3D_DrawList[i].next_idx == WGL3D_DRAWLIST_INVALID_IDX)
		{
			// reached the end of the list, so just add item.
			WGL3D_DrawList[i].next_idx = idx;
			WGL3D_DrawList[idx].previous_idx = i;
			WGL3D_DrawList[idx].next_idx = WGL3D_DRAWLIST_INVALID_IDX;
			return;
		}
		i = WGL3D_DrawList[i].next_idx;
		if ((i < 0) || (i >= WGL3D_DrawList.length))
		{
//			console.log ("i out of range");		// error checking.
		}
	}

	// z >= current item, so insert before it.
	WGL3D_DrawList[idx].previous_idx = WGL3D_DrawList[i].previous_idx;
	WGL3D_DrawList[idx].next_idx = i;

	WGL3D_DrawList[i].previous_idx = idx;

	if (WGL3D_DrawList[idx].previous_idx == WGL3D_DRAWLIST_INVALID_IDX)
	{
		// new item is at start of list, so update bucket list.
		WGL3D_DrawList_BucketArray[b] = idx;
	}
	else
	{
		// update previous z item
		WGL3D_DrawList[WGL3D_DrawList[idx].previous_idx].next_idx = idx;
	}
}

function WGL3D_Draw_DrawList(ctx)
{
	// this routine just displays flat shaded triangles.
	// there are no lighting calculations, shadows, z buffer checks etc.
		// NOTE : THIS MAY LOOK A LITTLE WEIRD..
		
		// .. after profiling, found there was a lot of calls
		// to recalcualte style..a LOT of calls. .. so ..
		// this code now only changes fill & stroke styles when
		// the stroke style changes.. initial tests indicate that
		// this has some good frame rate gains.
	var b;
	var i;
	var d;
	
	var rgbhex;

	rgbhex = "";
	ctx.beginPath();

	for (b = WGL3D_DrawList_BucketArray.length-1; b >= 0; b--)
	{
		if (WGL3D_DrawList_BucketArray[b] != WGL3D_DRAWLIST_INVALID_IDX)
		{
			i = WGL3D_DrawList_BucketArray[b];
			while (i != WGL3D_DRAWLIST_INVALID_IDX)
			{
				d = WGL3D_DrawList[i];
				if (d.rgbhex != rgbhex)
				{
					ctx.fill();		// flush buffer
					ctx.stroke();

					ctx.beginPath();
					ctx.fillStyle = d.rgbhex;		// reduce style changes.
					ctx.strokeStyle = d.rgbhex;
				}
				ctx.moveTo (d.x0, d.y0);
				ctx.lineTo (d.x1, d.y1);
				ctx.lineTo (d.x2+0.5, d.y2);
				ctx.lineTo (d.x0, d.y0);

				if (d.rgbhex != rgbhex)
				{
					rgbhex = d.rgbhex;
				}
				i = d.next_idx;
			}
			ctx.fill();		// flush buffers
			ctx.stroke();
		}
	}
}

//var jkp = 0;
function WGL3D_2D_DrawObject (mesh_id, model_matrix)
{
		// ** UNDER CONSTRUCTION **
	//womble
		
	var i;
		
	var object_index;
	var z;
	var x0;
	var y0;
	var z0;
	var x1;
	var y1;
	var z1;
	var x2;
	var y2;
	var z2;
	var rgbhex;

//	rgbhex="#f00";
	
	var verts;
	var xverts;
	var z;
	var f;
	var v0;
	var v1;
	var v2;

	var ptr;

	var ox;
	var oy;
	var halfwidth;
	var halfheight;
	
	var r;
	var g;
	var b;

	halfwidth = webglCanvas.width >> 1;
	halfheight = webglCanvas.height >> 1;
	ox = halfwidth;
	oy = halfheight;

	verts = buffer_2d_verts[mesh_id];

//	if (jkp == 0)
//	{
//		console.log ("untransformed verts..");
//		console.log (verts);
//	}

	buffer_2d_xverts = [];			// clear xverts buffer (is this required ??)

	xverts = buffer_2d_xverts;

		// do model matrix multiply.
	MatrixVectorArrayMultiply (model_matrix, verts, xverts);

//	if (jkp == 0)
//	{
//		console.log ("model matrix x verts..");
//		console.log (xverts);
//	}

		// now do perspective (projection) matrix multiply.
//	MatrixVectorArrayMultiply (ProjectionMatrix, verts, xverts);
//	MatrixVectorArrayMultiply (g_PerspectiveMatrix, verts, xverts);
	MatrixVectorArrayMultiply (g_PerspectiveMatrix, xverts, xverts);

//	if (jkp == 0)
//	{
//		console.log ("perspective x xverts");
//		console.log (xverts);
//	}

		// do divide by w
	for (k = 0; k < xverts.length; k += 4)
	{
		w = xverts[k+3];
		if (w != 0)
		{
			xverts[k+0] /= w;
			xverts[k+1] /= w;
		}
	}

//	if (jkp == 0)
//	{
//		console.log ("w divide");
//		console.log (xverts);
//	}

		// convert to screen coordinates

	for (k = 0; k < xverts.length; k += 4)
	{
		xverts[k]   = ox + (halfwidth * xverts[k]);
		xverts[k+1] = oy - (halfheight* xverts[k+1]);
	}

//	if (jkp == 0)
//	{
//		console.log ("screen coords");
//		console.log (xverts);
//	}

//	if (jkp == 0)
//	{
//		console.log (buffer_2d_faces);
//	}

		// output triangle data to draw list.
	ptr = buffer_2d_faces [mesh_id];
	for (f = 0; f < ptr.length; f += 3)
	{
		v0 = ptr[f+0] * 4;
		v1 = ptr[f+1] * 4;
		v2 = ptr[f+2] * 4;
		
//		if (jkp == 0)
//		{
//			console.log ("f:" + f + " v0:" + v0 + " v1:" + v1 + " v2:" + v2);
//		}
		x0 = xverts[v0+0];
		y0 = xverts[v0+1];
		z0 = xverts[v0+2];

		x1 = xverts[v1+0];
		y1 = xverts[v1+1];
		z1 = xverts[v1+2];

		x2 = xverts[v2+0];
		y2 = xverts[v2+1];
		z2 = xverts[v2+2];

		z = (z0 + z1 + z2)/3;

		backface_cull = false;
		if (WGL3D_backfaceCullEnabled == true)
		{
			backface_cull = true;
			if (WGL3D_BackfaceCullCheck (x0,y0,x1,y1,x2,y2) < 0)
			{
				backface_cull = false;
			}
		}

		if (backface_cull == false)
		{
			v0 = ptr[f+0] * 3;
			r = Math.floor (255 * buffer_2d_inks[mesh_id][v0+0]);
			g = Math.floor (255 * buffer_2d_inks[mesh_id][v0+1]);
			b = Math.floor (255 * buffer_2d_inks[mesh_id][v0+2]);
			rgbhex = "rgb(" +  r + ","+ g + "," + b + ")";

//		if (jkp == 0)
//		{
//			console.log ("f:" + f + " r:" + r + " g:" + g + " b:" + b);
//		}
			DrawList_AddItem (object_index, z, x0,y0,x1,y1,x2,y2, rgbhex);
		}
	}

//	jkp = 1;
//	var buffer_2d_verts = [];
//var buffer_2d_faces = [];
//var buffer_2d_inks = [];

//var buffer_2d_xverts = [];	// buffers for transformed vertices.
	
//	DrawList_AddItem (object_index, object_z, x0,y0,x1,y1,x2,y2, rgbhex);

}


function WGL3D_Init2D (canvas_id)
{
	webglCanvas = document.getElementById(canvas_id);
	if (!webglCanvas)
	{
		console.log ("Init2D:unable to locate canvas " + canvas_id);
		return false;
	}

	WGL3D_HardwareEnabled = false;
	gl = webglCanvas.getContext("2d");

	WGL3D_clearDrawList();		// initialise 2D draw list.

	WGL3D_PerspectiveMatrix = MatrixIdentity();

	WGL3D_2D_TextureBuffer = [];

	console.log ("Hardware WebGl not available : using canvas 2D for rendering");
	return true;
}

function WGL3D_2D_Upload (verts, face_indices, inks, normals, texture_uvs)
{
	// need to 'upload' data to some internal buffer, and return 
	// an index to it.
	
	// verts should be and array of coordinates (x,y,z) for each vertex
	// required.. e.g:
	// v[0] = x0, v[1] = y0, v[2] = z0
	// v[3] = x1, v[4] = y1, v[5] = z1
	// .. etc,etc.
	
	// internally, these go to a (x,y,z,w) vector format for easy
	// matrix multiplication.

	var idx;
	var lp;
	var id;
	var i;
	var ptr;
	var f;
	var w;

	w = 1;		// w value for (x,y,z,w)

		// get free vertex buffer index
	i = WGL3D_ID_VertexBuffers.length;
	
	if (i == WGL3D_MAX_MESHES)
	{
		console.log ("2D_Upload : max meshes reached");
		return -1;
	}

	WGL3D_ID_BufferType[i] = WGL3D_BUFFER_TYPE_CPU;

	id = buffer_2d_verts.length;
	WGL3D_ID_VertexBuffers[i] = id;

	buffer_2d_verts[id] = [];
	ptr = buffer_2d_verts[id];
	idx = 0;
	for (lp = 0; lp < verts.length; lp += 3)
	{
		ptr[idx+0] = verts[lp+0];
		ptr[idx+1] = verts[lp+1];
		ptr[idx+2] = verts[lp+2];
		ptr[idx+3] = w;				// default w value.
		idx += 4;
	}

	id = buffer_2d_faces.length;
	WGL3D_ID_IndexBuffers[i] = id;

	buffer_2d_faces[id] = [];
	ptr = buffer_2d_faces[id];
	for (lp = 0; lp < face_indices.length; lp += 3)
	{
		ptr[lp+0] = face_indices[lp+0];
		ptr[lp+1] = face_indices[lp+1];
		ptr[lp+2] = face_indices[lp+2];
	}
	
//	console.log ("aaaaaa");
//	console.log (ptr);

		// not sure if this should be rgb or rgba ??

	id = buffer_2d_inks.length;
	WGL3D_ID_InkBuffers[i] = id;
	buffer_2d_inks[id] = [];
	ptr = buffer_2d_inks[id];
	for (lp = 0; lp < inks.length; lp += 3)
	{
		ptr[lp+0] = inks[lp+0];
		ptr[lp+1] = inks[lp+1];
		ptr[lp+2] = inks[lp+2];
	}
	
	return i;
}

var ttyy = 0;
function WGL3D_2D_DrawSpriteLayer (layer_idx, first_sprite_idx, number_of_sprites, texture_id)
{
	//** under construction **
	
		// slightly complicated by the fact the coordinates are 
		// in webgl ranges.

		// need to convert coords to 2d canvas pixel values.
		// so need knowledge of texture and canvas sizes.

	var lp;
	var sl;
	var s;
	var f;
	var ix;
	var iy;
	var iw;
	var ih;
	var sx;
	var sy;
	var sw;
	var sh;
	var i;
	var tw;
	var th;
	
	var cw;
	var ch;
	
	var tex;
	


//function WGL3D_STRUCT_TEXTUREINFO (image_object)
//{
//	this.img = null;
//	if (WGL3D_HardwareEnabled == false)
//	{
//		this.img = new Image();
//		this.img.src = image_object.src;
//	}

//	this.loaded = image_object.loaded;

//	this.gpu_texture_id = -1;				// for gpu texture id's.
//	this.width = image_object.width;
//	this.height= image_object.height;
//}

	tw = WGL3D_TextureInfo[texture_id].width;
	th = WGL3D_TextureInfo[texture_id].height;
	
//	console.log ("tw :" + tw + " th:" + th);

//	tex =WGL3D_TextureId [texture_id];
//	if (WGL3D_2D_TextureBuffer [tex].loaded == false)
//	{
//		return;
//	}
//	tw = WGL3D_2D_TextureBuffer [tex].width;
//	th = WGL3D_2D_TextureBuffer [tex].height;

	cw = webglCanvas.width;
	ch = webglCanvas.height;

	sl = SpriteLayerArray [layer_idx];

	s = sl.vertex_array;
	f = sl.uv_array;
	for (lp = 0; lp < sl.max_sprites; lp++)
	{
			// extract data from arrays.

		i = lp * 12;
		sx = s[i];
		sy = s[i+1];
		sw = s[i+3] - sx;
		sh = s[i+7] - sy;
		
		i = lp * 8;
		ix = f[i];
		iy = f[i+1];
		iw = f[i+2] - ix;
		ih = f[i+5] - iy;

		sx = (sx+1) * (cw * 0.5);
		sy = (sy-1) * (ch * -0.5);

		sw = sw * cw*0.5;
		sh = sh * ch*-0.5;

		ix = ix * tw;
		iy = iy * th;
		iw *= tw;
		ih *= th;

//		gl.drawImage (WGL3D_2D_TextureBuffer[tex], ix, iy, iw, ih, sx, sy, sw, sh);
		gl.drawImage (WGL3D_TextureInfo[texture_id].img, ix, iy, iw, ih, sx, sy, sw, sh);
	}
//	ttyy = 1;
}

//function WGL3D_SpriteLayerStruct ()
//{
//	this.max_sprites;
//	this.texture_id;
//	this.vertex_buffer_id;
//	this.vertex_array;
//	this.uv_buffer_id;
//	this.uv_array;
//	this.face_buffer_id;
//}	
	
//}



		// ===========================
		//  **** END OF 2D STUFF ****
		// ===========================





	//--------------------------------------------------
	// vertex and frag shader for plain white 2D triangles
	//--------------------------------------------------

var vs_white_triangles =
	"attribute vec3 vertexPosition;"+
	"void main()"+
	"{"+
	"	gl_Position = vec4(vertexPosition, 1.0);"+
	"}"
	;

var fs_white_triangles =
	"precision mediump float;"+
	"void main()"+
	"{"+
	"	gl_FragColor = vec4 (1.0, 1.0, 1.0, 1.0);"+
	"}"
	;

	//--------------------------------------------------
	// vertex and frag shader for 2D gouraud shading
	//--------------------------------------------------

var vs_2d_gradient_shader =
	"attribute vec2 vertexPosition;"+
	"attribute vec4 vertexInk;"+
	"varying vec4 vColor;"+
	"void main(void)"+
	"{"+
	"	gl_Position = vec4(vertexPosition, 0.0, 1.0);"+
	"	vColor = vertexInk;"+
	"}"
	;

var fs_2d_gradient_shader =
	"precision mediump float;"+
	"varying vec4 vColor;"+
	"void main(void)"+
	"{"+
	"	gl_FragColor = vColor;"+
	"}"
	;

	//--------------------------------------------------
	// 3D Flat Shaded Triangles
	//--------------------------------------------------

var vs_3d_flat =
	"	attribute vec3 vertexPosition;"+
	"  attribute vec4 vertexInk;"+
	"  varying vec4 vColor;"+
	"	uniform mat4 modelViewMatrix;"+
	"	uniform mat4 perspectiveMatrix;"+
	"	void main(void)"+
	"	{"+							    // for 2D stuff, set z value to 0.0 and set w value to 1
	"		gl_Position = perspectiveMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);"+
	"		vColor = vertexInk;"+
	"	}"
	;

var fs_3d_flat =
	"precision mediump float;"+
	"varying vec4 vColor;"+
	"	void main(void)"+
	"	{"+
	"	gl_FragColor = vColor;"+
	"	}"
	;	


	//--------------------------------------------------
	// vertex and frag shader for 2D sprites
	//--------------------------------------------------


var vs_2d_sprite_shader =
//	"attribute vec2 spritecoord;"+
	"attribute vec3 vertexPosition;"+
	"attribute vec2 textureCoord;"+

	"varying vec2 vTextureCoord;"+

	"void main(void)"+
	"{"+
//	"		gl_Position = vec4 (spritecoord.x, spritecoord.y, 0, 1);"+
	"    gl_Position = vec4 (vertexPosition, 1.0);" +
	"    vTextureCoord = textureCoord;"+
//	"		vTextureCoord = aTextureCoord;"+
	"}"
	;

var fs_2d_sprite_shader =
	"precision mediump float;"+
	"	varying vec2 vTextureCoord;"+		// this is the texture coord.
	"	uniform sampler2D uSampler;"+		// sampler is a data type used to access the texture.
	"	void main(void)"+
	"	{"+
	"      gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));"+

//	"      vec4 color = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));"+
//	"      gl_FragColor = vec4 (
				// quick and dirty transparency check !!
	"	   if (gl_FragColor.a == 0.0)	discard;"+
//	"	   if ((gl_FragColor.r == 0.0) && (gl_FragColor.g == 0.0) && (gl_FragColor.b == 0.0))	discard;"+
	"	}"
	;

	// ------------------------------------
	//	2D/3D Line drawing shader
	// ------------------------------------

var vs_3d_line =
	"attribute vec3 vertexPosition;"+
//	"uniform mat4 mViewMatrix;"+
//	"uniform mat4 cameraMatrix;"+
//	"uniform mat4 perspectiveMatrix;"+

	"	uniform mat4 modelViewMatrix;"+
	"	uniform mat4 perspectiveMatrix;"+
	
	"uniform vec4 line_ink;"+					// uniform = constant for each primative.
	"varying lowp vec4 vColor;" + 			// this used by frag shader, modified by vertex shader but is fixed in frag shader.
	"void main(void)"+
	"{"+
//	"	gl_Position = perspectiveMatrix * cameraMatrix * mViewMatrix * vec4(vertexPosition, 1.0);"+
	"		gl_Position = perspectiveMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);"+
	"  vColor = line_ink;"+
	"}"
	;

var fs_3d_line =
	"precision mediump float;"+
	"varying lowp vec4 vColor;" + 
	"void main(void)"+
	"{"	+
	"	gl_FragColor = vColor;"+
	"}"
	;

	// -----------------------------
	//     ---- global vars ---- 
	// -----------------------------

var WGL3D_MAX_SPRITES = 256;		// space for 256 2d sprites.

function WGL3D_SpriteLayerStruct ()
{
	this.max_sprites;
	this.texture_id;
	this.vertex_buffer_id;
	this.vertex_array;
	this.uv_buffer_id;
	this.uv_array;
	this.face_buffer_id;
}	

var SpriteLayerArray = [];
	
	
var webglCanvas;
var gl;								// webgl context.

var ShaderProg_WhiteTriangles;
var ShaderProg_2DGradients;				// simple 2D shader with gradients
var ShaderProg_3DFlat;
var ShaderProg_Sprites;

var g_PerspectiveMatrix;			// calculated once during initialisation.


var WGL3D_ID_BufferType = [];		// buffer type.. gpu or cpu
var WGL3D_ID_VertexBuffers = [];	// id's for gpu buffer objects.
var WGL3D_ID_IndexBuffers = [];
var WGL3D_ID_InkBuffers = [];

var WGL3D_NumFaces = [];

var WGL3D_TextureInfo = [];				// replaces TextureId with WGL3D_STRUCT_TEXTUREINFO

//var WGL3D_TextureId = [];
//var WGL3D_TextureImg = [];			// temp image stores.


	// --- sprite vars ---

//var WGL3D_SpriteVertexBuffer = null;
//var WGL3D_SpriteVertexArray = null;

//var WGL3D_SpriteUVBuffer = null;
//var WGL3D_SpriteUVArray = null;

//var WGL3D_SpriteFaces = null;

//var WGL3D_MaxSprites = 0;

	// error reporting 
	
var WGL3D_MaxErrors = 20;		// max number of webgl errors to report.

function WGL3D_Error(msg)
{
	var e;
	var str;

	str = "";
	
	if (WGL3D_HardwareEnabled == false)
	{
		if (msg != undefined)
		{
			console.log (msg);
		}
		return;
	}


	e = gl.getError();		// performance issue ???
	switch (e)
	{
		case gl.NO_ERROR:	break;
		case gl.INVALID_ENUM:
				str = "An unacceptable value has been specified for an enumerated argument. The command is ignored and the error flag is set.";
				break;
		case gl.INVALID_VALUE:
				str = "A numeric argument is out of range. The command is ignored and the error flag is set.";
				break;
		case gl.INVALID_OPERATION:	
				str = "The specified command is not allowed for the current state. The command is ignored and the error flag is set.";
				break;
		case gl.INVALID_FRAMEBUFFER_OPERATION:
				str = "The currently bound framebuffer is not framebuffer complete when trying to render to or to read from it.";
				break;
		case gl.OUT_OF_MEMORY:
				str = "Not enough memory is left to execute the command.";
				break;
		case gl.CONTEXT_LOST_WEBGL:
				str = "If the WebGL context is lost, this error is returned on the first call to getError. Afterwards and until the context has been restored, it returns gl.NO_ERROR.";
				break;
		default:
				str = "unknown gl error : " + e;
				break;
	}
	
	if (WGL3D_MaxErrors > 0)
	{
		WGL3D_MaxErrors--;
		if (str.length > 0)
		{
			console.log (str);
			if (msg != undefined)
			{
				console.log (msg);
			}
		}
	}
}


		// vertex & fragment shader load & compile routines.

function _wgl3d_CompileShaderProgramFromStrings (v_shader_src, f_shader_src)
{
		// compiles a vertex and shader program from strings.
		// returns the id of the compiled shader program
	 
		// v_shader_src = name of string containing vertex shader source.
		// f_shader_src = name of string containing fragment shader source.

	var vs;
	var fs;
	var program_id;
	
	if (WGL3D_HardwareEnabled == false)
	{
		console.log ("2D mode : no shader compilation");
		return;
	}

	

//	console.log ("vshader");
	vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, v_shader_src);
	gl.compileShader(vs);

		// create & compile fragment shader.

//	console.log ("fshader");
	fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, f_shader_src);
	gl.compileShader(fs);

		// Create the webgl 'program', attach the shaders and link it.

	program_id = gl.createProgram();
	gl.attachShader(program_id, vs);
	gl.attachShader(program_id, fs);
	gl.linkProgram(program_id);

    // finally, produce some debugging output so that if the compilation
    // process fails, we have some information about it.

	if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
	{
		console.log(gl.getShaderInfoLog(vs));
	}

	if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
	{
		console.log(gl.getShaderInfoLog(fs));
	}

	if (!gl.getProgramParameter(program_id, gl.LINK_STATUS))
	{
		console.log(gl.getProgramInfoLog(program_id));
	}

	return program_id;		// returned for use by your code.
}

	// ========
	// public :
	// ========

function WGL3D_Init (canvas_id)	// canvas_width, canvas_height)
{
		// create a html canvas to draw with. Note that the getContext call
		// ties it to the webgl stuff - you can't treat it as a regular 2d cavas.
		
		// returns false if unable to initialise webgl
		// note : 2D rendering fallback will be activated in this case.

	var canvas_string;
	var v;
	var f;
	var vs;
	var fs;

	console.log ("WEBGL_Init()");
	
	
	
	

	webglCanvas = document.getElementById(canvas_id);
	if (!webglCanvas)
	{
		console.log ("unable to locate canvas " + canvas_id);
		return false;
	}

	console.log ("Doing WEBGL inits..");

		// Create the projection matrix - only needs to be done once, so I've put it here !
	
	console.log ("webgl " + webglCanvas.width + " " + webglCanvas.height);
	g_PerspectiveMatrix = Matrix_CreatePerspectiveProjectionMatrix (
		webglCanvas.width, 			// width in pixels
		webglCanvas.height, 		// height in pixels
			30.0,					// field of view (degrees)
			WGL3D_NEAR_Z,						// near z
			WGL3D_FAR_Z);					// far z

//	console.log ("g_PerspectiveMatrix");
//	console.log (g_PerspectiveMatrix);
	
		// for 2D test purposes, forcing 2D rendering
//	WGL3D_HardwareEnabled = false;
//	WGL3D_Init2D (canvas_id);
//	return true;

	gl = webglCanvas.getContext("experimental-webgl");		// Opera still wants this ??.
	if (!gl)
	{
		gl = webglCanvas.getContext("webgl");						// Firefox accepts this.
	}

	if (!gl)
	{
		// fall back to 2D canvas rendering
		WGL3D_HardwareEnabled = false;
		WGL3D_Init2D (canvas_id);
		return false;
	}
	
	WGL3D_HardwareEnabled = true;	// warp factor 9 Mr Sulu !

	console.log ("webgl available, got context");

	gl.viewport (0,0, webglCanvas.width, webglCanvas.height);
	gl.clearColor(0.6, 0.2, 0.2, 1);

	gl.enable (gl.DEPTH_TEST);		// enable depth testing
	WGL3D_Error();

		// the following 2 lines do blending. without this
		// discarded pixels mean edge pixels do not get blended.
	gl.enable (gl.BLEND);			// enable blending testing
	gl.blendFuncSeparate( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE );

//	gl.depthFunc(gl.LEQUAL);		// near things obscure far things.

//	gl.enable (gl.TEXTURE_2D);		// NOTE : NOT REQUIRED FOR WEBGL... ensure textures are turned on. (note.. only need to do this ONCE)

	gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	WGL3D_Error();
//		gl.clear (gl.COLOR_BUFFER_BIT);

//	g_PointBuffer = gl.createBuffer();			// id for points.
//	g_PointRGBBuffer = gl.createBuffer();		// id for rgb's.
//	g_PointRadiusBuffer = gl.createBuffer();	// id for radius values.
		
//	g_SpriteVertexBuffer = gl.createBuffer();	// id for sprite vertices.
//	g_SpriteUVBuffer = gl.createBuffer();		// id for texture uv buffer
//	g_SpriteIndexBuffer = gl.createBuffer();	// id for sprite vertex indices buffer.

		// shaders do not get executed the same as javascript
		// - they need to be compiled before you can use them !

//	g_ShaderProg1 = InitShaderProg1();
//	g_ShaderProg2 = InitShaderProg2();
//	LoadTextures();
//	InitTextureBuffer();
	
//	SpriteInit();

	ShaderProg_WhiteTriangles = _wgl3d_CompileShaderProgramFromStrings (vs_white_triangles, fs_white_triangles);
	ShaderProg_2DGradients = _wgl3d_CompileShaderProgramFromStrings (vs_2d_gradient_shader, fs_2d_gradient_shader);
	ShaderProg_3DFlat = _wgl3d_CompileShaderProgramFromStrings (vs_3d_flat, fs_3d_flat);

	ShaderProg_Sprites = _wgl3d_CompileShaderProgramFromStrings  (vs_2d_sprite_shader, fs_2d_sprite_shader);

//	ShaderProg_Points = _wgl3d_CompileShaderProgramFromStrings (vs_point_sprite, fs_point_sprite);
//	ShaderProg_Sprites = _wgl3d_CompileShaderProgramFromStrings (vs_2d_sprite_shader, fs_2d_sprite_shader);
//	ShaderProg_2DGradients = _wgl3d_CompileShaderProgramFromStrings (vs_2d_gradient_shader, fs_2d_gradient_shader);
//	ShaderProg_3D1 = _wgl3d_CompileShaderProgramFromStrings (vs_3d_tmap, fs_3d_tmap);
//	ShaderProg_PointCircle = _wgl3d_CompileShaderProgramFromStrings (vs_point_circle, fs_point_circle);
//	ShaderProg_3DFlat = _wgl3d_CompileShaderProgramFromStrings (vs_3d_flat, fs_3d_flat);

	console.log ("webgl inits done");
	return true;
}

function WGL3D_UploadModelData (verts, face_indices, inks, normals, texture_uvs)
{
		// *** UNDER CONSTRUCTION ***

		// note : GPU's don't generally have complex garbage collectors
		// so repeated create & delete of buffers is probably
		// going to fragment the video memory.. so if possible, call
		// this routine as infrequently as possible.
		
		// for now, going to load all the data separately,
		// but eventually will interleave this data to reduce the 
		// call overhead.
		
		// note: converts the data to typed arrays before uploading
		// so there is no need to pass typed arrays to this routine.
		
		// note : for now, textures and normals can be null
		// as they are not currently used.

	var i;

//	var WGL3D_ID_VertexBuffers = [];
//	var WGL3D_ID_IndexBuffers = [];
//	var WGL3D_ID_InkBuffers = [];

	i = WGL3D_ID_VertexBuffers.length;
	if (i == WGL3D_MAX_MESHES)
	{
		console.log ("max meshes reached");
		return false;
	}
	
	if (WGL3D_HardwareEnabled == false)
	{
		i = WGL3D_2D_Upload (verts, face_indices, inks, normals, texture_uvs);
		return i;
	}


	WGL3D_ID_BufferType[i] = WGL3D_BUFFER_TYPE_GPU;

//	console.log ("i = " + i);

		// upload  vertex data into a buffer on the GPU

	id = gl.createBuffer();
	WGL3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	WGL3D_Error();
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
	WGL3D_Error();
	WGL3D_ID_VertexBuffers[i] = id;

		// do the same for the face vertex indices (3 per face)

	id = gl.createBuffer();
	WGL3D_Error();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id);
	WGL3D_Error();
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(face_indices), gl.STATIC_DRAW);
	WGL3D_Error();
	WGL3D_ID_IndexBuffers[i] = id;
//	console.log (id);
	WGL3D_NumFaces[i] = face_indices.length;

		// ..and the same for the inks too.

	id = gl.createBuffer();
	WGL3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	WGL3D_Error();
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inks), gl.STATIC_DRAW);
	WGL3D_ID_InkBuffers[i] = id;

	return i;
}

function WGL3D_TriangleTest()
{
	// "simple" test to draw a white 2D triangle to the screen.
	// .. 2 hours in.. program looks correct but nothing displayed.

	var verts_id;
	var id;			// id used to access shader program vars.
	var mm;
	var sp;			// shader program to use
	
	var mesh_id;
	var mesh_id2;
	var mesh_id3;

	var test_verts1 = 
	[
			// x, y, z

	   -0.5,  0.5, 0,
		0.5,  0.5, 0,
		0.0, -0.5, 0
	];
	
	var test_verts2 = 
	[
			// x, y, z

		   0,  0.5,
		-0.5, -0.5,
		 0.5, -0.5,
	];

	var test_verts3 = 
	[
			// x, y, z

		-0.5,  0.5, -3,
		 0.5,  0.5, -3,
		 0.5, -0.5, -3
	];


	
	var test_indices =
	[
		0,1,2
	];
	
	var test_inks =
	[
		1,0,0,
		0,1,0,
		0,0,1
	];
	
	console.log ("webgl triangle tests");


		// upload model data

	mesh_id = WGL3D_UploadModelData (test_verts1, test_indices, test_inks, null, null);
	console.log ("mesh id:" + mesh_id);

	mesh_id2 = WGL3D_UploadModelData (test_verts2, test_indices, test_inks, null, null);
	console.log ("mesh id2:" + mesh_id2);

	mesh_id3 = WGL3D_UploadModelData (test_verts3, test_indices, test_inks, null, null);
	console.log ("mesh id2:" + mesh_id2);

	console.log ("webgl triangle tests");

	console.log ("first test.. white triangle..");

		// -------------------
	
	sp = ShaderProg_WhiteTriangles;
	gl.useProgram(sp);		// simple flat colour shader
	WGL3D_Error();

	i = mesh_id;
	gl.bindBuffer(gl.ARRAY_BUFFER,  WGL3D_ID_VertexBuffers[i]);
	WGL3D_Error();
	id = gl.getAttribLocation(sp, "vertexPosition");
	console.log ("id :" + id);
	WGL3D_Error();
	if (id == -1)	alert ("vertexPosition attrib not found");
	gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0, 0);			// 3 = number of floats per vertex.
	WGL3D_Error();
	gl.enableVertexAttribArray(id);
	WGL3D_Error();

	console.log (WGL3D_ID_IndexBuffers[i]);
	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER,  WGL3D_ID_IndexBuffers[i]);
	WGL3D_Error();
//	gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
	gl.drawElements(gl.TRIANGLES, WGL3D_NumFaces[i], gl.UNSIGNED_SHORT, 0);
//	gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
	WGL3D_Error();

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		// -------------------

	sp = ShaderProg_2DGradients;
	gl.useProgram(sp);		// simple flat colour shader
	WGL3D_Error();

	i = mesh_id2;
	gl.bindBuffer(gl.ARRAY_BUFFER,  WGL3D_ID_VertexBuffers[i]);
	WGL3D_Error();
	id = gl.getAttribLocation(sp, "vertexPosition");
	console.log ("id :" + id);
	WGL3D_Error();
	if (id == -1)	alert ("vertexPosition attrib not found");
	gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);			// 2 = number of floats per vertex.
	WGL3D_Error();
	gl.enableVertexAttribArray(id);
	WGL3D_Error();

	gl.bindBuffer(gl.ARRAY_BUFFER, WGL3D_ID_InkBuffers[i]);
	WGL3D_Error();
	id = gl.getAttribLocation(sp, "vertexInk");
	WGL3D_Error();
	if (id == -1)	alert ("vertexInk attrib not found");
	gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0,0);			// 3 = 3 floats per vertex.
	WGL3D_Error();
	gl.enableVertexAttribArray(id);
	WGL3D_Error();

	console.log (WGL3D_ID_IndexBuffers[i]);
	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER,  WGL3D_ID_IndexBuffers[i]);
	WGL3D_Error();
	gl.drawElements(gl.TRIANGLES, WGL3D_NumFaces[i], gl.UNSIGNED_SHORT, 0);
	WGL3D_Error();

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		// ----------------------

	sp = ShaderProg_3DFlat;
	gl.useProgram (sp);
	WGL3D_Error();


			// create model matrix

	mm = MatrixIdentity();
//	mm = MatrixScale (mm, 1, 1, 1);
//	mm = MatrixRotate (mm, 0, 0, 0);
//	mm = MatrixTranslate (mm, 0,0,0);

	id = gl.getUniformLocation(sp, "modelViewMatrix");
	console.log ("mmdxccc:" + id);
	if (id == -1)	console.log ("modelViewMatrix uniform not found");
	WGL3D_Error();
	gl.uniformMatrix4fv(id, false, mm);
	WGL3D_Error();

		// upload perspective matrix

	id = gl.getUniformLocation(sp, "perspectiveMatrix");
	console.log ("qwerqwer:" + id);
	WGL3D_Error();
	if (id == -1)    alert ("shader1:perspective matrix not found");
	gl.uniformMatrix4fv (id, false, g_PerspectiveMatrix);	
	WGL3D_Error();
	
		// set buffers to use.

	i = mesh_id3;
	gl.bindBuffer(gl.ARRAY_BUFFER,  WGL3D_ID_VertexBuffers[i]);
	WGL3D_Error();
	id = gl.getAttribLocation(sp, "vertexPosition");
	console.log ("id :" + id);
	WGL3D_Error();
	if (id == -1)	alert ("vertexPosition attrib not found");
	gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0, 0);			// 3 = number of floats per vertex.
	WGL3D_Error();
	gl.enableVertexAttribArray(id);
	WGL3D_Error();

	gl.bindBuffer(gl.ARRAY_BUFFER, WGL3D_ID_InkBuffers[i]);
	WGL3D_Error();
	id = gl.getAttribLocation(sp, "vertexInk");
	WGL3D_Error();
	if (id == -1)	alert ("vertexInk attrib not found");
	gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0,0);			// 3 = 3 floats per vertex.
	WGL3D_Error();
	gl.enableVertexAttribArray(id);
	WGL3D_Error();

	console.log (WGL3D_ID_IndexBuffers[i]);
	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER,  WGL3D_ID_IndexBuffers[i]);
	WGL3D_Error();
//	gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
	gl.drawElements(gl.TRIANGLES, WGL3D_NumFaces[i], gl.UNSIGNED_SHORT, 0);
//	gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
	WGL3D_Error();
}


function WGL3D_ClearCanvas()
{
	if (WGL3D_HardwareEnabled == true)
	{
		gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		WGL3D_Error();
	}
	else
	{
		gl.clearRect(0,0,webglCanvas.width, webglCanvas.height);

	}
}

	// =========================================================
	//		---- 3D object drawing routines ----
	// =========================================================
	
function WGL3D_StartDraw()
{
	if (WGL3D_HardwareEnabled == true)
	{
		sp = ShaderProg_3DFlat;
		gl.useProgram (sp);
		WGL3D_Error();

			// upload perspective matrix

		id = gl.getUniformLocation(sp, "perspectiveMatrix");
		WGL3D_Error();
		if (id == -1)
		{
			console.log ("shader1:perspective matrix not found");
			return;
		}
		gl.uniformMatrix4fv (id, false, g_PerspectiveMatrix);
		WGL3D_Error();
	}
	else
	{
		// ** TO DO ** 2D START DRAW
		WGL3D_clearDrawList();
	}
}

function WGL3D_EndDraw()
{
		// for 2D rendering, this does the actual draw list drawing.
		// done this way as need to have a full draw list before
		// rendering anything.

	if (WGL3D_HardwareEnabled == false)
	{
		WGL3D_Draw_DrawList(gl);
	}
}

function WGL3D_DrawObject(mesh_id, model_matrix)
{
	// uses webgl routines to display a mesh using the supplied model matrix.
	var i;
	
	
	if (WGL3D_HardwareEnabled == false)
	{
		// TO DO : 2D DrawObject
		WGL3D_2D_DrawObject (mesh_id, model_matrix);
		return;
	}

	i = mesh_id;

		// upload model matrix
	id = gl.getUniformLocation(sp, "modelViewMatrix");
	WGL3D_Error();
	if (id == -1)
	{
		console.log ("modelViewMatrix uniform not found");
		return;
	}
	gl.uniformMatrix4fv(id, false, model_matrix);
	WGL3D_Error();

	gl.bindBuffer(gl.ARRAY_BUFFER,  WGL3D_ID_VertexBuffers[i]);
	WGL3D_Error();
	id = gl.getAttribLocation(sp, "vertexPosition");
//	console.log ("id :" + id);
	WGL3D_Error();
	if (id == -1)	alert ("vertexPosition attrib not found");
	gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0, 0);			// 3 = number of floats per vertex.
	WGL3D_Error();
	gl.enableVertexAttribArray(id);
	WGL3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	WGL3D_Error();


		// set buffers to use (just vertex and ink for now)

	gl.bindBuffer(gl.ARRAY_BUFFER, WGL3D_ID_InkBuffers[i]);
	WGL3D_Error();
	id = gl.getAttribLocation(sp, "vertexInk");
	WGL3D_Error();
	if (id == -1)	alert ("vertexInk attrib not found");
	gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0,0);			// 3 = 3 floats per ink.
	WGL3D_Error();
	gl.enableVertexAttribArray(id);
	WGL3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	WGL3D_Error();


	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER,  WGL3D_ID_IndexBuffers[i]);
	WGL3D_Error();
	gl.drawElements(gl.TRIANGLES, WGL3D_NumFaces[i], gl.UNSIGNED_SHORT, 0);
//	gl.drawElements(gl.TRIANGLES, , gl.UNSIGNED_SHORT, 0);
	WGL3D_Error();
	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, null);
	WGL3D_Error();
}




    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //    ~~~~  Texture Loading Stuff ~~~~
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    
// trying to write an image to a canvas to get around CORS issues.


//var _g_texture;

//function _wgl3d_handleLoadedTexture(i)	//image, texture)

/* 
 * 	var canvas;
	var ctx;
	var w;
	var h;
	var image_data;
	var x;
	var y;
	var r;
	var g;
	var b;
	var a;
	var p;

	var dirty_canvas;
	var dirty_ctx;

	w = image_object.width;
	h = image_object.height;

	dirty_canvas = document.createElement("CANVAS"); 
	dirty_canvas.width = w;
	dirty_canvas.height= h;
	dirty_ctx = dirty_canvas.getContext ("2d");
	dirty_ctx.rect (0,0, 10,10);
	dirty_ctx.drawImage (image_object,0,0);
	
	image_data = dirty_ctx.getImageData (0,0, w,h);
	
	canvas = document.createElement ("CANVAS");
	ctx = canvas.getContext ("2d");
	canvas.width = image_object
	p = 0;
	for (y = 0; y < h; y++)
	{
		for (x = 0; x < w; x++)
		{
			r = image_data[p++];
			g = image_data[p++];
			b = image_data[p++];
			a = image_data[p++];
			a = 1;
			
			ctx.beginPath();
			ctx.fillStyle="rgba("+r+","+g+"," + b+","+a+")";
			ctx.rect (x,y,1,1);
			ctx.fill();
		}
	}
*/

function _wgl3d_handleLoadedTexture(texture_id, image_object)	//image, texture)
{
	// take data from an image, place it into a dirty canvas.
	// get the image data and then copy it pixel by pixel to the new
	// clean canvas.

	// e.g. 
	// var ImgText = new Image();
	// ImgText.src="text3c.png";
	// ImgText.crossOrigin="";		// required so firefox doesn't generate CORS errors. :-)
	
	var target;
	var level;
	var internal_format;
	var width;
	var height;
	var border;
	var format;
	var type;
	var data;

	target 			= gl.TEXTURE_2D;
	level 			= 0;				// mipmap level (0 = base image)
	internal_format = gl.RGBA;
	width 			= image_object.width;
	height 			= image_object.height;
	border 			= 0;						// must be 0
	srcformat 		= internal_format;			// must match internal format ??
	srctype			= gl.UNSIGNED_BYTE;
	data 			= image_object;
//	data 			= canvas;

	gl.bindTexture(gl.TEXTURE_2D, texture_id);     // tell webgl to use this texture as its 'current' texture.

	gl.texImage2D
	(
		target,
		level,
		internal_format,
		srcformat,
		srctype,
		data
	);

	// to load pixel values from an array :
/*	gl.texImage2D
	(
		target,
		level,
		internal_format,
		width,
		height,
		border,
		format,
		type,
		image_object
	);
*/
	  // specify scaling hints.

	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		// tidy up afterwards.
	  gl.bindTexture(gl.TEXTURE_2D, null);

//	  WGL3D_TextureImg[i] = null;	// uploaded image, so don't need it anymore.
}

function WGL3D_LoadTexture(image_object)
{
	// *******************************************************************
	// ** NOTE : IMAGE ## MUST ## BE LOADED BEFORE CALLING THIS ROUTINE **
	// *******************************************************************

	// returns a texture 'index' to use when drawing with

		// TO DO: TEST FOR & REPORT FAILURE.
		
		// refs :
		// http://learningwebgl.com/blog/?p=507
		// https://developer.mozilla.org/en/WebGL/Using_textures_in_WebGL
	
	var i;
	var texture_id;
	
//	console.log (image_object);
	if (image_object.complete == false)
	{
		console.log ("image not fully loaded :" + image_object.src);
	}

	i = WGL3D_TextureInfo.length;
	WGL3D_TextureInfo[i] = new WGL3D_STRUCT_TEXTUREINFO(image_object);

	if (WGL3D_HardwareEnabled == true)
	{
		texture_id = gl.createTexture();
		_wgl3d_handleLoadedTexture(texture_id, image_object);
		WGL3D_TextureInfo[i].gpu_texture_id = texture_id;
	}

//WGL3D_TextureInfo[texture_idx].gpu_texture_id)
//	WGL3D_TextureInfo[i] = WGL3D_STRUCT_TEXTUREINFO (image_object);
//	if (WGL3D_HardwareEnabled == false)
//	{
		//this.img = new Image();
//		this.img.src = image_object.src;
//	}
//	this.width = image_object.width;
//	this.height= image_object.height;
//}

	
//	if (WGL3D_HardwareEnabled == false)
//	{
			// texture id is created from texture array buffer.
//		texture_id = WGL3D_2D_TextureBuffer.length;
	
//		WGL3D_2D_TextureBuffer[texture_id] = new Image();
//		WGL3D_2D_TextureBuffer[texture_id].src = image_object.src;
//	}
//	else
//	{
			// texture is created on the gpu.
//		texture_id = gl.createTexture();
//		_wgl3d_handleLoadedTexture(texture_id, image_object);
//	}
	
//	i = WGL3D_TextureId.length;
//	WGL3D_TextureId[i] = texture_id;
	
	return i;
}

	// ---------------------------------
	// ---- sprite drawing routines ----
	// ---------------------------------

//var WGL3D_MAX_SPRITES = 256;		// space for 256 2d sprites.

//function WGL3D_SpriteLayerStruct()
//{
//	this.max_sprites;
//	this.texture_id;
//	this.vertex_buffer_id;
//	this.vertex_array;
//	this.uv_buffer_id;
//	this.uv_array;
//}	

function WGL3D_InitSpriteLayer (layer_idx, max_sprites)
{
	// call this routine for each layer you want to initialise.

	// sprite coordinate data:

		// 0---1
		// | / |
		// 3---2

	var sl;
	var i;
	var tmp;

	if ((layer_idx < 0) || (layer_idx >= WGL3D_MAX_SPRITE_LAYERS))
	{
		console.log ("WGL3D_InitSpriteLater : idx out of range");
		return;
	}

	if ((max_sprites < 1) || (max_sprites >= WGL3D_MAX_SPRITES))
	{
		console.log ("WGL3D_InitSpritelayer : max sprites out of range");
		return;
	}
	
	i = layer_idx;
	SpriteLayerArray [i] = new WGL3D_SpriteLayerStruct();
	sl = SpriteLayerArray [i];
	
	sl.max_sprites = max_sprites;
	
//	if (WGL3D_HardwareEnabled == false)
//	{
//		WGL3D_2D_InitSpriteLayer (layer_idx, max_sprites);
//	}

	
		// ---
		// create Uint16 array for sprite 'face' info.
		// this buffer doesn't ever change, so just create & send to
		// the GPU (if available).

	tmp = [];

	i = 0;
	for (n = 0; n < max_sprites; n++)
	{
			// 2 triangular faces per sprite.

		tmp[i++] = (n*4) + 0;
		tmp[i++] = (n*4) + 1;
		tmp[i++] = (n*4) + 3;

		tmp[i++] = (n*4) + 1;
		tmp[i++] = (n*4) + 2;
		tmp[i++] = (n*4) + 3;
	}

	if (WGL3D_HardwareEnabled == false)
	{
		sl.face_buffer_id = null;
	}
	else
	{
				//ELEMENT_ARRAY_BUFFER
		id = gl.createBuffer();
			WGL3D_Error("WGL3D_InitSpriteLayer: index array gl.createBuffer()");
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id);
			WGL3D_Error("WGL3D_InitSpriteLayer: index array gl.bindBuffer()");
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tmp), gl.STATIC_DRAW);		// static draw, as it's not going to change.
			WGL3D_Error("WGL3D_InitSpriteLayer: index array gl.bufferData()");
	
		sl.face_buffer_id = id;		// WGL3D_SpriteFaces
	}


		// ---
		// create float32 array for sprite texture coords.
		// NOTE:this is held in ram, not on the gpu.

	tmp = [];
	i = 0;
	for (n = 0; n < max_sprites; n++)
	{
			// 2 uv coords per vertex, 4 vertices per sprite

		tmp[i++] = 0.0;
		tmp[i++] = 0.0;

		tmp[i++] = 1.0;
		tmp[i++] = 0.0;

		tmp[i++] = 1.0;
		tmp[i++] = 1.0;

		tmp[i++] = 0.0;
		tmp[i++] = 1.0;
	}

	sl.uv_array = new Float32Array (tmp);

		// now upload it to the gpu

	if (WGL3D_HardwareEnabled == false)
	{
		sl.uv_buffer_id = null;
	}
	else
	{
		id = gl.createBuffer();
			WGL3D_Error("WGL3D_InitSpriteLayer: uv buffer create");
		gl.bindBuffer(gl.ARRAY_BUFFER, id);
			WGL3D_Error("WGL3D_InitSpriteLayer: uv buffer bind");
		gl.bufferData(gl.ARRAY_BUFFER, sl.uv_array, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be buggering about with this buffer a lot !!
			WGL3D_Error("WGL3D_InitSpriteLayer: uv buffer data");
	
		sl.uv_buffer_id = id;
	}

		// ---
		// create float32 array for sprite vertices.
		// NOTE: this is held in ram, not on the gpu.

	tmp = [];
	i = 0;
	for (n = 0; n < max_sprites; n++)
	{
			// 4 vertices per sprite.
		tmp[i++] = -0.25;
		tmp[i++] = 0.25;
		tmp[i++] = 0;

		tmp[i++] = 0.25;
		tmp[i++] = 0.25;
		tmp[i++] = 0;

		tmp[i++] = 0.25;
		tmp[i++] = -0.25;
		tmp[i++] = 0;

		tmp[i++] = -0.25;
		tmp[i++] = -0.25;
		tmp[i++] = 0;
	}

	sl.vertex_array = new Float32Array (tmp);

		// upload to gpu.

	if (WGL3D_HardwareEnabled == false)
	{
		sl.vertex_buffer_id = null;
	}
	else
	{
		id = gl.createBuffer();
		WGL3D_Error();
		gl.bindBuffer(gl.ARRAY_BUFFER, id);
		WGL3D_Error();
		//	gl.bufferData(gl.ARRAY_BUFFER, WGL3D_SpriteVertexArray, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be changing this buffer a lot !!
		gl.bufferData(gl.ARRAY_BUFFER, sl.vertex_array, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be changing this buffer a lot !!
		WGL3D_Error();

		sl.vertex_buffer_id = id;
	}
}

var ggff = 0;
function WGL3D_SetSprite (layer_idx, sprite_idx, tu, tv, tw,th, sx, sy, sz, sw, sh)
{
	// sets the sprite data within the ram buffer for a sprite.

	// tu, tv, tw and th should be in the range 0 to 1.
	// sx,sy should also be in the range 0..1	
	// range for sz ==>  -1 <= sz < 1
	// sw,sh range = 0..1

	var s;
	var sl;
	var i;
	var f;
	var x0;
	var	y0;
	var x1;
	var y1;
	
	var cw;
	var ch;

	if ((layer_idx < 0) || (layer_idx >= SpriteLayerArray.length))
	{
		console.log ("WGL3D SetSprite : layer_idx out of range ya narna");
		return;
	}

	sl = SpriteLayerArray [layer_idx];


	if ((sprite_idx < 0) || (sprite_idx >= sl.max_sprites))		//WGL3D_MaxSprites))
	{
		if (ggff == 0)
		{
			console.log ("WGL3D SetSprite : sprite_idx out of range ya muppet " );
			console.log ("layer " + layer_idx + " sprite:" + sprite_idx + " max sprites:" + sl.max_sprites);
			console.log (sl);
			ggff = 1;
		}
		return;
	}

		// range of x coordinates for webgl go from -1 to +1

	x0 = sx;	//sx/cw;
	y0 = sy;
	x1 = sx + sw;
	y1 = sy - sh;

	i = sprite_idx * 12;

	s = sl.vertex_array;
	s[i++] = x0;
	s[i++] = y0;
	s[i++] = sz;

	s[i++] = x1;
	s[i++] = y0;
	s[i++] = sz;
	
	s[i++] = x1;
	s[i++] = y1;
	s[i++] = sz;

	s[i++] = x0;
	s[i++] = y1;
	s[i++] = sz;

	f = sl.uv_array;
	i = sprite_idx * 8;
	f[i++] = tu;
	f[i++] = tv;
	
	f[i++] = tu + tw;
	f[i++] = tv;
	
	f[i++] = tu + tw;
	f[i++] = tv + th;

	f[i++] = tu;
	f[i++] = tv + th;
}

function WGL3D_Sprite (layer_number, sprite_index, texture_id, tx, ty, tw, th, sx, sy, sw, sh)
{
	// convenience routine that takes pixel based values and converts
	// them to webgl ranges before calling SetSprite
	
/*
function WGL3D_STRUCT_TEXTUREINFO (image_object)
{
	this.img = null;
	if (WGL3D_HardwareEnabled == false)
	{
		this.img = new Image();
		this.img.src = image_object.src;
	}

	this.loaded = image_object.complete;

	this.gpu_texture_id = -1;			// gpu specific texture id.
	this.width = image_object.width;
	this.height= image_object.height;
}

//var WGL3D_TextureInfo = [];				// replaces TextureId with WGL3D_STRUCT_TEXTUREINFO
*/


	var u;
	var v;
	var w;
	var h;

	var texture_width;
	var texture_height;

	var canvas_width;
	var canvas_height;
	
	if ((texture_id < 0) || (texture_id >= WGL3D_TextureInfo.length))
	{
//		console.log ("tex buff len:" + WGL3D_2D_TextureBuffer.length);
		console.log ("WGL3D_Sprite ( : invalid texture id:" + texture_id);
		return;
	}

	canvas_width = webglCanvas.width;
	canvas_height = webglCanvas.height;

	texture_width = WGL3D_TextureInfo[texture_id].width;
	texture_height= WGL3D_TextureInfo[texture_id].height;
//	texture_width = WGL3D_2D_TextureBuffer[texture_id].width;
//	texture_height = WGL3D_2D_TextureBuffer[texture_id].height;

	u = tx / texture_width;
	v = ty / texture_height;

	tw /= texture_width;
	th /= texture_height;

	w = (sw*2) / canvas_width;
	h = (sh*2) / canvas_height;

	sx = (sx / canvas_width*2) - 1;
	sy = 1 - (sy / canvas_height*2);

	WGL3D_SetSprite (
		layer_number,			// layer_idx, 
		sprite_index,				// sprite_idx,
		u,v,			// tu, tv,
		tw,th,			// tw,th,
		sx, sy, 		// sx,sy
		0.0,			// sz
		w, h);			// sw, sh
}


//function WGL3D_SpriteLayerStruct()
//{
//	this.max_sprites;
//	this.texture_id;
//	this.vertex_buffer_id;
//	this.vertex_array;
//	this.uv_buffer_id;
//	this.uv_array;
//	this.face_buffer_id;
//}	

function WGL3D_DrawSpriteLayer (layer_idx, first_sprite_idx, number_of_sprites, texture_idx)
{
		// VALIDATE INPUTS !!! IMPORTANT !!!
		// VALIDATE INPUTS !!! IMPORTANT !!!
		// VALIDATE INPUTS !!! IMPORTANT !!!

		// draws *ALL* sprites defined for a layer.
		// added first & last so sprites can be assigned a texture index.
		// *** UNDER CONSTRUCTION ***

	var id;
	var sp;

	var sl;

	var dstByteOffset;
	var sprite_data_size;

	if ((layer_idx < 0) || (layer_idx >= SpriteLayerArray.length))
	{
		console.log ("WGL3D : DrawSpriteLayer : invalid layer idx");
		return;
	}

	if ((first_sprite_idx < 0) || (first_sprite_idx >= SpriteLayerArray[layer_idx].max_sprites))
	{
		console.log ("WGL3D : DrawSpritesLayer : invalid first sprite idx");
		return;
	}

	if (number_of_sprites < 0)
	{
		console.log ("WGL3D : DrawSpritesLayer : invalid number of sprites");
		return;
	}

	if ((first_sprite_idx+number_of_sprites) > SpriteLayerArray[layer_idx].max_sprites)
	{
//		console.log ("WGL3D : DrawSpritesLayer : first sprite + number of sprites exceeds array length");
//		console.log ("first sprite:" + first_sprite_idx);
//		console.log ("number_of_sprites:" + number_of_sprites);
//		console.log ("max sprites:" + SpriteLayerArray[layer_idx].max_sprites);
		return;
	}
	
	if (WGL3D_HardwareEnabled == false)
	{
		WGL3D_2D_DrawSpriteLayer (layer_idx, first_sprite_idx, number_of_sprites, texture_idx);
		return;
	}

	sl = SpriteLayerArray [layer_idx];

		// upload all the sprite buffer data to gpu
	data_size = 3 * 4 * 4;		// 3 floats per vertex, 4 vertices per sprite, 4 bytes per float = 3 * 4 * 4
	dstByteOffset = data_size * first_sprite_idx;
//	id = WGL3D_SpriteVertexBuffer;
	id = sl.vertex_buffer_id;
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	WGL3D_Error( "WGL3D_DrawAllSprites: 1000");
//	gl.bufferData(gl.ARRAY_BUFFER, WGL3D_SpriteVertexArray, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be buggering about with this buffer a lot !!
	gl.bufferSubData (gl.ARRAY_BUFFER, dstByteOffset, sl.vertex_array, first_sprite_idx, data_size * number_of_sprites);
	WGL3D_Error("WGL3D_DrawAllSprites:1001");

		// now upload texture uv data to the gpu

	data_size = 2 * 4 * 4;	// 2 floats per vertex, 4 vertices per sprite, 4 bytes per float.
	dstByteOffset = data_size * first_sprite_idx;
//	id = WGL3D_SpriteUVBuffer;
	id = sl.uv_buffer_id;
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	WGL3D_Error("WGL3D_DrawAllSprites:1002");
//	gl.bufferData(gl.ARRAY_BUFFER, WGL3D_SpriteUVArray, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be buggering about with this buffer a lot !!
	gl.bufferSubData (gl.ARRAY_BUFFER, dstByteOffset, sl.uv_array, first_sprite_idx, data_size * number_of_sprites);
	WGL3D_Error("WGL3D_DrawAllSprites:1003");

		// ---- now draw all sprites in one go.

	sp = ShaderProg_Sprites;
	gl.useProgram (sp);
	WGL3D_Error("WGL3D_DrawAllSprites:1004");
	
				// activate correct texture to use.
	gl.activeTexture(gl.TEXTURE0);              // use the first texture (numbers go from 0 - > 31
	WGL3D_Error("WGL3D_DrawAllSprites:1005");
//	console.log (WGL3D_TextureId[texture_idx]);
//	gl.bindTexture(gl.TEXTURE_2D, WGL3D_TextureId[texture_idx]);	//g_Texture);
	gl.bindTexture(gl.TEXTURE_2D, WGL3D_TextureInfo[texture_idx].gpu_texture_id);	//g_Texture);

	WGL3D_Error("WGL3D_DrawAllSprites:1006");

		// enable vertex buffer
//	id = WGL3D_SpriteVertexBuffer;
	id = sl.vertex_buffer_id;
	gl.bindBuffer(gl.ARRAY_BUFFER, id);					WGL3D_Error("2000");
	id = gl.getAttribLocation(sp, "vertexPosition");	WGL3D_Error("2001");
	if (id == -1)	alert ("vertexPosition attrib not found");
	gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0, 0);		WGL3D_Error("2002"); 		// 3 = number of floats per vertex.
	gl.enableVertexAttribArray(id);	WGL3D_Error("2003");
	gl.bindBuffer(gl.ARRAY_BUFFER, null);	WGL3D_Error("2004");

		//enable uv buffer

	//id = WGL3D_SpriteUVBuffer;
	id = sl.uv_buffer_id;
	gl.bindBuffer(gl.ARRAY_BUFFER, id);		WGL3D_Error("2005");
	id = gl.getAttribLocation(sp, "textureCoord");		WGL3D_Error("2006");
	if (id == -1)	alert ("textureCoord attrib not found");
	gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);		WGL3D_Error("2007");		// 2 = number of floats per uv coord.
	gl.enableVertexAttribArray(id); 	WGL3D_Error("2008");
	gl.bindBuffer(gl.ARRAY_BUFFER, null);	WGL3D_Error("2009");


		// draw *ALL* the sprites for a particular layer in one go.
		// use index array to draw all sprite triangles.

//	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, WGL3D_SpriteFaces); 	WGL3D_Error("bind faces");
	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, sl.face_buffer_id); 	WGL3D_Error("bind faces");
//	gl.drawElements(gl.TRIANGLES, WGL3D_MaxSprites*6, gl.UNSIGNED_SHORT, 0);			// for now, just draw TWO triangles. 
	gl.drawElements(gl.TRIANGLES, sl.max_sprites*6, gl.UNSIGNED_SHORT, 0);			// for now, just draw TWO triangles. 
//	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);			// for now, just draw TWO triangles. 
	WGL3D_Error("1007");
	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, null);	WGL3D_Error();


	
//	gl.drawElements(gl.TRIANGLES, WGL3D_MaxSprites * 6, gl.UNSIGNED_SHORT, 0);			// for now, just draw TWO triangles. 
//	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);			// for now, just draw TWO triangles. 
//	WGL3D_Error("1007");

//	gl.drawElements(gl.TRIANGLES, WGL3D_NumFaces[i], gl.UNSIGNED_SHORT, 0);
//	gl.drawElements(gl.TRIANGLES, , gl.UNSIGNED_SHORT, 0);
//	WGL3D_Error();
//	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, null);	WGL3D_Error();

}

function WGL3D_ClearSpriteLayer (layer_idx)
{
	// clears all the sprites for a layer by setting the z value to out of range.

	var i;
	var sl;
	var s;
	var lp;

	i = 0;
	sl = SpriteLayerArray [layer_idx];
	s = sl.vertex_array;
	for (lp = 0; lp < sl.max_sprites; lp++)
	{
		s[i+3] = 200;	// need this one for 2d sprite clearing.

		s[i] = 10000;
		s[i+2] = 200;
		s[i+5] = 200;
		s[i+8] = 200;
		s[i+11] = 200;
		i += 12;
	}
}

	// -------------------------------------------------------
	//	3D Line Drawing code - under construction.
	// -------------------------------------------------------

function WGL3D_Upload3DLines (line_data)
{
	// ** UNDER CONSTRUCTION **
		// line data is 2 pairs of 3D coordinates
		// x0,y0,z0 and x1,y1,z1.. etc...

	var id;

	if (wgl3d_NumMeshes == MAX_MESHES)	return -1;

	i = wgl3d_NumMeshes;
	wgl3d_NumMeshes++;

		// create new data buffer.
	id = gl.createBuffer();
	
	console.log ("3D LINES BUFFER ID :" + id);

		//Bind appropriate array buffer to it
	gl.bindBuffer (gl.ARRAY_BUFFER, id);
		// Pass the vertex data to the buffer
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(line_data), gl.STATIC_DRAW);
		// Unbind the buffer (not necessary, but lets be nice to other bits of code).
	gl.bindBuffer (gl.ARRAY_BUFFER, null);

	wgl3d_VertexBufferID[i] = id;
	wgl3d_IndexBufferID[i] = 0;
	wgl3d_InkBufferID[i] = 0;
	wgl3d_NumFaces[i] = line_data.length;	// stored for use in rendering.

	return i;	
}

function WGL3D_Draw3DLines (lines_id, line_width, r,g,b,a)
{
	// *** UNDER CONSTRUCTION ** draws lines
	// lines are all stored separately, uploaded to the gpu and 
	// then drawn together as one large array.
	
	var sp;
	var i;

	var coord;
	var loc_line_ink;
	
	if (lines_id == null)		//	if (line_id === undefined)		// type coercion makes this work !
	{
		console.log ("lines_id is null/undefined");
		return;
	}
	
	sp = ShaderProg_3DLine; 
	gl.useProgram(sp);

		// create model matrix for object.
	g_ModelMatrix = MatrixIdentity();
//	g_ModelMatrix = MatrixScale(g_ModelMatrix, sx, sy, sz);			// scaling lines makes no sense.??
//	g_ModelMatrix = MatrixRotate (g_ModelMatrix, rx, ry,rz);
//	g_ModelMatrix = MatrixTranslate (g_ModelMatrix, x,y,z);

	coord = gl.getUniformLocation(sp, "mViewMatrix");
	if (coord == -1)	alert ("draw3dlines: modelViewMatrix uniform not found");
	gl.uniformMatrix4fv(coord, false, g_ModelMatrix);
	
	coord = gl.getUniformLocation(sp, "cameraMatrix");
	if (coord == -1)	alert ("draw3dlines:cameraMatrix uniform not found");
	gl.uniformMatrix4fv(coord, false, g_Cam.cam_matrix);
	
	coord = gl.getUniformLocation(sp, "perspectiveMatrix");
	if (coord == -1)    alert ("draw3dlines:perspective matrix not found");
	gl.uniformMatrix4fv(coord, false, g_PerspectiveMatrix);
	
	loc_line_ink = gl.getUniformLocation(sp, "line_ink");
	if (loc_line_ink == -1)	alert ("draw3dlines : line_ink not found");
	gl.uniform4f(loc_line_ink, r/256,g/256,b/256,a/256);	//line_ink_rgba);

	gl.lineWidth(line_width);

	i = lines_id;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, wgl3d_VertexBufferID[i]);
	coord = gl.getAttribLocation(sp, "vertexPosition");
	if (coord == -1)	alert ("vertexPosition attrib not found");
	gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(coord);

         // Draw the points
	gl.drawArrays(gl.LINES, 0, wgl3d_NumFaces[i]/3);
}

function WGL3D_STRUCT_MODEL3D (vertex_array, face_array, ink_array, uv_array)
{
		// ** REDUNDANT ROUTINE ?????

		// creates a 3D model from vertex and face data.
		// the data in the structure depends on whether webgl is
		// enabled or not. 
		
		// assumes as a minimum, vertex_array, face_array and ink_array
		// all contain data. uv_array can be null
		
	var i;
	var lp;

	this.initial_verts =[];
	this.vertices =[];						// current (transformed) vertices
	this.faces =[];
	this.inks = [];
	this.uv = [];
	this.initial_normal = [];
	this.normal = [];

	this.matrix = MatrixIdentity();

	this.ia = 0.4;			// intensity of ambient light level

	this.red = 1.0;			// default object colour.
	this.green = 0.0;
	this.blue = 0.0;

	i = 0;
	for (lp = 0; lp < vertex_array.length; lp += 3)
	{
		this.initial_verts[i++] = vertex_array[lp];		// x
		this.initial_verts[i++] = vertex_array[lp+1];	// y
		this.initial_verts[i++] = vertex_array[lp+2];	// z
//		this.initial_verts[i++] = 1;							// w should be 1
	}

	for (lp = 0; lp < face_array.length; lp++)
	{
		this.faces[lp] = face_array[lp];
	}

	for (lp = 0; lp < face_array.length; lp++)
	{
		this.inks[lp] = ink_array[lp];
	}

	if (uv_array != null)
	{
		for (lp = 0; lp < uv_array.length; lp++)
		{
			this.uv[lp] = uv_array[lp];
		}
	}
	else
	{
		this.uv = null;		// no texture info, so no uv structure.
	}

/*
	var i;
	var lp;
	var v0;
	var v1;
	var v2;
	var v;
	var f;

	var vx;

	this.initial_verts =[];
	this.vertices =[];						// current (transformed) vertices
	this.faces =[];
	this.initial_normal = [];
	this.normal = [];
	
	this.matrix = MatrixIdentity();
	
	this.webgl_id = null;
	
	if (WGL3D_HardwareEnabled == true)
	{
		// need to create new vertex and face arrays
		// based on the original arrays so that each face has a 
		// unique set of vertices.. otherwise can't do flat shading.

		v = 0;
		f = 0;
		vx = 0;
		for (lp = 0; lp < face_array.length; lp += 3)
		{
			v0 = face_array[lp+0] * 3;
			v1 = face_array[lp+1] * 3;
			v2 = face_array[lp+2] * 3;
			
//			console.log ("v0:" + v0 + " v1:" + v1 + " v2:" + v2);
			
			this.initial_verts [v++] = vertex_array[v0+0];		// copy x,y,z data over
			this.initial_verts [v++] = vertex_array[v0+1];
			this.initial_verts [v++] = vertex_array[v0+2];
//			this.initial_verts [v++] = 1;							// w should be 1
//			v0 = v-3;

			this.initial_verts [v++] = vertex_array[v1+0];
			this.initial_verts [v++] = vertex_array[v1+1];
			this.initial_verts [v++] = vertex_array[v1+2];
//			this.initial_verts [v++] = 1;							// w should be 1
//			v1 = v-3;

			this.initial_verts [v++] = vertex_array[v2+0];
			this.initial_verts [v++] = vertex_array[v2+1];
			this.initial_verts [v++] = vertex_array[v2+2];
//			this.initial_verts [v++] = 1;							// w should be 1
//			v2 = v-3;

	//		v0 = lp; v1 = lp+1; v2 = lp+2;
//			console.log ("v'0:" + v0 + " v'1:" + v1 + " v'2:" + v2);

			this.faces[f+0] = f;	//v0;
			this.faces[f+1] = f+1;	//v1;
			this.faces[f+2] = f+2;	//v2;
			f += 3;
		}

		for (f = 0; f < (this.initial_verts.length/3); f += 3)
		{
			this.faces[f+0] = f;
			this.faces[f+1] = f+1;
			this.faces[f+2] = f+2;
		}

		this.inks = [];
		for (lp = 0; lp < this.faces.length*3; lp++)
		{
			this.inks[lp] = 0.3 + (Math.random() * 0.8);	// random colours for testing.
		}
		
//		console.log ("verts:");
//		console.log (this.initial_verts);
//		console.log ("faces:");
//		console.log (this.faces);
			// load all the data to the graphics card.
		this.webgl_id = WGL3D_UploadModelData (this.initial_verts, this.faces, this.inks, null, null);

		return;	// end of webgl inits.
	}

	this.ia = 0.4;			// intensity of ambient light level

	this.red = 1.0;			// default object colour.
	this.green = 0.0;
	this.blue = 0.0;

	this.r = [];		// per face colours
	this.g = [];
	this.b = [];

	i = 0;
	for (lp = 0; lp < vertex_array.length; lp += 3)
	{
		this.initial_verts[i++] = vertex_array[lp];		// x
		this.initial_verts[i++] = vertex_array[lp+1];	// y
		this.initial_verts[i++] = vertex_array[lp+2];	// z
		this.initial_verts[i++] = 1;							// w should be 1
	}

	for (lp = 0; lp < face_array.length; lp++)
	{
		this.faces[lp] = face_array[lp];
	}

	i = 0;
	for (lp = 0; lp < face_array.length; lp += 3)
	{
		this.r[i] = this.ia;
		this.g[i] = this.ia;
		this.b[i] = this.ia;
		i++;
	}
*/
}

