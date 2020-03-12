/* -------------------------------------------------------------------------

	Title	:	My Javascript Vector Class

	Info	:	Version 1.0	3rd November 2011

	Author	:	Nick Fleming.

	Updated	:	3rd November 2011


	 Notes:
	---------
		More or less copied over straight from my c library

	not sure of best way to do this as want to be able
	to do stuff like

------------------------------------------------------------------------- */

	// ---------------------------
	// ---- internal routines ----
	// ---------------------------

function v_Add (a)
{
	// adds two vectors together
	this.x += a.x;
	this.y += a.y;
	this.z += a.z;
}

function v_Sub (a)
{
	this.x -= a.x;
	this.y -= a.y;
	this.z -= a.z;
}

function v_Scale(s)
{
	this.x *= s;
	this.y *= s;
	this.z *= s;
}

function v_Normalise()
{
	var square;
	var squareroot;

	square = (this.x * this.x) + (this.y * this.y) + (this.z * this.z);
	squareroot = Math.sqrt(square);

	if (squareroot != 0.0)
	{
		this.x /= squareroot;
		this.y /= squareroot;
		this.z /= squareroot;
	}
	else
	{
		this.x = 0;
		this.y = 0;
		this.z = 0;
	}
}

function v_Magnitude()
{
	var square;
	var squareroot;

	square = (this.x * this.x) + (this.y * this.y) + (this.z * this.z);
	squareroot = Math.sqrt(square);

	return squareroot;
}

	// -----------------------------------
	//	---- Public Routines ----
	// -----------------------------------

// vector constructor. 
// how to use:
// my_vector = new Vector(x,y,z);


function Vector (x,y,z)
{
	this.x = x;
	this.y = y;
	this.z = z;

	this.selected = false;		// editing flags.
	this.group = -1;				// -1 = no group

	this.add = v_Add;
	this.subtract = v_Sub;
	this.normalise = v_Normalise;
	this.magnitude = v_Magnitude;
}

function CrossProduct (v1, v2)
{
	var v3 = new Vector(0,0,0);

	v3.x = (v1.y * v2.z) - (v2.y * v1.z);
	v3.y = (v1.z * v2.x) - (v2.z * v1.x);
	v3.z = (v1.x * v2.y) - (v2.x * v1.y);

	return v3;
}

function DotProduct (v1, v2)
{
	var result;

	result = (v1.x * v2.x) + (v1.y * v2.y) + (v1.z * v2.z);

	return result;
}


