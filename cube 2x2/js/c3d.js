/*

	Title	:	Canvas 3D stuff.

	Info	:	Version 0.0	27th December 2022

	Author	:	Nick Fleming

	Updated	:	9th January 2023


	 To Use:
	---------

	C3D_Init(canvas_id, preferred_context_type)
		- to initialise	everything. This routine only needs to be called once.


	C3D_UploadModelData (verts, faces, inks, normals, uvs)
		- to load model data. 


	C3D_DrawObject (object_id, model_matrix, normal_matrix)
		- to draw a loaded object on the screen.


	 Notes:
	--------


	 27th December 2022
	---------------------
		Pulling some useful 3D code from my shadow buffer demo and
	other 3D stuff into	one place.

		Might try and combine webgl and canvas rendering from the
	outset to keep things as flexible as possible.

		moved calcNormal to STRUCT_NORMAL function prototype.

	.. its possible to render webgl to an offscreen canvas and then
	use drawImage to copy it to a normal 2d canvas. could be useful
	for split screen games ??

	For now, only supporting rendering to a single canvas.
	WebGL2 is also not supported for the same reason - resources are limited !!

	 28th December 2022
	----------------------
		Testing line drawing code - get the same output for both
	canvas and webgl (which is nice !). Lines are always 1 pixel thick
	as this is a webgl/hardware setting that can't be changed.

	 Next task is to get flat shaded 3D triangles working - no point
	sticking with 2D as you can just use a 2D canvas for that.

	 Object Buffer Array...
	------------------------
		For 2D each array entry stores all the vertex,face,ink data
	for each object. For the webgl version, it stores id's for the
	uploaded model data.



	 29th December 2022
	---------------------
	The problem with the original draw list was having to copy the
	triangle data into the draw list itself, which potentially means
	moving a lot of data. This version, only the index to the triangle
	data is stored in the draw list. The generated data itself is now
	stored in the object structure ... however.. the draw list needs
	to contain data from many different objects.. so perhaps the
	data should be stored there ???

	ALL THE ABOVE IS **WRONG**	* wrong !! * wrong !!* wrong !!
	
	.. Each 3D object base can be used many times (same
	base, different model matrix).. SO... 

	THE TRANSFORMED DATA *MUST*	BE MOVED TO THE DRAW LIST !!

	This is the mistake I made with earlier 3D tests !!!

	Construction of an efficient draw list is proving to be harder
	than first thought.. :-/


	 30th December 2022
	--------------------

		Still working on the draw list problem - I think I will move
	the draw list data to this file, while storing its index and z
	value in the draw list.
	

	 31st December 2022
	------------------------
		Implementing draw list mostly in this file, using my generic
	draw list code just to generate the z order - since it is now
	basically a sorting routine, might look at it again sometime to
	see if it can be improved.

	 1st January 2023
	-------------------
	Finally added draw list code.. initial tests indicate.. it works!

	 2nd January 2023
	-------------------
		Working on being able to convert mouse coordinates to world
	coordinates by casting a ray through space from the camera position
	in the mouse direction.

	 5th January 2023
	-------------------
	Done some picking tests.. appears to work, so now going to try and
	implement it somehow.

	for triangle intersection : (i've used this code:)
	https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm

	 6th January 2023
	------------------
	Checking results of picking tests.. screen point appears to be 
	between the camera position and the look at point.. so initial
	tests would appear to indicate it is sort of working ok.

	 8th January 2023
	------------------
		Updated code to use projection specific inverse matrix code
	as it uses fewer calculations than the generalised matrix inverse.


	 9th January 2023
	-------------------
		Still doing picking tests.. spent all day on this.. hopefully
	I've now got it right.. nightmare !!


*/

var C3D_MAX_MESHES = 16;
var C3D_MAX_DRAWDATA_SIZE = (2048 * 3);
var C3D_2D_MAX_BUCKETS = 1024;

var _ct = 0;
var C3D_TYPE_NONE = _ct++;
var C3D_TYPE_WEBGL2 = _ct++;
var C3D_TYPE_WEBGL = _ct++;
var C3D_TYPE_2D = _ct++;
var C3D_TYPE_SCRBUFFER = _ct++;		// defined for future use

var _C3D_UseGL = false;		// internal stuff.
var _C3D_CanvasType = C3D_TYPE_NONE;
var gl = null;			// context for drawing with.

	// draw list structures.
var _C3D_DrawList;						// z sorted list of indices to draw.
var _C3D_DrawData;						// triangle drawing data buffer.
var _C3D_DrawDataSize;					// size of the draw data used
var _C3D_BackfaceCullEnabled = true;

var _C3D_PerspectiveMatrix;				// for 2D & 3D rendering.
var _C3D_InversePerspectiveMatrix;		// for picking.

	// -------------------------------------------------
	// 		---- WebGL vars ----
	// -------------------------------------------------

var ShaderProg_WhiteTriangles;
var ShaderProg_2DGradients;				// simple 2D shader with gradients
var ShaderProg_3DFlat;
var ShaderProg_Sprites;
var ShaderProg_3D;					// flat shading, but with colour interpolation between vertices.
var ShaderProg_3D_Gouraud;			// first proper shading with per-vertex calculations
var ShaderProg_3D_Phong;

var ShaderProg_Shadows1;
var ShaderProg_Shadows2;
var ShaderProg_Points;
var ShaderProg_PointCircle;

var ShaderProgLine;
var ShaderProg_3DLine;

var C3D_CurrentShaderProg = null;	// this seems to be a wrong approach.

var g_PointBuffer;					// for drawing lines with.

var ObjectBuffer = [];			// for drawing/storing object info with.

function STRUCT_OBJECT (vertex_id, face_id, ink_id, normal_id, uv_id)
{
	this.vid = vertex_id;
	this.fid = face_id;
	this.iid = ink_id;
	this.nid = normal_id;
	this.uvid = uv_id;
}


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
	//	----  3D Flat Shaded Triangles ----
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
	// 3D Texture Mapped Triangles (with per vertex rgb gouroud shading
	//--------------------------------------------------

var vs_3d_textured =
	"	attribute vec3 vertexPosition;"+
	"	attribute vec2 textureCoord;"+
	"	attribute vec4 vertexInk;"+

	"	uniform mat4 modelViewMatrix;"+
	"	uniform mat4 perspectiveMatrix;"+

	"	varying vec4 vColor;"+
	"	varying mediump vec2 vTextureCoord;"+		// mediump ?

	"	void main(void)"+
	"	{"+							    // for 2D stuff, set z value to 0.0 and set w value to 1
	"		gl_Position = perspectiveMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);"+
	"		vColor = vertexInk;"+
	"		vTextureCoord = textureCoord;"+
	"	}"
	;

var fs_3d_textured =
	"	precision mediump float;"+
	"	uniform sampler2D texture;"+		// sampler is a data type used to access the texture.
	"	varying vec4 vColor;"+
	"	varying vec2 vTextureCoord;"+		// this is the texture coord.
	"	void main(void)"+
	"	{"+
	"  		gl_FragColor = texture2D(texture, vTextureCoord) *  vColor;"+
	"	}"
	;

	//--------------------------------------------------
	// 3D Texture Mapped Triangles (with gouraud shading)
	//--------------------------------------------------

var vs_3d_gouraud_textured =

		// this works but really needs work to remove any potential
		// pipeline stalls (calculation dependencies).

	"	attribute vec3 vertexPosition;"+
	"	attribute vec2 textureCoord;"+
	"	attribute vec4 vertexInk;"+
	"	attribute vec3 normal;"+			// must be a unit vector

	"	uniform mat4 modelViewMatrix;"+
	"	uniform mat4 perspectiveMatrix;"+
	"	uniform mat4 normalMatrix;"+
	"	uniform vec3 lightvec;"+
	"	uniform vec4 ambient;"+			// ambient light level r,g,b,a rgb=[0..1] a=1

	"	varying vec4 vColor;"+
	"	varying mediump vec2 vTextureCoord;"+		// mediump ?
//	"	varying vec3 vnormalInterp;"+

	"	void main(void)"+
	"	{"+							    // for 2D stuff, set z value to 0.0 and set w value to 1
	"		gl_Position = perspectiveMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);"+
	"		float d = 0.75 * dot (mat3(normalMatrix)*normal, lightvec);"+
	"		vColor = (vertexInk * ambient) + (vertexInk * vec4(d,d,d,1.0));"+	// + (vertexInk * vec40.5 * dot(normal,lightvec));"+			// note this does component wise multiply.
//	"		vColor = (vertexInk * ambient) + (vertexInk * vec4(d,d,d,1.0));"+	// + (vertexInk * vec40.5 * dot(normal,lightvec));"+			// note this does component wise multiply.
//	"		vColor = (vertexInk * ambient) + (vertexInk * vec40.5 * dot(normal,lightvec));"+			// note this does component wise multiply.
	"		vTextureCoord = textureCoord;"+
//	"		vnormalInterp = vec3(normalMatrix * vec4(normal, 0.0));"+
	"	}"
	;

var fs_3d_gouraud_textured =
	"	precision mediump float;"+
	"	uniform sampler2D texture;"+		// sampler is a data type used to access the texture.
	"	varying vec4 vColor;"+
	"	varying vec2 vTextureCoord;"+		// this is the texture coord.
//	"	varying vec4 vnormalInterp;"+
	"	void main(void)"+
	"	{"+
	"  		gl_FragColor = texture2D(texture, vTextureCoord) *  vColor;"+
	"	}"
	;

	//--------------------------------------------------
	// 3D Texture Mapped Triangles (with phong shading)
	//--------------------------------------------------

var vs_3d_phong_textured =
	"	attribute vec3 vertexPosition;"+
	"	attribute vec2 textureCoord;"+
	"	attribute vec4 vertexInk;"+
	"	attribute vec3 normal;"+

	"	uniform mat4 modelViewMatrix;"+
	"	uniform mat4 perspectiveMatrix;"+
	"	uniform mat4 normalMatrix;"+

	"	varying vec4 vColor;"+
	"	varying mediump vec2 vTextureCoord;"+		// mediump ?
	"	varying vec3 normalInterp;"+

	"	void main(void)"+
	"	{"+							    // for 2D stuff, set z value to 0.0 and set w value to 1
	"		gl_Position = perspectiveMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);"+
	"		vColor = vertexInk;"+
	"		vTextureCoord = textureCoord;"+
	"		normalInterp = vec3(normalMatrix * vec4(normal, 0.0));"+
	"	}"
	;

var fs_3d_phong_textured =
	"	precision mediump float;"+
	"	uniform sampler2D texture;"+		// sampler is a data type used to access the texture.
	"	varying vec4 vColor;"+
	"	varying vec2 vTextureCoord;"+		// this is the texture coord.
	"	void main(void)"+
	"	{"+
	"  		gl_FragColor = texture2D(texture, vTextureCoord) *  vColor;"+
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


	//--------------------------------------------------
	// vertex and frag shader for shadow maps.
	//--------------------------------------------------

	// note : 1st pass vertex shader only calculates the position.
	// It doesn't handle any colour or lighting processing here.


var vs_shadow_shader_1st_pass =
	"	attribute vec3 vertexPosition;"+
	"	uniform mat4 modelViewMatrix;"+			// this is the matrix for the light view.
	"	uniform mat4 perspectiveMatrix;"+
	"	void main(void)"+
	"	{"+							    // for 2D stuff, set z value to 0.0 and set w value to 1
	"		gl_Position = perspectiveMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);"+
	"	}"
	;

var fs_shadow_shader_1st_pass =
	"precision mediump float;"+
	"void main(void)"+
	"{"+
//	"	gl_FragColor = vec4 (gl_FragCoord.z/1000.0, 0.0, 0.0 ,1.0);"+		// just doing something to keep compiler happy.
	"	gl_FragColor = vec4 (1.0, 1.0, 1.0, 1.0);"+							// just a write to keep the compiler happy.
	"}"
	;

	// for now, this code is identical to vs_3d_gouraud_textured + shadows.
var vs_shadow_shader_2nd_pass =
	"	attribute vec3 vertexPosition;"+
	"	attribute vec2 textureCoord;"+
	"	attribute vec4 vertexInk;"+
	"	attribute vec3 normal;"+			// must be a unit vector

	"	uniform mat4 modelViewMatrix;"+
	"	uniform mat4 lightViewMatrix;"+
	"	uniform mat4 perspectiveMatrix;"+
	"	uniform mat4 normalMatrix;"+
	"	uniform vec3 lightvec;"+			// for diffuse light calculations
	"	uniform vec4 ambient;"+			// ambient light level r,g,b,a rgb=[0..1] a=1

	"	varying vec4 vColor;"+
	"	varying mediump vec2 vTextureCoord;"+		// mediump ?
	"   varying vec4 vShadowCoord;"+		// shadow coord.

	"	void main(void)"+
	"	{"+							    // for 2D stuff, set z value to 0.0 and set w value to 1
	"		gl_Position = perspectiveMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);"+
	"		vShadowCoord = perspectiveMatrix * lightViewMatrix * vec4(vertexPosition, 1.0);"+
	"		float d = 0.75 * dot (mat3(normalMatrix)*normal, lightvec);"+
	"		vColor = (vertexInk * ambient) + (vertexInk * vec4(d,d,d,1.0));"+	// + (vertexInk * vec40.5 * dot(normal,lightvec));"+			// note this does component wise multiply.
	"		vTextureCoord = textureCoord;"+
	"	}"
	;

	// womble

var fs_shadow_shader_2nd_pass =
	"	precision mediump float;"+
	"	uniform sampler2D texture;"+		// sampler is a data type used to access the texture.
	"	uniform sampler2D shadowmap;"+
	"	varying vec4 vColor;"+
	"	varying vec2 vTextureCoord;"+		// this is the texture coord.
	"   varying vec4 vShadowCoord;"+		// shadow coord.

	"	void main(void)"+
	"	{"+
	"		vec3 vertex_relative_to_light = vShadowCoord.xyz / vShadowCoord.w;"+		// manually do divide by w.
	"		vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;"+
//	"		vertex_relative_to_light.x = vertex_relative_to_light.x * 0.5 + 0.5;"+	// set xy range to [0..1]
//	"		vertex_relative_to_light.y = vertex_relative_to_light.y * 0.5 + 0.5;"+	// set xy range to [0..1]

//	"		float shadow_depth = texture2D (shadowmap, vertex_relative_to_light.xy).r + 0.000005;"+		// r component = shadowmap z component.
	"		float shadow_depth = texture2D (shadowmap, vertex_relative_to_light.xy).r + 0.0000065;"+		// r component = shadowmap z component.
	"		if (vertex_relative_to_light.z <= shadow_depth)"+
	"		{"+
					// nearer , so do full colour
	"			gl_FragColor = texture2D(texture, vTextureCoord) *  vColor;"+
//	"			gl_FragColor =  vec4 (1.0, 1.0, 1.0, 1.0) * vColor;"+
	"		}"+
	"		else"+
	"		{"+
	"			gl_FragColor = texture2D(texture, vTextureCoord) *  vColor * 0.5;"+
//	"			gl_FragColor =  vec4 (1.0, 1.0, 1.0, 1.0) * vColor * 0.5;"+
	"		}"+

//	"		float shadow_depth = texture2D(shadowmap, vertex_relative_to_light.xy).z;"+
//	"		gl_FragColor = texture2D (shadowmap, vertex_relative_to_light.xy);"+
//	"		gl_FragColor = vec4 (shadow_depth, shadow_depth, 0.0, 1.0);"+
//	"		gl_FragColor = vec4 (gl_FragCoord.z/2.0, 0.0, 0.0, 1.0);"+
//	"		gl_FragColor = vec4 (vec3(texture2D (shadowmap, vertex_relative_to_light.xy)), 1.0);"+
//	"		gl_FragColor = texture2D (shadowmap, vertex_relative_to_light.xy);"+
//	"		gl_FragColor = vec4 (gl_FragCoord.w, 0.0, 0.0, 1.0);"+
//	"		gl_FragColor = vec4 (vertex_relative_to_light.x, 0.0, 0.0, 1.0);"+
//	"		gl_FragColor = vec4 (vertex_relative_to_light.y, 0.0, 0.0, 1.0);"+
//	"		gl_FragColor = vec4 (shadow_depth, 0.0, 0.0, 1.0);"+
//	"		gl_FragColor = vec4 (vShadowCoord.w/16.0, 0.0, 0.0, 1.0);"+
//	"		if (gl_FragCoord.z > shadow_depth)"+
//	"		if (shadow_depth == 0.0){gl_FragColor=vec4(vShadowCoord.x,1.0,1.0,1.0);}else{gl_FragColor=vec4(1.0,0.0,1.0,1.0);}"+

//	"		if (gl_FragCoord.z > texture2D(shadowmap, shadowCoord.xy).z)"+
//	"		if (gl_FragCoord.z > texture2D(shadowmap, vertex_relative_to_light.xy).z)"+
//	"		{"+
//	"			gl_FragColor =  vec4 (1.0, 1.0, 1.0, 1.0);"+
//	"		}"+
//	"		else"+
//	"		{"+
//	"			gl_FragColor = vec4 (0.5, 0.0, 0.0, 1.0);"+
//	"		}"+
//	"		gl_FragColor = texture2D(shadowmap, vTextureCoord) *  vColor;"+
//	"		gl_FragColor.a = 1.0;"+

//	"		if (texture2D(shadowmap, shadowCoord.xy).z != 0)"+
//	"		{"+
//	"			gl_FragColor = vec4 (1.0, 1.0, 1.0, 1.0);"+
//	"		}"+

//	"		gl_FragColor = texture2D(shadowmap, vTextureCoord) *  vColor;"+
//	"		gl_FragColor = vec4(vec3(texture2D (shadowmap, (shadowCoord.xy * 0.5 + 0.5))),1.0) * vColor;"+	// * vColor;"+	// (1,1,1,1);"+	//vec4 (texture2D(shadowmap, shadowCoord.xy).z;"+
//	"		if (texture2D(shadowmap, shadowCoord.xy).z < gl_FragCoord.z)"+
//	"		{"+
//	"			gl_FragColor = texture2D(texture, vTextureCoord) * vColor;"+
//	"		}"+
//	"		else"+
//	"		{"+
		//"			gl_FragColor = texture2D(texture, vTextureCoord) * vColor * 0.5;"+
//	"			gl_FragColor = vec4 (1,1,1,1);"+
//	"		}"+
//	"	}"

//	"		gl_FragColor = texture2D(shadowmap, shadowCoord.xy).z * vColor;"+
//	"		gl_FragColor = texture2D(texture, vTextureCoord) *  vColor;"+
//	"		if (texture2D (shadowmap, shadowCoord.xy).z > gl_FragCoord.z)"+
//	"		{"+
//	"			gl_FragColor = vec4 (0,0,0,1);"+		// for now, go black if in shadow
//	"		}"+
//	"		gl_FragColor = vec4 (texture2D(shadowmap, shadowCoord.xy).z * vColor, 1);"+
	"	}"
	;


	//--------------------------------------------------
	// vertex and frag shader for point sprites
	//--------------------------------------------------
	
	// (maybe useful for some special fx .. I dont know ??

var vs_point_sprite =
	"attribute vec2 coord2d;"+
	"attribute vec4 point_ink;"+
	"uniform float point_size;"+
	"varying lowp vec4 vColor;"+
	"void main(void)"+
	"{"+
	"	gl_Position = vec4 (coord2d.x, coord2d.y, 0, 1);"+
	"	gl_PointSize = point_size;"+
	"	vColor = point_ink;"+
//	"	vColor = vec4(0.5, 0.0, 0.9, 1.0);"+
	"}"
	;

var fs_point_sprite =
	"precision mediump float;"+
	"varying lowp vec4 vColor;"+
	"void main(void)"+
	"{"	+		// simple solid white colour for testing purposes.
	"	gl_FragColor = vColor;"+
//	"	gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);"+
	"}"
	;

	//--------------------------------------------------
	// vertex and frag shader for point circles
	//--------------------------------------------------

var vs_point_circle =
	"attribute vec2 coord2d;"+
	"attribute vec4 point_ink;"+
	"attribute float point_size;"+
	"varying lowp vec4 vColor;"+
	"void main(void)"+
	"{"+
	"	gl_Position = vec4 (coord2d.x, coord2d.y, 0, 1);"+
	"	gl_PointSize = point_size;"+
//	"	gl_PointSize = 40.0;"+
	"	vColor = point_ink;"+
//	"	vColor = vec4(0.5, 0.0, 0.9, 0.5);"+
	"}"
	;

// ref : http://math.hws.edu/eck/cs424/notes2013/18_WebGL_API.html
// http://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/

var fs_point_circle =
	"precision mediump float;"+
	"varying lowp vec4 vColor;"+
	"void main(void)"+
	"{"	+
	"	float alpha = 1.0;" + 
   "	float dist = distance( vec2(0.5,0.5), gl_PointCoord );"+
	"  if (dist > 0.5) discard;"+
	"	float delta = 0.05 * dist;" +
//   "	delta = fwidth(dist);"+
   "	alpha = 1.0 - smoothstep(0.5 - delta, 0.5 + delta, dist);"+
	"	gl_FragColor = vColor * alpha;"+
//	"	gl_FragColor = vColor;"+
//	"	gl_FragColor = (1.0, 5.0, 1.0, 0.3);"+
	"}"
	;

	//--------------------------------------------------
	// vertex and frag shader for simple lines
	//--------------------------------------------------

var vs_point_line =
	"attribute vec2 coord2d;"+
	"uniform vec4 line_ink;"+					// uniform = constant for each primative.
	"varying lowp vec4 vColor;" + 			// this used by frag shader, modified by vertex shader but is fixed in frag shader.
	"void main(void)"+
	"{"+
	"	gl_Position = vec4 (coord2d.x, coord2d.y, 0, 1);"+
	"	vColor = line_ink;"+
//	"	vColor = vec4(1.0, 0.5, 1.0, 0.8);"+
	"}"
	;

var fs_point_line =
	"precision mediump float;"+
	"varying lowp vec4 vColor;" + 
	"void main(void)"+
	"{"	+
	"	gl_FragColor = vColor;"+
//	"	gl_FragColor = vec4(1.0, 1.0, 1.0, 0.8);"+
	"}"
	;

	//--------------------------------------------------
	// vertex and frag shader for 3D lines
	//--------------------------------------------------

var vs_3d_line =
	"attribute vec3 vertexPosition;"+
	"uniform mat4 mViewMatrix;"+
	"uniform mat4 cameraMatrix;"+
	"uniform mat4 perspectiveMatrix;"+
	"uniform vec4 line_ink;"+					// uniform = constant for each primative.
	"varying lowp vec4 vColor;" + 			// this used by frag shader, modified by vertex shader but is fixed in frag shader.
	"void main(void)"+
	"{"+
	"	gl_Position = perspectiveMatrix * cameraMatrix * mViewMatrix * vec4(vertexPosition, 1.0);"+
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

	// ----------------------------------------
	//		---- 3D Picking tools ----
	// ----------------------------------------


function C3D_RayTriangleIntersection (rx,ry,rz, dx,dy,dz, x0,y0,z0, x1,y1,z1, x2,y2,z2, outIntersectionPoint)
{
	// Möller-Trumbore algorithm

	// outIntersectionPoint should be a Vector structure

	// code converted from :
	// https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm

	// rx,ry,rz = origin of ray.
	// dx,dy,dz = direction of ray
	// (x_,y_,z_) = triangle coordinates in 3D.
   
	var epsilon ;
	
	var rayVector;

	var vertex0;
	var vertex1;
	var vertex2;
   
	var edge1;
	var edge2;
	var h;
	var s;
	var q;

	var a;
	var f;
	var u;
	var v;
	
	var t;
	
//	console.log ("rti");
	
//	console.log ("x0:" + x0 + " y0:" + y0 + " z0" + z0);
//	console.log ("x1:" + x1 + " y0:" + y1 + " z0" + z1);
//	console.log ("x2:" + x2 + " y0:" + y2 + " z0" + z2);

	epsilon = 0.0000001;

	rayVector = new Vector (dx,dy,dz);
	
//	console.log ("rayvector:");
//	console.log (rayVector);

	vertex0 = new Vector (x0,y0,z0);		// Vector3D vertex0 = inTriangle->vertex0;
	vertex1 = new Vector (x1,y1,z1);		// Vector3D vertex1 = inTriangle->vertex1;  
	vertex2 = new Vector (x2,y2,z2);		// Vector3D vertex2 = inTriangle->vertex2;

	edge1 = new Vector(x1,y1,z1);				// edge1 = vertex1 - vertex0;
	edge1.subtract (vertex0);

	edge2 = new Vector(x2,y2,z2);				// edge2 = vertex2 - vertex0;
	edge2.subtract (vertex0);

	h = CrossProduct (rayVector, edge2);	// h = rayVector.crossProduct(edge2);
	
//	console.log (h);

	a = DotProduct (edge1,h);				// a = edge1.dotProduct(h);
//	console.log ("a:" + a);

	if (a > -epsilon && a < epsilon)		// if (a > -EPSILON && a < EPSILON)
	{
//		console.log ("aaa");
		return false;						// return false;    // This ray is parallel to this triangle.
	}

	f = 1 / a;								// f = 1.0/a;

	s = new Vector (rx,ry,rz);				// s = rayOrigin - vertex0;
	s.subtract (vertex0);
	
//	console.log ("s:");
//	console.log (s);
						
	u = f * DotProduct (s,h);				// u = f * s.dotProduct(h);
//	u = f * DotProduct (h,s);				// u = f * s.dotProduct(h);
	
//	console.log ("f:" + f + " u:" + u);
	
	if ((u < 0) || (u > 1))					// if (u < 0.0 || u > 1.0)
	{
		return false;						// return false;
	}
	

	q = CrossProduct(s,edge1);				// q = s.crossProduct(edge1);
	v = f * DotProduct(rayVector,q);		// v = f * rayVector.dotProduct(q);
	if ((v < 0) || ((u+v)>1))				// if (v < 0.0 || u + v > 1.0)
	{
		return false;						// return false;
	}
				// At this stage we can compute t to find out where the intersection point is on the line.


	t = f * DotProduct(edge2,q);			// float t = f * edge2.dotProduct(q);
	
		// NOTE : THIS IF STATEMENT IS IFFY !!I WOULD WRITE IT SO it returns false as an if,
		// the just does the final calculation.
	
	if (t > epsilon)						// if (t > EPSILON) // ray intersection
	{										// {

		outIntersectionPoint.x = rx + (dx * t);		// outIntersectionPoint = rayOrigin + rayVector * t;
		outIntersectionPoint.y = ry + (dy * t);
		outIntersectionPoint.z = rz + (dz * t);
		
//		console.log ("out z:" + outIntersectionPoint.z);

		return true;						// 	return true;
	}										// }
	else 									// else // This means that there is a line intersection but not a ray intersection.
	{
		return false;						// return false;
	}
}

function C3D_STRUCT_PLANE (a,b,c,d)
{
	this.A = a;
	this.B = b;
	this.C = c;
	this.D = d;
}

C3D_STRUCT_PLANE.prototype.fromTriangle = function (x0,y0,z0, x1,y1,z1, x2,y2,z2)
{
		// **** UNDER CONSTRUCTION ****
		
		// note : expects 'clockwise' coordinates, otherwise the
		// normal may point in the opposite direction.
		
	var ax;
	var ay;
	var az;
	
	var bx;
	var by;
	var bz;
	
	var d;

		// clockwise code
	a.x = x1 - x0;
	a.y = y1 - y0;
	a.z = z1 - z0;

	b.x = x2 - x0;
	b.y = y2 - y0;
	b.z = z2 - z0;

	// anti-clockwise (commented out)
//	a.x = v1->x - v2->x;
//	a.y = v1->y - v2->y;
//	a.z = v1->z - v2->z;

//	b.x = v3->x - v2->x;
//	b.y = v3->y - v2->y;
//	b.z = v3->z - v2->z;

		// cross product a x b

	this.A = (ay * bz) - (by * az);
	this.B = (az * bx) - (bz * ax);
	this.C = (ax * by) - (bx * ay);

		// normalise.(required???)
	d = Math.sqrt ((this.A * this.A) + (this.B * this.B) + (this.C * this.C));
	if (d != 0)
	{
		this.A /= d;
		this.b /= d;
		this.c /= d;
	}
	this.D = -( (this.A * x0) + (this.B * y0) + (this.C * z0));
}

function C3D_RayPlaneIntersection (pA, pB, pC, pD, ox,oy,oz, dx, dy,dz)	//COLLISION_RAY* ray, VECTOR* collision_point)
{
	// returns t, the parametric value representing the distance 
	// from (ox,oy,oz) to the plane.
	
	// returns null if the line is already in the plane or parallel .

	// ******** REQUIRES TESTING ********

	// pA,pB,pC,pD = plane coefficients.
	// ox,oy,oz = ray origin.
	// dx,dy,dz = ray direction vector.

	// Based on my old clibs5 collision_3d.c code.


	// returns COLLISION_TRUE and the point of collision
	// if the plane and ray collide in the direction and LENGTH of the ray.
	// otherwise returns COLLISION_FALSE

	// note that the rays length is used to determine whether or not
	// a plane collides with it.

	// plane equation : Ax + By + Cz + D = 0
	// parametric equation of a line:
	// x = origin.x + t(dir.x)
	// y = origin.y + t(dir.y)
	// z = origin.z + t(dir.z)

	// place parametric values for x,y,z into the plane equation
	// and solve for t.

	//	A(o.x + t(d.x)) + B(o.y + t(d.y)) + C(o.z + t(d.z)) + D = 0

	//	=> Ao.x + At(d.x) + Bo.y + Bt(d.y) + Co.z + Ct(d.z) + D = 0		- expand brackets
	//	=> At(d.x) + Bt(d.y) + Ct(d.z) + Ao.x + Bo.y + Co.z + D = 0		- group terms
	//	=> At(d.x) + Bt(d.y) + Ct(d.z) = -(Ao.x + Bo.y + Co.z + D)		- rearrange
	//	=> t(Ad.x + Bd.y + Cd.z) = -(Ao.x + Bo.y + Co.z + D)			- factorise

	//	t = -(Ao.x + Bo.y + Co.z + D) / (Ad.x + Bd.y + Cd.z)		- final equation

	var numerator;
	var denominator;
	var t;
	
	var cx;		// (cx, cy, cz) = collision point
	var cy;
	var cz;

 	numerator = (pA * ox) + (pB * oy)	+ (pC * oz) + pD;
	numerator = -numerator;		// handle minus sign !

	denominator = (pA * dx) + (pB * dy) + (pC * dz);

	if (denominator == 0.0)
	{
			// line is either parallel to the plane or
			// is within the plane. Either way, there is no
			// single intersection point
//		t = (plane->A * ray->dir.x) + (plane->B * ray->dir.y) + (plane->C * ray->dir.z) + plane->D;

//		sprintf (tmp, "A %f B %f C %f D %f x %f y %f z %f d %f t %f",
//					plane->A, plane->B, plane->C, plane->D,
//					ray->dir.x, ray->dir.y, ray->dir.z, denominator, t);
//		Debug (1, tmp);

		return null;
	}

	t = numerator / denominator;

	cx = ox + (t * dx);
	cy = oy + (t * dy);
	cz = oz + (t * dz);

//	if ((t < 0.0) || (t >= 1.0))
//	{
//		// t is outside the range for the ray.
//		return COLLISION_FALSE;
//	}

	return t;
}

/*
function C3D_RayTriangleIntersection (rx,ry,rz, dx,dy,dz, x0,y0,z0, x1,y1,z1, x2,y2,z2)
{
	var n;
	var d;
	
	n = new STRUCT_TMP_NORMAL();
	n.calcNormal(x0,y0,z0, x1,y1,z1, x2,y2,z2);
	d = -((n.x * x0) + (n.y * y0) + (n.z * z0));
	
	t = C3D_RayPlane (rx,ry,rz, dx,dy,dz, n.x, n.y, n.z, d);
}
*/

function C3D_CalcPickRay (camera, mouse_x, mouse_y, pick_ray_array)
{
	// unprojects mouse screen coordinates.
	// calculates a pick ray and returns the result in the array so that:
	// [0] = ray origin x			( should be camera x,y,z)
	// [1] = ray origin y
	// [2] = ray origin z
	// [3] = ray direction x		( direction relative to ray origin)
	// [4] = ray direction y
	// [5] = ray direction z

	var mx;
	var my;
	var z;
	var w;
	
	var v;

		// convert mouse coordinate to range [0..1]

	mx = mouse_x / gl.canvas.width;
	my = mouse_y / gl.canvas.height;

		// now scale to the range [-1..1]

	mx = (mx * 2) -1;
	my = 1 - (my * 2);		// invert as screen y is opposite to view y.

		// can use any value of z. common ones are known ones, -1, 0 or 1.

	z = -1;				// using z = -1 (the near plane).
	w = 1;				// w = 1.

	v = [mx, my, z, w];

		// now reverse the perpective projection

	v = MatrixVectorMultiply (_C3D_InversePerspectiveMatrix, v);

		// divide by w (not sure why)

	v[0] /= v[3];
	v[1] /= v[3];

	im = MatrixIdentity();
	Matrix4x4Inverse (camera.cam_matrix, im);

	v = MatrixVectorMultiply (im, v);

	pick_ray_array[0] = camera.pos.x;
	pick_ray_array[1] = camera.pos.y;
	pick_ray_array[2] = camera.pos.z;
	
	pick_ray_array[3] = v[0] - camera.pos.x;
	pick_ray_array[4] = v[1] - camera.pos.y;
	pick_ray_array[5] = v[2] - camera.pos.z;

}

/*
var iijjkk = 5;
function C3D_Picking (camera, mx, my)
{
	// converts a 2D mouse screen coordinate to a 3D one.
	// also called 'unprojecting' if you are googling this stuff.

	// *** UNDER CONSTRUCTION ***

	// (mx,my) = mouse coordinates.
	
	
	var v;
	var im;
	var s;
	
	s = 10;

	v = [];

		// normalise coordinates (convert to range 0..1)
	v[0] = mx / gl.canvas.width;
	v[1] = my / gl.canvas.height;
	v[2] = -1;							// not sure what this should be.;
	v[3] = 1;
	
//	console.log ("initial v");
//	console.log (v);
	
		// convert range normalised space [-1...1]
		
	v[0] = (v[0]*2)-1;
	v[1] = 1 - (v[1]*2);		// invert 
	
//	console.log (v);
	
	v = MatrixVectorMultiply (_C3D_InversePerspectiveMatrix, v);

//	console.log ("v:*****************************");
//	console.log (v);
	
	
	im = MatrixIdentity();
	Matrix4x4Inverse (camera.cam_matrix, im);
	
	if (iijjkk < 2)
	{
	console.log ("v:*****************************");
		console.log ("im");
		console.log (im);
	}
	
	im = camera.getInverseMatrix();
	if (iijjkk < 2)
	{
		console.log ("cam im");
		console.log (im);
	}


//	console.log ("------------------");
//	console.log (v);

	v = MatrixVectorMultiply (im, v);
	
	if (iijjkk < 2)
	{
		console.log ("v:world:");
		console.log (v);
	}
	
	gl.beginPath();
	gl.fillStyle="#fff";
	s = 5;
	gl.rect ((s * v[0]) + 70 -1, 70 - 1 - (v[2] * s),3,3);
	gl.fill();

	gl.beginPath();
	gl.fillStyle="#F00";
	gl.rect ((s * camera.pos.x) + 70-2, 70 -2 - (s*camera.pos.z ),5,5);
	gl.fill();


	iijjkk++;

}
*/

	// ----------------------------------------------
	//		---- Back - face culling check ----
	// ----------------------------------------------

function C3D_BackfaceCullCheck (x0,y0,x1,y1,x2,y2)
{
	// this can determin whether a triangle is front or back facing.
	// pinched from https://cboard.cprogramming.com/game-programming/1057-backface-culling-lesson10-nehegl-tutorials.html
	
	var z=((x1-x0)*(y2-y0)) - ((y1-y0)*(x2-x0));
	return z; 
}

	// -------------------------------------------
	// 		---- internal 2D Draw List ----
	// -------------------------------------------
	
function _C3D_DRAWDATA_ITEM()
{
	this.ink = "#000";
	this.x0 = 0;
	this.y0 = 0;
	this.x1 = 0;
	this.y1 = 0;
	this.x2 = 0;
	this.y2 = 0;
}

function _C3D_InitDrawList(max_size)
{
	// *** ONLY CALL ONCE AT THE START OF THE PROGRAM !!!
	// USING FIXED SIZE BUFFERS FOR ->: SPEEEEEEEEEEEEEEEEEEEED

	var i;

	_C3D_DrawData = [];
	for (i = 0; i < C3D_MAX_DRAWDATA_SIZE; i++)
	{
		_C3D_DrawData[i] = new _C3D_DRAWDATA_ITEM();
	}
	_C3D_DrawDataSize = 0;
}

function _C3D_ClearDrawList()
{
	_C3D_DrawDataSize = 0;
	_C3D_DrawList.clear();
}


var aaaaaa = 
[
	"#000",
	"#00F",
	"#F00",
	"#0F0",
	"#F0F",
	"#0FF",
	"#FF0",
	"#FFF"
];

function C3D_DrawDrawList ()
{
		// only changes the ink colour when required as it is quite
		// a huge bottleneck (so my tests show).

	var n;
	var rgbhex;
	var d;
	
	var draw_order = [];
	var ctx;
	
//	console.log ("drawing the draw list");

//	console.log ("list size:" + _C3D_DrawDataSize);

	_C3D_DrawList.generateList (draw_order);

	ctx = gl;

	for (n = 0; n < _C3D_DrawDataSize; n++)
	{
		i = draw_order[n];
//		rgbhex = aaaaaa[i&7];	//"rgba(" + (i * 30) + ",100,100,255);";
		d = _C3D_DrawData[i];
//		console.log ("i:" + i + " d:" + " rgb:" + rgbhex);
//		console.log (d);

		rgbhex = d.ink;
		
		ctx.beginPath();
			ctx.fillStyle = rgbhex;
			ctx.moveTo (d.x0, d.y0);
			ctx.lineTo (d.x1, d.y1);
			ctx.lineTo (d.x2, d.y2);
			ctx.lineTo (d.x0, d.y0);
		ctx.fill();
	}
}
	
	// -------------------------------------------
	// 		---- 2D Routines ----
	// -------------------------------------------
	

//function STRUCT_2D_VERTEX (x,y,z,w)
//{
//	this.x = x;
//	this.y = y;
//	this.z = z;
//	this.w = w;
//}

function STRUCT_2D_OBJECT (vertex_list, face_indices_list, ink_list, normal_list, uv_list)
{
		// vertex_list must be an array of (x,y,z) coordinates

	var i;
	var n;
	var w;
	
	this.v = [];		// vertices
	this.f = [];		// face indices
	this.i = [];		// vertex inks
	this.n = [];		// vertex normals
	this.uv = [];		// texture coords
	
	this.xv = [];		// transformed vertex list, same size as vertices array.

		// vertices are converted from x,y,z to x,y,z,w for easy
		// matrix calculations
	w = 1;
	n = 0;
	for (i = 0; i < vertex_list.length; i += 3)
	{
			// init xv buffer as well
		this.xv[n+0] = 0;	this.xv[n+1] = 0;		this.xv[n+2] = 0;		this.xv[n+3] = 0;
		
		this.v[n++] = vertex_list[i+0];		// x
		this.v[n++] = vertex_list[i+1];		// y
		this.v[n++] = vertex_list[i+2];		// z
		this.v[n++] = w;
	}
	
		// face indices are just copied
	this.f = face_indices_list.slice();		// fast copy ??
	
		// same for inks, normals and uvs (for now)

	if (ink_list != null)		{	this.i = ink_list.slice();		}
	if (normal_list != null)	{	this.n = normal_list.slice();	}
	if (uv_list != null)		{	this.uv = uv_list.slice();		}
}

function C3D_2D_UploadData(verts, faces, inks, normals, uvs)
{
	// uploads some data to the 'internal' buffers and returns
	// an index 'id' for it.
	
	// inks, normals and uvs can all be null if not required.

	var i;
	
	i = ObjectBuffer.length;

	ObjectBuffer[i] = new STRUCT_2D_OBJECT (verts, faces, inks, normals, uvs);

	return i;
}

function C3D_2D_UpdateVertices (object_id, vertex_data, vertex_start_number, length)
{
	// vertex_data must be an array of (x,y,z) coordinates.

	// updates an existing vertex list . Useful for when you need to 
	// 'bake' in rotations, or do mesh animations.
	
	var ob;
	var i;
	var n;
	var idx;
	
//	console.log ("update 2d verts id:" + object_id + " start:" + vertex_start_number + " len:" + length);

	ob = ObjectBuffer [object_id];
	idx = vertex_start_number * 3;
	i = vertex_start_number * 4;
	for (n = 0; n < length; n++)
	{
		ob.v[i+0] = vertex_data[idx+0];		// x
		ob.v[i+1] = vertex_data[idx+1];		// y
		ob.v[i+2] = vertex_data[idx+2];		// z
		idx += 3;
		i += 4;
	}	
}


//var vmt =0;
function C3D_2D_DrawObject (object_id, model_matrix)
{
		// ** UNDER CONSTRUCTION **

	var k;
	var halfwidth;
	var halfheight;
	var ox;
	var oy;

	var ob;
		
	var idx;

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

	var z;
	var f;
	var v0;
	var v1;
	var v2;

	var ptr;

	var n;
	
	var r;
	var g;
	var b;

	var backface_cull;
	
		// quick & quiet exit if draw list is full.
	if (_C3D_DrawDataSize >= _C3D_DrawData.length)
	{
		return;	// reached draw list size.
	}

	halfwidth = gl.canvas.width >> 1;
	halfheight = gl.canvas.height >> 1;

	ox = halfwidth;
	oy = halfheight;

	ob = ObjectBuffer [object_id];

		// do model matrix multiply.
	MatrixVectorArrayMultiply (model_matrix, ob.v, ob.xv);

		// now do perspective (projection) matrix multiply.
	MatrixVectorArrayMultiply (_C3D_PerspectiveMatrix, ob.xv, ob.xv);

		// do divide by w & convert to screen coords.
		// (webgl/opengl does this bit for you, so you dont see it)
	for (k = 0; k < ob.xv.length; k += 4)
	{
		w = ob.xv[k+3];
		if (w != 0)
		{
			ob.xv[k+0] /= w;
			ob.xv[k+1] /= w;
		}

			// convert to screen coords.
		ob.xv[k+0] = ox + (halfwidth * ob.xv[k+0]);
		ob.xv[k+1] = oy - (halfheight* ob.xv[k+1]);

	}
		// output triangle data to draw list.
	ptr = ob.f;	// buffer_2d_faces [mesh_id];
	for (f = 0; f < ptr.length; f += 3)
	{
		if (_C3D_DrawDataSize >= _C3D_DrawData.length)
		{
			return;	// reached draw list size.
		}
		
		v0 = ptr[f+0] * 4;
		v1 = ptr[f+1] * 4;
		v2 = ptr[f+2] * 4;

		x0 = ob.xv[v0+0];
		y0 = ob.xv[v0+1];
		z0 = ob.xv[v0+2];

		x1 = ob.xv[v1+0];
		y1 = ob.xv[v1+1];
		z1 = ob.xv[v1+2];

		x2 = ob.xv[v2+0];
		y2 = ob.xv[v2+1];
		z2 = ob.xv[v2+2];
		
			// for now, flat shade everything
		r = ob.i[0 +  (ob.f [f+0] * 3)];
		g = ob.i[1 +  (ob.f [f+0] * 3)];
		b = ob.i[2 +  (ob.f [f+0] * 3)];
		
//		if (vmt == 0)
//		{
//			console.log ("f:" + (f/3) + " rgb" + r + " , " + g + "," + b + ":");
//		}
		
		backface_cull = false;
		if (_C3D_BackfaceCullEnabled == true)
		{
			backface_cull = true;
			if (C3D_BackfaceCullCheck (x0,y0,x1,y1,x2,y2) >= 0)
			{
				backface_cull = false;
			}
		}
	
		if (backface_cull == false)
		{
			idx = _C3D_DrawDataSize++;
			
			rgbhex = "rgb(" + r + "," + g + "," + b + ")";
//			if (vmt == 0)
//			{
//				console.log ("f:" + (f/3) + " rgbhex" + rgbhex);
//			}

			_C3D_DrawData [idx].ink = rgbhex;
			_C3D_DrawData [idx].x0 = x0;
			_C3D_DrawData [idx].y0 = y0;
			_C3D_DrawData [idx].x1 = x1;
			_C3D_DrawData [idx].y1 = y1;
			_C3D_DrawData [idx].x2 = x2;
			_C3D_DrawData [idx].y2 = y2;

			z = (z0 + z1 + z2)/3;
		
			_C3D_DrawList.add (idx, z);
		}

		// need to post the data directly into the draw list if possible.

//		backface_cull = false;
//		if (WGL3D_backfaceCullEnabled == true)
//		{
//			backface_cull = true;
//			if (WGL3D_BackfaceCullCheck (x0,y0,x1,y1,x2,y2) < 0)
//			{
//				backface_cull = false;
//			}
//		}

//		if (backface_cull == false)
//		{
//			v0 = ptr[f+0] * 3;
//			r = Math.floor (255 * buffer_2d_inks[mesh_id][v0+0]);
//			g = Math.floor (255 * buffer_2d_inks[mesh_id][v0+1]);
//			b = Math.floor (255 * buffer_2d_inks[mesh_id][v0+2]);
//			rgbhex = "rgb(" +  r + ","+ g + "," + b + ")";

//		if (jkp == 0)
//		{
//			console.log ("f:" + f + " r:" + r + " g:" + g + " b:" + b);
//		}
//			DrawList_AddItem (object_index, z, x0,y0,x1,y1,x2,y2, rgbhex);
//		}
	}
//	vmt++;
}

function C3D_Init2D (canvas_id, near_z, far_z)
{
	console.log ("c3d.js : Init : using 2d canvas renderer.");

	_C3D_UseGL = false;

	gl = cvs.getContext("2d");
	if (!gl)
	{
		console.log ("3d.js : unable to init 2D canvas renderer");
		return false;
	}
		
	_C3D_InitDrawList (C3D_MAX_DRAWDATA_SIZE);
	
	_C3D_DrawList = new STRUCT_DRAW_LIST (
				near_z,					// near_z
				far_z,					// far z
				C3D_2D_MAX_BUCKETS,		// number of buckets
				C3D_MAX_DRAWDATA_SIZE,	// number of items,
				);

	_C3D_CanvasType = C3D_TYPE_2D;
}

		// ------------------------------------------------
		//		---- end 2D routines ----
		// ------------------------------------------------

function WGL3D_SetAmbientLight (r,g,b)
{
	var ambient = [];

	ambient[0] = r;
	ambient[1] = g;
	ambient[2] = b;
	ambient[3] = 1.0;		// alpha level is 1.

		// upload ambient light level.
	id = gl.getUniformLocation(WGL3D_CurrentShaderProg, "ambient");
	WGL3D_Error();
	if (id == -1)
	{
		console.log ("ambient uniform not found");
		return;
	}
	gl.uniform4fv(id, ambient);
	WGL3D_Error();
}


	// ----------------------------------------------------------------
	// 	---- vertex & fragment shader load & compile routines. ----
	// ----------------------------------------------------------------

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


	// -----------------------------------------
	//		---- WebGl Error reporting ----
	// -----------------------------------------

var WGL3D_MaxErrors = 50;		// max number of webgl errors to report.

function C3D_Error(msg)
{
	var e;
	var str;

	str = "";
	
	if (_C3D_UseGL != true)
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

	// ----------------------------------------
	//		---- Normal Helper routines ----
	// ----------------------------------------

function STRUCT_TMP_NORMAL ()
{
	this.x = 0;
	this.y = 0;
	this.z = 0;
}

STRUCT_TMP_NORMAL.prototype.calcNormal = function (x0,y0,z0, x1,y1,z1, x2,y2,z2)
{
		// calculates a normal given 3 points of a triangle.

	var ux;
	var uy;
	var uz;
	
	var vx;
	var vy;
	var vz;
				// U = p1 - p0
	ux = x1 - x0;
	uy = y1 - y0;
	uz = z1 - z0;

			// V = p2 = p0
	vx = x2 - x0;
	vy = y2 - y0;
	vz = z2 - z0;

			// normal is cross product of two edge  vectors N = U X V
	this.x = (uy*vz)-(uz*vy);	// Nx = UyVz - UzVy
	this.y = (uz*vx)-(ux*vz);	// Ny = UzVx - UxVz
	this.z = (ux*vy)-(uy*vx);	// Nz = UxVy - UyVx
}


function C3D_CreateNormals (vertices, faces, normals)
{
	// little helper function to generate surface normals.
	// creates a simple array of normals.

	// vertices (x,y,z)..
	// faces (v0,v1,v2)..
	// normals = [] .. to be filled with (nx,ny,nz) data.

	// normal calculations : 
	// for each vertex create a normal structure
	// go through the list of faces and for each vertex calculate and 
	// add the normal to the normal structure. 
	// then normalise the normals before filling in the normals parameter.
	// This should help calculate shared normals as well as simple normals.
	
	var i;
	var f;

	var v0;
	var v1;
	var v2;

	var x0;
	var y0;
	var z0;

	var x1;
	var y1;
	var z1;

	var x2;
	var y2;
	var z2;

	var num_vertices;
	var num_faces;

	var d;
	
	var n = new STRUCT_TMP_NORMAL();

	var tn = [];		// temporary normal array 
	
		// create temporary normal array.

	num_vertices = Math.floor(vertices.length/3);
	for (i = 0; i < num_vertices ; i++)
	{
		tn[i] = new STRUCT_TMP_NORMAL();
	}
	
	i = 0;
	num_faces = Math.floor (faces.length/3);
	for (f = 0; f < num_faces; f++)
	{
		v0 = faces[i++];
		v1 = faces[i++];
		v2 = faces[i++];
		
		// debugging!!
		if ((v0 >= num_vertices)|| (v1 >= num_vertices) || (v2 >= num_vertices))
		{
			console.log ("vertex index out of range f:" + f + " v0:" + v0 + " v1:" + v1 + " v2:" + v2);
		}

		x0 = vertices[(v0*3)+0];
		y0 = vertices[(v0*3)+1];
		z0 = vertices[(v0*3)+2];

		x1 = vertices[(v1*3)+0];
		y1 = vertices[(v1*3)+1];
		z1 = vertices[(v1*3)+2];

		x2 = vertices[(v2*3)+0];
		y2 = vertices[(v2*3)+1];
		z2 = vertices[(v2*3)+2];


			// calculate flat surface normal n

//		calcNormal (x0,y0,z0, x1,y1,z1, x2,y2,z2, n);
		n.calcNormal (x0,y0,z0, x1,y1,z1, x2,y2,z2);

			// add this normal info to the vertex normal data.

		tn[v0].x += n.x;
		tn[v0].y += n.y;
		tn[v0].z += n.z;

		tn[v1].x += n.x;
		tn[v1].y += n.y;
		tn[v1].z += n.z;

		tn[v2].x += n.x;
		tn[v2].y += n.y;
		tn[v2].z += n.z;
	}

		// normalise and create normal array.
	for (i = 0; i < num_vertices; i++)
	{
		d = Math.sqrt ((tn[i].x * tn[i].x) + (tn[i].y * tn[i].y) + (tn[i].z * tn[i].z));
		if (d != 0)
		{
			tn[i].x /= d;
			tn[i].y /= d;
			tn[i].z /= d;
		}
		normals[(i*3)+0] = tn[i].x;
		normals[(i*3)+1] = tn[i].y;
		normals[(i*3)+2] = tn[i].z;
	}
}

	// ------------------------------------
	//		---- 3D inits ----
	// ------------------------------------

var webgl_context_info =
[
//	"webgl2",				C3D_TYPE_WEBGL2,	// commented out for now, as only needing to support WEBGL 1.0
	"webgl",  				C3D_TYPE_WEBGL,
	"experimental-webgl", 	C3D_TYPE_WEBGL,		// edge  ??
	"webkit-3d",			C3D_TYPE_WEBGL,		// safari ??
	"2d",					C3D_TYPE_2D
];

function C3D_IsAvailable_WebGL()
{
	var cvs;
	var ctx;
	var i;
	var t;

	if (!window.WebGLRenderingContext)
	{
		console.log ("webgl not available : no global WebGLRenderingContext");
		return false;
	}

	cvs = document.createElement("canvas");
	for (i = 0; i < webgl_context_info.length; i += 2)
	{
		ctx = cvs.getContext(webgl_context_info[i]);
		t = cvs.getContext(webgl_context_info[i+1]);
		if ((ctx != null) && (t != C3D_TYPE_2D))
		{
			console.log ("WebGL available! :" + webgl_context_info[i]);
			ctx = undefined;
			cvs = undefined;
			return true;
		}
	}
			
	return false;
}

function C3D_Init(canvas_id, preferred_context_type, near_z, far_z)
{
	// if use_webgl = false, then a 2D canvas is the default,
	// otherwise it will try to use webgl if possible.

	var cvs;
	var i;
	var near_z;
	var far_z;

	_C3D_CanvasType = C3D_TYPE_NONE;	// default.

	cvs = document.getElementById (canvas_id);
	if (cvs == null)
	{
		console.log ("unable to get canvas :" + canvas_id);
		return false;
	}
	
	_C3D_PerspectiveMatrix = Matrix_CreatePerspectiveProjectionMatrix (
		cvs.width, 			// width in pixels
		cvs.height, 		// height in pixels
		30.0,				// field of view (degrees)
		1,					// near z
		1000);				// far z

	_C3D_InversePerspectiveMatrix = MatrixIdentity();
	//Matrix4x4Inverse (_C3D_PerspectiveMatrix, _C3D_InversePerspectiveMatrix);		// only needs to be done once when creating the perspective matrix.
	_C3D_InversePerspectiveMatrix = ProjectionMatrixInverse (_C3D_PerspectiveMatrix);

	if (preferred_context_type == C3D_TYPE_2D)
	{
		return C3D_Init2D(canvas_id, near_z, far_z);
	}

	i = 0;
	gl = null;
	while ((i < webgl_context_info.length) && (gl == null))
	{
		gl = cvs.getContext ( webgl_context_info[i]);
		if (gl != null)
		{
			_C3D_CanvasType = webgl_context_info [i + 1];
		}
		i += 2;
	}
	
	if (gl == null)
	{
		console.log ("3d.js : unable to get context");
		_C3D_CanvasType = C3D_TYPE_NONE;	// default.
		return false;
	}
	
	if (_C3D_CanvasType == C3D_TYPE_2D)
	{
		return C3D_Init2D(canvas_id, near_z, far_z);
	}
		
	console.log ("using WebGL");
	
		// ------- Web GL specific inits -------
	
//	console.log ("w:" + cvs.width + " h:" + cvs.height);
	gl.viewport (0,0, cvs.width, cvs.height);
	gl.clearColor(0.6, 0.2, 0.2, 1);

	gl.enable (gl.DEPTH_TEST);		// enable depth testing
	C3D_Error();

		// compile & load shaders
//	ShaderProg_WhiteTriangles = _wgl3d_CompileShaderProgramFromStrings (vs_white_triangles, fs_white_triangles);
//	ShaderProg_2DGradients = _wgl3d_CompileShaderProgramFromStrings (vs_2d_gradient_shader, fs_2d_gradient_shader);
//	ShaderProg_3DFlat = _wgl3d_CompileShaderProgramFromStrings (vs_3d_flat, fs_3d_flat);
//	ShaderProg_Sprites = _wgl3d_CompileShaderProgramFromStrings  (vs_2d_sprite_shader, fs_2d_sprite_shader);
//	ShaderProg_3D = _wgl3d_CompileShaderProgramFromStrings (vs_3d_textured, fs_3d_textured);
//	ShaderProg_3D_Gouraud = _wgl3d_CompileShaderProgramFromStrings (vs_3d_gouraud_textured, fs_3d_gouraud_textured);
//	ShaderProg_3D_Phong = _wgl3d_CompileShaderProgramFromStrings (vs_3d_phong_textured, fs_3d_phong_textured);
//	ShaderProg_Shadows1 = _wgl3d_CompileShaderProgramFromStrings (vs_shadow_shader_1st_pass, fs_shadow_shader_1st_pass);
//	ShaderProg_Shadows2 = _wgl3d_CompileShaderProgramFromStrings (vs_shadow_shader_2nd_pass, fs_shadow_shader_2nd_pass);
//	ShaderProg_Points = _wgl3d_CompileShaderProgramFromStrings (vs_point_sprite, fs_point_sprite);
//	ShaderProg_PointCircle = _wgl3d_CompileShaderProgramFromStrings (vs_point_circle, fs_point_circle);

	ShaderProg_Line = _wgl3d_CompileShaderProgramFromStrings (vs_point_line, fs_point_line);
	C3D_Error();

//	ShaderProg_3DLine = _wgl3d_CompileShaderProgramFromStrings (vs_3d_line, fs_3d_line);

	g_PointBuffer = gl.createBuffer();			// id for points & lines
	C3D_Error();

	return true;
}

function C3D_ClearCanvas()
{
	if (_C3D_CanvasType == C3D_TYPE_2D)
	{
		gl.clearRect (0,0, gl.canvas.width, gl.canvas.height);

		_C3D_ClearDrawList();
		
		return;
	}

	gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	C3D_Error();
}

function C3D_DrawLineList (line_list, r,g,b)
{
	// line list is a series of coordinate pairs, x0,y0,x1,y1 for
	// drawing 2D lines with. It should be a Float32Array.
	
	// coordinates are in canvas screen coordinates (and are converted
	// here before passing to the shader code.
	
	var i;
	var tmp;
	var p;
	var loc_line_ink; 
	var j;
	var k;
	
	if (_C3D_CanvasType == C3D_TYPE_2D)
	{
		gl.beginPath();
		tmp = "rgba(" + r + "," + g + "," + b + ",1.0)";
		gl.strokeStyle= tmp;
		for (i = 0; i < line_list.length; i += 4)
		{
			gl.moveTo (line_list[i+0], line_list[i+1]);
			gl.lineTo (line_list[i+2], line_list[i+3]);
		}
		gl.stroke();
		return;	
	}
	
	// webgl stuff:
	p = 0;
	j = 2 / gl.canvas.width;
	k = 2 / gl.canvas.height;
	tmp = new Float32Array (line_list);			// bottle neck, but since coordinates are being moved and converted, I can't see a way round it right now.
	for (i = 0; i < line_list.length; i += 4)
	{
		tmp[i+0] = -1 + (tmp[i+0] * j);		// convert coordinates to gl space, one line at a time.
		tmp[i+1] = 1 - (tmp[i+1] * k);
		tmp[i+2] = -1 + (tmp[i+2] * j);
		tmp[i+3] = 1 - (tmp[i+3] * k);
	}

	gl.useProgram (ShaderProg_Line);
	C3D_Error();
	
		//	upload data to GPU

		//Bind appropriate array buffer to it
	gl.bindBuffer(gl.ARRAY_BUFFER, g_PointBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, tmp, gl.STATIC_DRAW);		// Pass the vertex data to the buffer - note tmp is a Float32Array.
	gl.bindBuffer(gl.ARRAY_BUFFER, null);										// Unbind the buffer

	loc_line_ink = gl.getUniformLocation(ShaderProg_Line, "line_ink");
	if (loc_line_ink == null)
	{
		console.log ("Err : unable to locate uniform shader variable");
		return;
	}
	C3D_Error();
	gl.uniform4f(loc_line_ink, r/256,g/256,b/256,1);	//line_ink_rgba); a = 1


	//======== Associating shaders to buffer objects ========

		// Bind vertex buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, g_PointBuffer);

	var coord = gl.getAttribLocation(ShaderProg_Line, "coord2d");    // Get the attribute location and bind it to the buffer.
	gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);		 // Point an attribute to the currently bound VBO (g_PointBuffer)
	gl.enableVertexAttribArray(coord); 						        // Enable the attribute

	gl.bindBuffer(gl.ARRAY_BUFFER, null);							// Unbind the buffer (clean up).

         //============= Drawing the primitive ===============

	//gl.lineWidth(1);	//line_width);	// fixed at 1 by hardware?

         // Draw the points
	gl.drawArrays(gl.LINES, 0, tmp.length>>1);

	tmp = undefined;
	
//	console.log ("aaaaaaaa");
}

	// ---------------------------------------------------------
	//		---- Object Loading & Drawing Routines ----
	// ---------------------------------------------------------

function C3D_UploadModelData (verts, faces, inks, normals, uvs)
{
		// *** UNDER CONSTRUCTION ***

		// note : GPU's don't generally have complex garbage collectors
		// so repeated create & delete of buffers is probably
		// going to fragment the video memory.. so if possible, call
		// this routine as infrequently as possible.
		
		// one approach would be to create one HUGE buffer and only
		// update portions of it as required.. i.e. never, ever 
		// delete a buffer - just reuse it. .. for now.. just creating
		// a buffer for a static object.
		
		// for now, going to load all the data separately,
		// but eventually will interleave this data to reduce the 
		// call overhead.
		
		// note: converts the data to typed arrays before uploading
		// so there is no need to pass typed arrays to this routine.
		
		// note : for now, textures and normals can be null
		// as they are not currently used.

	var idx;
	var vertex_buffer_id;
	var face_buffer_id;
	var ink_buffer_id;
	var normal_buffer_id;
	var uv_buffer_id;

	if (_C3D_CanvasType == C3D_TYPE_2D)
	{
		idx = C3D_2D_UploadData (verts, faces, inks, normals, uvs);
		return idx;
	}

	idx = ObjectBuffer.length;
	if (idx == C3D_MAX_MESHES)
	{
		console.log ("max meshes reached");
		return false;
	}
	

		// upload  vertex data into a buffer on the GPU

	vertex_buffer_id = gl.createBuffer();
	C3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer_id);
	C3D_Error();
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
	C3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, null);							// Unbind the buffer (clean up).
	C3D_Error();

//	WGL3D_ID_VertexBuffers[i] = id;

		// do the same for the face vertex indices (3 per face)

	face_buffer_id = gl.createBuffer();
	C3D_Error();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, face_buffer_id);
	C3D_Error();
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), gl.STATIC_DRAW);
	C3D_Error();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);							// Unbind the buffer (clean up).
	C3D_Error();
//	WGL3D_NumFaces[i] = face_indices.length;

		// ..and the same for the inks too.

	ink_buffer_id = gl.createBuffer();
	C3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, ink_buffer_id);
	C3D_Error();
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inks), gl.STATIC_DRAW);
	C3D_Error();
	gl.bindBuffer(gl.ARRAY_BUFFER, null);							// Unbind the buffer (clean up).
	C3D_Error();

	normal_buffer_id = null;
	if (normals != null)
	{
					// upload normal data (these are all vertex normals)
		console.log ("uploading normals");
		normal_buffer_id = gl.createBuffer();
		C3D_Error();
		gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer_id);
		C3D_Error();
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
		C3D_Error();
		gl.bindBuffer(gl.ARRAY_BUFFER, null);							// Unbind the buffer (clean up).
		C3D_Error();
	}
	
	uv_buffer_id = null;
	if (uvs != null)
	{
		console.log ("uploading texture uv's");
		// upload texture data
		uv_buffer_id = gl.createBuffer();
		C3D_Error();
		gl.bindBuffer(gl.ARRAY_BUFFER, uv_buffer_id);
		C3D_Error();
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);							// Unbind the buffer (clean up).
		C3D_Error();
	}

	ObjectBuffer[idx] = new STRUCT_OBJECT (vertex_buffer_id, face_buffer_id, ink_buffer_id, normal_buffer_id, uv_buffer_id);

	return idx;
}

function C3D_DrawObject (object_id, model_matrix, normal_matrix)
{
		// UNDER CONSTRUCTION : REQUIRES A LOT OF WORK !

	if (_C3D_CanvasType == C3D_TYPE_2D)
	{
		C3D_2D_DrawObject (object_id, model_matrix, normal_matrix);
		return;
	}
	
}

function C3D_UpdateVertices (object_id, vertex_data, vertex_start_number, length)
{
	// note : vertex_start_number is *not* an index, but the number of the
	// vertex to start at.

			// UNDER CONSTRUCTION : REQUIRES A LOT OF WORK !

	if (_C3D_CanvasType == C3D_TYPE_2D)
	{
		C3D_2D_UpdateVertices (object_id, vertex_data, vertex_start_number, length);
		return;
	}
}
