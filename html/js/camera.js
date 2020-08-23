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

function Cam3D (pos_x, pos_y, pos_z, up_x, up_y, up_z, look_at_x, look_at_y, look_at_z)
{
	this.pos = new Vector (pos_x, pos_y, pos_z);

	this.up = new Vector (up_x, up_y, up_z);
	this.up.normalise();

	this.look_at = new Vector (look_at_x, look_at_y, look_at_z);	

		// cam matrix is a Float32Array for future webgl GPU use.
	this.cam_matrix = new Float32Array
		([
			1.0, 0.0,	0.0, 0.0,
			0.0, 1.0,	0.0, 0.0,
			0.0, 0.0,	1.0, 0.0,
			0.0, 0.0,	0.0, 1.0
  		]);

	this.setCamera (pos_x, pos_y, pos_z,
					look_at_x, look_at_y, look_at_z);
}


Cam3D.prototype.gluLookAt = function (eyex, eyey, eyez,
			 			centerx, centery, centerz)
//					  upx, upy, upz)
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

	up = new Vector (this.up.x, this.up.y, this.up.z);	//upx, upy, upz);

	// ----------------------------
	dx = centerx - eyex;
	dy = centery - eyey;
	dz = centerz - eyez;
	forward = new Vector (dx,dy,dz);
	forward.normalise();
	// -----------------------------
	
//	if (once == 0)
//	{
//		console.log ("forward");
//		console.log (forward);
//	}

	// side = forward x up
	side = CrossProduct (forward, up);
	side.normalise();

//	if (once == 0)
//	{
//		console.log (side);
//	}

   //* Recompute up as: up = side x forward
   up = CrossProduct (side, forward);

//	if (once == 0)
//	{
//		console.log (up);
//	}

	m = MatrixIdentity();
 
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
	
//	if (once == 0)
//	{
//		console.log ("m after :" );
//		console.log (side);
//		console.log (up);
//		console.log (forward);
//		console.log (m);
		
//		console.log ("eyex:" + eyex + " eyey:" + eyey +" eyez:" + eyez);
//	}

	this.cam_matrix = MatrixIdentity();
	this.cam_matrix = MatrixTranslate (this.cam_matrix, -eyex, -eyey, -eyez);

	this.cam_matrix = MatrixMultiply (m, this.cam_matrix);		// NOTE : THE MULTIPLY ORDER MATTERS A GREAT DEAL.
	
//	if (once == 0)
//	{
//		console.log ("cam_matrix");
//		console.log (this.cam_matrix);
//	}
}

Cam3D.prototype.setCamera = function (x,y,z, lx,ly,lz)
{
	this.gluLookAt (x, y, z, lx, ly, lz);
	this.pos.x = x;
	this.pos.y = y;
	this.pos.z = z;
}




