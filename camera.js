/*

		Title	:	3D Camera Routines

		Info : 	Version 1.0	12th March 2020

		Author	:	Nick Fleming

		Updated	: 	12th March 2020

	 Notes:
	---------
		Provides a simple way to set a camera matrix for 3D rendering.

	Updated and tested from my old c3d camera code.	
*/

// ------------------------------------
// ----------private routines ---------
// ------------------------------------

function _cam3d_setcamera (px,py,pz, lx,ly,lz)
{
	var sin_a;
	var cos_a;
	var lv;				 // look at vector.
	var m;
	var m_combined;

	this.pos.x = px;
	this.pos.y = py;
	this.pos.z = pz;

	this.look_at.x = lx;
	this.look_at.y = ly;
	this.look_at.z = lz;
	
			// make the camera the center of the universe.
			// identity matrix:
	this.cam_matrix = MatrixIdentity(); 	
//	this.cam_matrix[0] = 1.0;	this.cam_matrix[1] = 0.0;	this.cam_matrix[2] = 0.0;	this.cam_matrix[3] = 0.0;
//	this.cam_matrix[4] = 0.0;	this.cam_matrix[5] = 1.0;	this.cam_matrix[6] = 0.0;	this.cam_matrix[7] = 0.0;
//	this.cam_matrix[8] = 0.0;	this.cam_matrix[9] = 0.0;	this.cam_matrix[10] = 1.0;	this.cam_matrix[11] = 0.0;
//	this.cam_matrix[12] = 0.0;	this.cam_matrix[13] = 0.0;	this.cam_matrix[14] = 0.0;	this.cam_matrix[15] = 1.0;
	
// 	this.cam_matrix[12] = -px;  	// .. make camera center of the universe. 
// 	this.cam_matrix[13] = -py; 	
// 	this.cam_matrix[14] = -pz;  	
// 	this.cam_matrix[15] = 1.0;

		// get a look vector
	
	lv = new Vector (px,py,pz);
	lv.subtract (this.look_at);
  	lv.normalise();

	m_combined = MatrixIdentity();
	m_combined = MatrixTranslate (m_combined, -px, -py, -pz);

		// rotate around y axis.

	sin_a = lv.x;
	cos_a = lv.z;
	m = MatrixIdentity();
	m[0] = cos_a;
	m[2] = sin_a;
	m[8] = -sin_a;
	m[10]= cos_a;
	m_combined = MatrixMultiply (m_combined, m);
	
	if (once == 0)
	{
		console.log ("lvx:" + lv.x + " lvy:" + lv.y + " lvz:" + lv.z);
	}
	
		// rotate around the x axis.
/*	m = MatrixIdentity();
	cos_a = lv.z;
	sin_a = lv.y;
	m = MatrixIdentity();
	m[5] = cos_a;
	m[6] =-sin_a;		// note swapped 9 & 6 as matrix order is row major ??
	m[9] = sin_a;
	m[10]= cos_a;
	m_combined = MatrixMultiply (m_combined, m);
*/
		// combine it all.
	this.cam_matrix = MatrixIdentity(); 
 	this.cam_matrix = MatrixMultiply (m_combined, this.cam_matrix);
}

	// ------------------------------------
	// ----------public routines ---------
	// ------------------------------------

function Cam3D (pos_x, pos_y, pos_z, up_x, up_y, up_z, look_at_x, look_at_y, look_at_z)
{
	this.pos = new Vector (pos_x, pos_y, pos_z);

	this.up = new Vector (up_x, up_y, up_z);
	this.up.normalise();
	
	this.look_at = new Vector (look_at_x, look_at_y, look_at_z);	

		// up vector not used ??	
	this.up_x = up_x;
	this.up_y = up_y;
	this.up_z = up_z;

		// cam matrix is a Float32Array for future webgl GPU use.
	this.cam_matrix = new Float32Array
		([
			1.0, 0.0,	0.0, 0.0,
			0.0, 1.0,	0.0, 0.0,
			0.0, 0.0,	1.0, 0.0,
			0.0, 0.0,	0.0, 1.0
  		]);

	this.setPos = _cam3d_setcamera;
	this.setPos (pos_x, pos_y, pos_z, look_at_x, look_at_y, look_at_z);  		
}



Cam3D.prototype.gluLookAt(eyex, eyey, eyez,
			 			centerx, centery, centerz,
					  upx, upy, upz)
{
	// being lazy.. copied from https://stackoverflow.com/questions/13166135/how-does-glulookat-work
	// and https://www.khronos.org/opengl/wiki/GluLookAt_code

	var forward;
	var side;
	var up;
	var m =[];				//     GLfloat m[4][4];

	var dx;
	var dy;
	var dz;

	up = new Vector (upx, upy, upz);

	// ----------------------------
	dx = centerx - eyex;
	dy = centery - eyey;
	dz = centerz - eyez;
	forward = new Vector (dx,dy,dz);
	forward.normalise();
	// -----------------------------

	// side = forward x up
	side = CrossProduct (forward, up);
	side.normalise();

   //* Recompute up as: up = side x forward
   up = CrossProduct (side, forward);

	this.cam_matrix = MatrixIdentity();
	m = this.cam_matrix; 
 
 	m[0] = side.x;		//[0];
   m[4] = side.y;		//[1];
   m[8] = side.z;		//[2];
   m[12] = 0.0;
   // --------------------
   m[1] = up.x;		//[0];
   m[5] = up.y;		//[1];
   m[9] = up.z;		//[2];
   m[13] = 0.0;
   // --------------------
   m[2] = -forward.x;	//[0];
   m[6] = -forward.y;	//[1];
   m[10] = -forward.z;	//[2];
   m[14] = 0.0;

    __gluMakeIdentityf(&m[0][0]);
    m[0][0] = side[0];
    m[1][0] = side[1];
    m[2][0] = side[2];

    m[0][1] = up[0];
    m[1][1] = up[1];
    m[2][1] = up[2];

    m[0][2] = -forward[0];
    m[1][2] = -forward[1];
    m[2][2] = -forward[2];

    glMultMatrixf(&m[0][0]);
    glTranslated(-eyex, -eyey, -eyez);
}














Cam3D.prototype.setCamera = function (x,y,z, lx,ly,lz)
{
	this.setPos (x,y,z, lx,ly,lz);
}




