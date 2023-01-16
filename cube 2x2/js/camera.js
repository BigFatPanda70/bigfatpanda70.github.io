/*

		Title	:	3D Camera Routines

		Info : 	Version 1.0	12th March 2020

		Author	:	Nick Fleming

		Updated	: 	12th March 2020

	 Notes:
	---------
		Provides a simple way to set a camera matrix for 3D rendering.

	Updated and tested from my old c3d camera code.	



	gluLookAt notes:
	------------------
	 .. it sets the camera at a specific distance
	from the origin (x = 0, y = 0, z = -camera distance) and rotates 
	and moves everything else to match this view.

		This distance (i think) is the distance from the camera to
	the look at position.

	So.. if you rotate your camera around the y axis to the right,
	it will create a matrix that rotates everything to the left.

	


*/

function Cam3D (pos_x, pos_y, pos_z, up_x, up_y, up_z, look_at_x, look_at_y, look_at_z)
{
	this.pos = new Vector (pos_x, pos_y, pos_z);

	this.up = new Vector (up_x, up_y, up_z);
	this.up.normalise();

	this.look_x = look_at_x;		// for matrix inverse calculations.
	this.look_y = look_at_y;
	this.look_z = look_at_z;

//	this.look_at = new Vector (look_at_x, look_at_y, look_at_z);	

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
	var m =[0,0,0,0,				//     GLfloat m[4][4];
			0,0,0,0,
			0,0,0,0,
			0,0,0,0];

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
	

	// side = forward x up
	side = CrossProduct (forward, up);
	side.normalise();


   //* Recompute up as: up = side x forward
   up = CrossProduct (side, forward);

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
	

	this.cam_matrix = MatrixIdentity();
	this.cam_matrix = MatrixTranslate (this.cam_matrix, -eyex, -eyey, -eyez);

	this.cam_matrix = MatrixMultiply (m, this.cam_matrix);		// NOTE : THE MULTIPLY ORDER MATTERS A GREAT DEAL.
	
}

Cam3D.prototype.setCamera = function (x,y,z, lx,ly,lz)
{
	this.gluLookAt (x, y, z, lx, ly, lz);
	this.pos.x = x;
	this.pos.y = y;
	this.pos.z = z;

	this.look_x = lx;		// for matrix inverse calculations.
	this.look_y = ly;
	this.look_z = lz;
}



Cam3D.prototype.getInverseMatrix = function ()
{	
	var forward;
	var side;
	var up;
	var m =[0,0,0,0,				//     GLfloat m[4][4];
			0,0,0,0,
			0,0,0,0,
			0,0,0,0];

	var m2 =[0,0,0,0,				//     GLfloat m[4][4];
			0,0,0,0,
			0,0,0,0,
			0,0,0,0];

	var dx;
	var dy;
	var dz;
	
	var eyex;
	var eyey;
	var eyez;
	
	var centerx;
	var centery;
	var centerz;
	
	eyex = this.pos.x;
	eyey = this.pos.y;
	eyez = this.pos.z;
	
	centerx = this.look_x;
	centery = this.look_y;
	centerz = this.look_z;

	up = new Vector (this.up.x, this.up.y, this.up.z);	//upx, upy, upz);

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

	m = MatrixIdentity();
 
	m[0] = -side.x;		//[0];
	m[4] = -side.y;		//[1];
	m[8] = -side.z;		//[2];
	m[12] = 0.0;
   // --------------------
	m[1] = -up.x;		//[0];
	m[5] = -up.y;		//[1];
	m[9] = -up.z;		//[2];
	m[13] = 0.0;
   // --------------------
	m[2] = forward.x;	//[0];
	m[6] = forward.y;	//[1];
	m[10] = forward.z;	//[2];
	m[14] = 0.0;
	

	m2 = MatrixIdentity();
	m2 = MatrixTranslate (m2, eyex, eyey, eyez);

	m = MatrixMultiply (m2, m);		// NOTE : THE MULTIPLY ORDER MATTERS A GREAT DEAL.

	return m;
}
