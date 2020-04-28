/*

	Title	:	WebGL wrapper routines.

	Info	:	Version 0.0	6th April 2020

	Author	:	Nick Fleming

	Updated	:	27th April 2020


	 Notes:
	--------
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


*/

var WGL3D_MAX_MESHES = 16;		// used to limit the amount sent to the gpu

var WGL3D_MAX_SPRITES = 64;			// number of 2D sprites PER LAYER
var WGL3D_MAX_SPRITE_LAYERS = 2;	// one texture per layer.

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

var WGL3D_ID_VertexBuffers = [];	// id's for gpu buffer objects.
var WGL3D_ID_IndexBuffers = [];
var WGL3D_ID_InkBuffers = [];

var WGL3D_NumFaces = [];


var WGL3D_TextureId = [];
var WGL3D_TextureImg = [];			// temp image stores.


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

	gl = webglCanvas.getContext("experimental-webgl");		// Opera still wants this ??.
	if (!gl)
	{
		gl = webglCanvas.getContext("webgl");						// Firefox accepts this.
	}
	
	if (!gl)
	{
		console.log ("***ERROR ** webgl not available");
		return false;
	}

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

		// Create the projection matrix - only needs to be done once, so I've put it here !

	console.log ("webgl " + webglCanvas.width + " " + webglCanvas.height);
	g_PerspectiveMatrix = Matrix_CreatePerspectiveProjectionMatrix (
		webglCanvas.width, 			// width in pixels
		webglCanvas.height, 		// height in pixels
			30.0,					// field of view (degrees)
			1,						// near z
			1000);					// far z

	console.log ("g_PerspectiveMatrix");
	console.log (g_PerspectiveMatrix);

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
	gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	WGL3D_Error();
}

	// =========================================================
	//		---- 3D object drawing routines ----
	// =========================================================
	
function WGL3D_StartDraw()
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

function WGL3D_EndDraw()
{
}

function WGL3D_DrawObject(mesh_id, model_matrix)
{
	// uses webgl routines to display a mesh using the supplied model matrix.
	var i;

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
	
	console.log (image_object);
	if (image_object.complete == false)
	{
		console.log ("image not fully loaded :" + image_object.src);
	}

	texture_id = gl.createTexture();

	i = WGL3D_TextureId.length;
	WGL3D_TextureId[i] = texture_id;
	
	_wgl3d_handleLoadedTexture(texture_id, image_object);	//image, texture)
	

//	WGL3D_TextureImg[i] = image_object;
//	WGL3D_TextureImg[i].src=texture_image_data_source;
//	WGL3D_TextureImg[i].onload = function(){_wgl3d_handleLoadedTexture(i);};
	
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

//	womble
	if ((max_sprites < 1) || (max_sprites >= WGL3D_MAX_SPRITES))
	{
		console.log ("WGL3D_InitSpritelayer : max sprites out of range");
		return;
	}

	i = layer_idx;
	SpriteLayerArray [i] = new WGL3D_SpriteLayerStruct();
	sl = SpriteLayerArray [i];
	
	sl.max_sprites = max_sprites;
	
		// ---
		// create Uint16 array for sprite 'face' info.
		// this buffer doesn't ever change, so just create & send to
		// the GPU.

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

		//ELEMENT_ARRAY_BUFFER

	id = gl.createBuffer();
		WGL3D_Error("WGL3D_InitSpriteLayer: index array gl.createBuffer()");
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id);
	 	WGL3D_Error("WGL3D_InitSpriteLayer: index array gl.bindBuffer()");
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tmp), gl.STATIC_DRAW);		// static draw, as it's not going to change.
		WGL3D_Error("WGL3D_InitSpriteLayer: index array gl.bufferData()");
	
	sl.face_buffer_id = id;		// WGL3D_SpriteFaces


		// ---
		// create float32 array for sprite texture coords.
		// this is held in ram, not on the gpu.

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

	id = gl.createBuffer();
		WGL3D_Error("WGL3D_InitSpriteLayer: uv buffer create");
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
		WGL3D_Error("WGL3D_InitSpriteLayer: uv buffer bind");
	gl.bufferData(gl.ARRAY_BUFFER, sl.uv_array, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be buggering about with this buffer a lot !!
		WGL3D_Error("WGL3D_InitSpriteLayer: uv buffer data");
	
	sl.uv_buffer_id = id;

		// ---
		// create float32 array for sprite vertices.
		// this is held in ram, not on the gpu.

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
	
	id = gl.createBuffer();
	WGL3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	WGL3D_Error();
//	gl.bufferData(gl.ARRAY_BUFFER, WGL3D_SpriteVertexArray, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be changing this buffer a lot !!
	gl.bufferData(gl.ARRAY_BUFFER, sl.vertex_array, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be changing this buffer a lot !!
	WGL3D_Error();

	sl.vertex_buffer_id = id;
}

function WGL3D_SetSprite (layer_idx, sprite_idx, tu, tv, tw,th, sx, sy, sz, sw, sh)
{
	// sets the sprite data.

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
		console.log ("WGL3D SetSprite : layer_idx out of range ya muppet");
		return;
	}

	sl = SpriteLayerArray [layer_idx];


	if ((sprite_idx < 0) || (sprite_idx >= sl.max_sprites))		//WGL3D_MaxSprites))
	{
		console.log ("WGL3D SetSprite : sprite_idx out of range ya muppet");
		return;
	}


//	cw = webglCanvas.width;
//	ch = webglCanvas.height;

		// range of x coordinates for webgl go from -1 to +1

	x0 = sx;	//sx/cw;
	y0 = sy;
	x1 = sx + sw;
	y1 = sy - sh;

	i = sprite_idx * 12;
//	s = WGL3D_SpriteVertexBuffer;
//	s = WGL3D_SpriteVertexArray;
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

//	f = WGL3D_SpriteUVArray;
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
	gl.bindTexture(gl.TEXTURE_2D, WGL3D_TextureId[texture_idx]);	//g_Texture);
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
		s[i] = 10000;
		s[i+2] = 100;
		s[i+5] = 100;
		s[i+8] = 100;
		s[i+11] = 100;
		i += 12;
	}
}

/*	
function WGL3D_InitSpriteBuffer (max_sprites)
{
			// **** UNDER CONSTRUCTION ****

	// note.. although all sprites are 2D.. storing z coordinate
	// for easy hardware based z sorting of sprites.

	// sprite coordinate data:

		// 0---1
		// | / |
		// 3---2

	// what this routine does is create and reserve space for sprites
	// on the GPU. It only needs to be called *ONCE* at the start
	// of a program.
	
	// it creates 2 buffers, one for vertex data, the other for 
	// texture..

	var id;
	var i;
	var n;
	var tmp;
	
	WGL3D_MaxSprites = max_sprites;
	
		// create float32 array for sprite 'face' info.
		// this buffer doesn't ever change.

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

	//ELEMENT_ARRAY_BUFFER
	id = gl.createBuffer();
	WGL3D_Error("WGL3D_InitSpriteBuffer: index array gl.createBuffer()");
//	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id); 	WGL3D_Error("WGL3D_InitSpriteBuffer: index array gl.bindBuffer()");
//	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);		// static draw, as it's not going to change.
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tmp), gl.STATIC_DRAW);		// static draw, as it's not going to change.
	WGL3D_Error("WGL3D_InitSpriteBuffer: index array gl.bufferData()");
	
	WGL3D_SpriteFaces = id;

		// create float32 array for sprite texture coords.

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

	WGL3D_SpriteUVArray = new Float32Array (tmp);

		// now upload it to the gpu

	id = gl.createBuffer();
	WGL3D_Error("uv buffer create");
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	WGL3D_Error("uv buffer bind");
	gl.bufferData(gl.ARRAY_BUFFER, WGL3D_SpriteUVArray, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be buggering about with this buffer a lot !!
	WGL3D_Error("uv buffer data");
	
	WGL3D_SpriteUVBuffer = id;

		// create float32 array for sprite vertices.

	tmp = [];
	i = 0;
	for (n = 0; n < max_sprites; n++)
	{
			// 4 vertices per sprite.
		tmp[i++] = -0.5;
		tmp[i++] = 0.5;
		tmp[i++] = 0;

		tmp[i++] = 0.5;
		tmp[i++] = 0.5;
		tmp[i++] = 0;

		tmp[i++] = 0.5;
		tmp[i++] = -0.5;
		tmp[i++] = 0;

		tmp[i++] = -0.5;
		tmp[i++] = -0.5;
		tmp[i++] = 0;
	}

	WGL3D_SpriteVertexArray = new Float32Array (tmp);

		// upload to gpu.
	
	id = gl.createBuffer();
	WGL3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	WGL3D_Error();
	gl.bufferData(gl.ARRAY_BUFFER, WGL3D_SpriteVertexArray, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be changing this buffer a lot !!
	WGL3D_Error();

	WGL3D_SpriteVertexBuffer = id;

}
*/
	// .. _DrawSprite .. which adds sprite data to
	// the internal sprite data lists.

	// _DrawAllSprites
	// which handles the job of drawing all sprites to the display.

/*
function WGL3D_DrawAllSprites(first_sprite_id, last_sprite_id, texture_idx)
{
		// draws all sprites defined.
		// added first & last so sprites can be assigned a texture index.
		// *** UNDER CONSTRUCTION ***

	var id;
	var sp;
	

		// upload sprite buffer data to gpu
	
	id = WGL3D_SpriteVertexBuffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	WGL3D_Error( "1000");
	gl.bufferData(gl.ARRAY_BUFFER, WGL3D_SpriteVertexArray, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be buggering about with this buffer a lot !!
	WGL3D_Error("1001");

		// now upload texture uv data to the gpu

	id = WGL3D_SpriteUVBuffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, id);
	WGL3D_Error("1002");
	gl.bufferData(gl.ARRAY_BUFFER, WGL3D_SpriteUVArray, gl.DYNAMIC_DRAW);		// dynamic hint.. we will be buggering about with this buffer a lot !!
	WGL3D_Error("1003");

		// ---- now draw all sprites in one go.

	sp = ShaderProg_Sprites;
	gl.useProgram (sp);
	WGL3D_Error("1004");
	
				// activate correct texture to use.
	gl.activeTexture(gl.TEXTURE0);              // use the first texture (numbers go from 0 - > 31
	WGL3D_Error("1005");
//	console.log (WGL3D_TextureId[texture_idx]);
	gl.bindTexture(gl.TEXTURE_2D, WGL3D_TextureId[texture_idx]);	//g_Texture);
	WGL3D_Error("1006");


		// enable vertex buffer
	id = WGL3D_SpriteVertexBuffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, id);					WGL3D_Error("2000");
	id = gl.getAttribLocation(sp, "vertexPosition");	WGL3D_Error("2001");
	if (id == -1)	alert ("vertexPosition attrib not found");
	gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0, 0);		WGL3D_Error("2002"); 		// 3 = number of floats per vertex.
	gl.enableVertexAttribArray(id);	WGL3D_Error("2003");
	gl.bindBuffer(gl.ARRAY_BUFFER, null);	WGL3D_Error("2004");

		//enable uv buffer

	id = WGL3D_SpriteUVBuffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, id);		WGL3D_Error("2005");
	id = gl.getAttribLocation(sp, "textureCoord");		WGL3D_Error("2006");
	if (id == -1)	alert ("textureCoord attrib not found");
	gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);		WGL3D_Error("2007");		// 2 = number of floats per uv coord.
	gl.enableVertexAttribArray(id); 	WGL3D_Error("2008");
	gl.bindBuffer(gl.ARRAY_BUFFER, null);	WGL3D_Error("2009");


		// use index array to draw all sprite triangles.

	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, WGL3D_SpriteFaces); 	WGL3D_Error("bind faces");
	gl.drawElements(gl.TRIANGLES, WGL3D_MaxSprites*6, gl.UNSIGNED_SHORT, 0);			// for now, just draw TWO triangles. 
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
*/

/*
function WGL3D_DrawSprite (px,py, texture_id)
{
	// **** UNDER CONSTRUCTION ****
	// x,y,w,h = position & size in pixels.
	// texture_id = index into texture data to use.
	var x0;
	var y0;
	var x1;
	var y1;
	
	var tx0;
	var ty0;
	var tx1;
	var ty1;
	
	var a_idx;
	
	var t_idx;
	var v_idx;
	var i_idx;
	var i4;
	
	var spr_width;
	var spr_height;
	
	a_idx = texture_id;
	tx0 = zzz_atlas[a_idx][0];
	ty0 = zzz_atlas[a_idx][1];
	spr_width = zzz_atlas[a_idx][2];
	spr_height= zzz_atlas[a_idx][3];
	tx1 = tx0 + spr_width-1;
	ty1 = ty0 + spr_height-1;
	tx0 /= 256.0;					// convert to texture uv coordinates.
	ty0 /= 256.0;
	tx1 /= 256.0;
	ty1 /= 256.0;

//	alert ("px:"+px + " py:" + py + " tx:"+ texture_id + " w:"+spr_width + " h:"+spr_height);
	
	t_idx = 0;
	texCoords[t_idx++] = tx0; texCoords[t_idx++] = ty0;
	texCoords[t_idx++] = tx1; texCoords[t_idx++] = ty0;
	texCoords[t_idx++] = tx0; texCoords[t_idx++] = ty1;
	texCoords[t_idx++] = tx1; texCoords[t_idx++] = ty1;

	x0 = -1.0 + (px * (2.0/WGL3D_CANVAS_WIDTH));
	y0 =  1.0 - (py * (2.0 / WGL3D_CANVAS_HEIGHT));

	x1 = x0 + (spr_width * (2.0 / WGL3D_CANVAS_WIDTH));
	y1 = y0 - (spr_height * (2.0 / WGL3D_CANVAS_HEIGHT));

	v_idx = 0;
	SpriteVertices[v_idx++] = x0;	SpriteVertices[v_idx++] = y0;
	SpriteVertices[v_idx++] = x1;	SpriteVertices[v_idx++] = y0;
	SpriteVertices[v_idx++] = x0;	SpriteVertices[v_idx++] = y1;
	SpriteVertices[v_idx++] = x1;	SpriteVertices[v_idx++] = y1;

	i_idx = 0;
	i4 = 0;		// = i * 4
	spr_indices [i_idx++] = i4;	spr_indices [i_idx++] = i4+1;	spr_indices [i_idx++] = i4+2;	// 1st triangle index
	spr_indices [i_idx++] = i4+1;	spr_indices [i_idx++] = i4+3;	spr_indices [i_idx++] = i4+2;

		// --- draw all sprites bit ---
	gl.useProgram (ShaderProg_Sprites);

		// activate correct texture to use.
	gl.activeTexture(gl.TEXTURE0);              // use the first texture (numbers go from 0 - > 31
	gl.bindTexture(gl.TEXTURE_2D, g_Texture);

		// load up the buffers (this will be eventually moved to drawallsprites)
	gl.bindBuffer(gl.ARRAY_BUFFER, g_SpriteUVBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
//	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.bindBuffer(gl.ARRAY_BUFFER, g_SpriteVertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SpriteVertices), gl.STATIC_DRAW);
//	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_SpriteIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(spr_indices), gl.STATIC_DRAW);
//	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		// bind the attributes...
	gl.bindBuffer(gl.ARRAY_BUFFER, g_SpriteVertexBuffer);
	var coord = gl.getAttribLocation(ShaderProg_Sprites, "spritecoord");
	if (coord == -1)	alert ("spritecoord attrib not found");
	gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(coord);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, g_SpriteUVBuffer);
	var uv = gl.getAttribLocation(ShaderProg_Sprites, "aTextureCoord");
	if (uv == -1)	alert ("aTextureCoord attrib not found");
	gl.vertexAttribPointer (uv, 2, gl.FLOAT, false, 0, 0);	// tell gl about where to get the data and how to read it.
	gl.enableVertexAttribArray (uv);

//	var loc = gl.getUniformLocation (ShaderProg_Sprites, "uSampler");		// only need this once too ???.. ensure glUseProgram called first.
//	if (loc < 0)	printf ("uSampler not found\n");
//	gl.uniform1i(loc, 0);  // tell the shader to use texture 0 too.

		// draw stuff
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_SpriteIndexBuffer);
	gl.drawElements (gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);	//g_SpriteIndexBuffer);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	* 
	* https://imgur.com/gallery/JWWujgH
*/
//}

/*
function WGL3D_SetSprite (sprite_idx, texture_index, tu, tv, tw,th, sx, sy, sz, sw, sh)
{
	// sets the sprite data.
	// tu, tv, tw and th should be in the range 0 to 1.
	// sx,sy should be canvas screen coordinates.
	// this routine will do the conversion to webgl.
	// sw, sh should be pixel sizes
	// sz is the depth value.

	var s;
	var i;
	var f;
	var x0;
	var	y0;
	var x1;
	var y1;
	
	var cw;
	var ch;

	if ((sprite_idx < 0) || (sprite_idx >= WGL3D_MaxSprites))
	{
		console.log ("WGL3D SetSprite : idx out of range ya muppet");
		return;
	}
	
	cw = webglCanvas.width;
	ch = webglCanvas.height;

		// range of x coordinates for webgl go from -1 to +1
	x0 = sx;	//sx/cw;
	y0 = sy;
	x1 = sx + sw;
	y1 = sy - sh;

	i = sprite_idx * 12;
//	s = WGL3D_SpriteVertexBuffer;
	s = WGL3D_SpriteVertexArray;
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

	f = WGL3D_SpriteUVArray;
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

*/
