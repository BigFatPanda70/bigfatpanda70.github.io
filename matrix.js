/*

	Title	:	Core Matrix Stuff.
	Version	:	1.01	21st July 2019
	Author	:	Nick Fleming
	Updated	:	11th March 2020

	 Notes:
	-------
	
	 16th June 2013:
	------------------

		Moving *all* the most up to date matrix code into one file and doing some 'slight' optimisations.


	 21st July 2019.
	----------------
		Adding some optimisations for doing large scale matrix multiplication on vertex arrays
		vertex = (x,y,z,w)	and 4x4 matrices

	 28th August 2019
	-------------------
		Corrected projection matrix top and bottom (they were inverted).
		so that projection matches opengl.

	 11th March 2020
	-------------------
		Quick code cleanup for posting to github site.
*/


  // ==================================
  // ======== 4x4 Matrix Stuff ========
  // ==================================

  function MatrixMultiply (a, b)
  {
	  // note most of matrix work will be done on the gpu where possible.
	  // http://www.intmath.com/matrices-determinants/matrix-multiplication-flash.php

	  //	m[0]  m[4]  m[ 8]  m[12]		note the layout (column major -> its a bit weird really...).
	  //	m[1]  m[5]  m[ 9]  m[13]
	  //	m[2]  m[6]  m[10]  m[14]
	  // 	m[3]  m[7]  m[11]  m[15]
	
	var tmp = new Array(16);
	
	var r;

	var c;
	var i;

	i = 0;
	for (r = 0; r < 4; r++)
	{
		for (c = 0; c < 16; c += 4)
		{
			tmp[c+r] = (a[r] * b[c]) + (a[r+4]*b[c+1]) + (a[r+8]*b[c+2]) + (a[r+12]*b[c+3]);
		}
	}

	return tmp;
}

function MatrixIdentity()
{


	return new Array (	1.0, 0.0, 0.0, 0.0, 
				0.0, 1.0, 0.0, 0.0, 
				0.0, 0.0, 1.0, 0.0,
				0.0, 0.0, 0.0, 1.0);
}

function MatrixTranslate (m_in, tx, ty, tz)
{
	var m = new Array (1,0,0,0, 0,1,0,0, 0,0,1,0, tx,ty,tz,1);

	return MatrixMultiply(m, m_in);
}

function MatrixScale (m_in, sx, sy, sz)
{
	var m = new Array (sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1);

	return MatrixMultiply(m_in, m);
}

function MatrixRotate (m_in, rx, ry, rz)
{
	// note that this rotates about the default axis, and so 
	// it will suffer from 'gimbal lock' at times.

	// - cut and pasted from my maze_3d.htm code. (and slightly modified).

//	m[0]  m[4]  m[ 8]  m[12]		note the layout (its a bit weird, but useful).
//	m[1]  m[5]  m[ 9]  m[13]
//	m[2]  m[6]  m[10]  m[14]
// 	m[3]  m[7]  m[11]  m[15]

	var m_combined = MatrixIdentity();
	var m;

	var a;
	var pi;
	var cos_a;
	var sin_a;


	pi = Math.PI;

	if (rx != 0.0)
	{
		a = (rx * pi) / 180.0;		// degrees to radians.
		cos_a = Math.cos(a);
		sin_a = Math.sin(a);

		m_combined[5] = cos_a;
		m_combined[6] =-sin_a;
		m_combined[9] = sin_a;
		m_combined[10]= cos_a;
	}

	if (ry != 0)
	{
		a = (ry * pi) / 180.0;
		cos_a = Math.cos(a);
		sin_a = Math.sin(a);

		m = MatrixIdentity();
		m[0] = cos_a;
		m[2] = sin_a;
		m[8] = -sin_a;
		m[10]= cos_a;
		m_combined = MatrixMultiply (m_combined, m);
	}

	if (rz != 0)
	{
		a = (rz * pi) / 180.0;
		cos_a = Math.cos(a);
		sin_a = Math.sin(a);
	
		m = MatrixIdentity();
                
		m[0] = cos_a;
		m[1] =-sin_a;
		m[4] = sin_a;
		m[5] = cos_a;
 
		m_combined = MatrixMultiply (m_combined, m);
	}

	return MatrixMultiply (m_combined, m_in);
}

function MatrixAxisRotate (x,y,z, angle)
{
	// ** NEEDS TESTING ***

	// this should be good for camera viewing where the axis to rotate about is 
	// the 'up' vector.
	// x,y,z should be a unit vector for *any* arbitary axis to rotate around.
	// see :
	// http://www.euclideanspace.com/maths/algebra/matrix/orthogonal/rotation/index.htm

//	1 + (1-cos(angle))*(x*x-1)		-z*sin(angle)+(1-cos(angle))*x*y	y*sin(angle)+(1-cos(angle))*x*z
//	z*sin(angle)+(1-cos(angle))*x*y		1 + (1-cos(angle))*(y*y-1)		-x*sin(angle)+(1-cos(angle))*y*z
//	-y*sin(angle)+(1-cos(angle))*x*z	x*sin(angle)+(1-cos(angle))*y*z		1 + (1-cos(angle))*(z*z-1)

	var cos_a;
	var sin_a;
	var pi;

	pi = 3.14159;

	m[0] = 1+(1-cos_a)*(x*x-1);
	m[1] = z*sin_a+(1-cos_a)*x*y;
	m[2] = -y*sin_a+(1-cos_a)*x*z;

	m[4] = -z*sin_a+(1-cos_a)*x*y;
	m[5] = 1+(1-cos_a)*(y*y-1);
	m[6] = x*sin_a+(1-cos_a)*y*z;

	m[8] = y*sin_a+(1-cos_a)*x*z;
	m[9] = -x*sin_a+(1-cos_a)*y*z;
	m[10]= 1 + (1-cos_a)*(z*z-1);

}

function MatrixVectorMultiply (m, v)
{
	var result = new Array(4);
	var x;
	var y;
	var z;
	var w;

	x = 0;
	y = 1;
	z = 2;
	w = 3;

	result[0] = (m[0] * v[x]) + (m[4] * v[y]) + (m[8] * v[z]) + (m[12] * v[w]);
	result[1] = (m[1] * v[x]) + (m[5] * v[y]) + (m[9] * v[z]) + (m[13] * v[w]);
	result[2] = (m[2] * v[x]) + (m[6] * v[y]) + (m[10]* v[z]) + (m[14] * v[w]);
	result[3] = (m[3] * v[x]) + (m[7] * v[y]) + (m[11]* v[z]) + (m[15] * v[w]);

	return result;
}


function MatrixVectorArrayMultiply (m, v, r)
{
		// 21st July 2019 - Under construction.
		// assumes v and r are arrays of the same length, each 
		// with 4 consecutive array elements for
		// x,y,z and w
		
		// note tx,ty,tz and tw are used so that v and r could be the same 
		// array if required. 

	//	m[0]  m[4]  m[ 8]  m[12]
	//	m[1]  m[5]  m[ 9]  m[13]
	//	m[2]  m[6]  m[10]  m[14]
	// 	m[3]  m[7]  m[11]  m[15]


	var x;
	var y;
	var z;
	var w;
	var i;
	
	var tx;
	var ty;
	var tz;
	var tw;

//	if (once == 0)
//	{
//		console.log ("<MMMMMM>");
//		console.log (m);
//	}
	for (i = 0; i < v.length; i += 4)
	{
		x = v[i]
		y = v[i+1];
		z = v[i+2];
		w = v[i+3];

		tx = (m[0] * x) + (m[4] * y) + (m[8] * z) + (m[12] * w);
		ty = (m[1] * x) + (m[5] * y) + (m[9] * z) + (m[13] * w);
		tz = (m[2] * x) + (m[6] * y) + (m[10]* z) + (m[14] * w);
		tw = (m[3] * x) + (m[7] * y) + (m[11]* z) + (m[15] * w);

//	if (once == 0) console.log ("i:" + i + " x:" + x + " y:" + y + " z:" + z + " w:" + w);
//	if (once == 0) console.log ("i:" + i + " tx:" + tx + " ty:" + ty + " tz:" + tz + " tw:" + tw);

		r[i+0] = tx;
		r[i+1] = ty;
		r[i+2] = tz;
		r[i+3] = tw;
	}
}




function MatrixTest()
{
	// short matrix multiply test for column major matrices.
	// two random matrices to test with : http://www.intmath.com/matrices-determinants/matrix-multiplication-flash.php

	// 7 3 3 2
	// 7 1 5 -2
	// 6 2 7 1
	// 3 6 0 0

	// 6 5 -1 3
	// 0 0 3 1
	// 0 0 2 4
	// 0 -1 0 7


	// result:
	// 42 33 8 50
	// 42 37 6 28
	// 36 29 14 55
	// 18 15 15 15


	var lp;

	var a = new Array (7,7,6,3, 3,1,2,6, 3,5,7,0, 2,-2,1,0);		// stored in column-major order
	var b = new Array (6,0,0,0, 5,0,0,-1, -1,3,2,0, 3,1,4,7);

	var result = new Array (42,42,36,18, 33,37,29,15, 8,6,14,15, 50,28,55,15);

	var c = MatrixMultiply (a, b);

	var success;

	success = true;
	for (lp = 0; lp < 16; lp++)
	{
		if (result[lp] != c[lp])
		{
			success = false;
		}
	}
	if (success == false)
	{
		alert ("multiply failed\n\n"+
		c[0]+" "+c[4]+" "+c[8]+" "+c[12]+'\n'+
		c[1]+" "+c[5]+" "+c[9]+" "+c[13]+'\n'+
		c[2]+" "+c[6]+" "+c[10]+" "+c[14]+'\n'+
		c[3]+" "+c[7]+" "+c[11]+" "+c[15]);
	}
	console.log ("matrix test .. ok");
}

function MatrixAdd (ma, mb)
{
	var m = new Array (16);
	var i;

	for (i = 0; i < 16; i++)
	{
		m[i] = ma[i] + mb[i];
	}

	return m;
}

function Matrix_CreatePerspectiveProjectionMatrix(canvas_width, 
						canvas_height, field_of_view, z_near, z_far)
{
	//	m[0]  m[4]  m[ 8]  m[12]
	//	m[1]  m[5]  m[ 9]  m[13]
	//	m[2]  m[6]  m[10]  m[14]
	// 	m[3]  m[7]  m[11]  m[15]

	// field_of_view = 30.0 for most common views.
  // 10/11/11 - transposed m[11] and m[14] - its a bit of a hack but it
  // works.. hate opengl column major matrices !!!

  
	// --- perspective matrix stuff, 
	// refs:
	// http://www.opengl.org/wiki/GluPerspective_code
	// http://nehe.gamedev.net/article/replacement_for_gluperspective/21002/
	// http://www.geeks3d.com/20090729/howto-perspective-projection-matrix-in-opengl/
	// https://www.khronos.org/opengl/wiki/GluPerspective_code

		// first part is my version of 'gluperspective'
		

//	console.log ("Matrix : CreatePerspectiveProjMat=--------------------------------");
//	console.log ("cw : " + canvas_width);
//	console.log ("ch : " + canvas_height);
//	console.log ("fov: " + field_of_view);
//	console.log ("nz :" + z_near);
//	console.log ("fz :" + z_far);		

	var pi = Math.PI;	//3.141592;

	var field_of_view_in_degrees = field_of_view;
	var aspect_ratio = canvas_width / canvas_height;
	
//	console.log ("asp ratio : " + aspect_ratio);

	var xmax;
	var ymax;

	ymax = z_near * Math.tan(((field_of_view_in_degrees/2) * pi) / 180.0);
	xmax = ymax * aspect_ratio;
	
//	console.log ("ymax " + ymax);
//	console.log ("xmax " + xmax);

		// second part is my version of 'glfrustum'

	var left = -xmax;
	var right = xmax;
	var top = ymax;
	var bottom = -ymax;
	
	var m = [];	//new Array (0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0);

		// note I have assumed viewing volume is symmetrical 
		// i.e. top = -bottom and right = -left

	m[0] = (2 * z_near) / (right - left);
	m[1] = 0;
	m[2] = 0;
	m[3] = 0;

	m[4] = 0;
	m[5] = (2* z_near) / (top - bottom);
	m[6] = 0;
	m[7] = 0;

	m[8] = (right + left) / (right - left);
	m[9] = (top+bottom) / (top - bottom);
	m[10] = (-z_far - z_near) / (z_far - z_near);	//	m[10] = -(z_far + z_near) / (z_far - z_near);
	m[11] = -1;

	m[12] = 0;
	m[13] = 0;
	m[14] = -((2 * z_far * z_near) / (z_far - z_near));		//	m[14] = ((2 * z_far * z_near) / (z_far - z_near));
	m[15] = 0;

	return new Float32Array(m);
}


function Matrix4x4Inverse (m, invOut)
{
		// UNTESTED CODE.
	// m = [16]	invOut = [16]

		// creates the inverse of a 4x4 matrix.. this is a LOT of horrible code !!
		
		// from https://stackoverflow.com/questions/1148309/inverting-a-4x4-matrix
		// also posted here https://www.gamedev.net/forums/topic/648190-algorithm-for-4x4-matrix-inverse/

//bool gluInvertMatrix(const double m[16], double invOut[16])
//{
//    double inv[16], det;
//    int i;
	var inv = [];
	var det;
	var i;

    inv[0] = m[5]  * m[10] * m[15] - 
             m[5]  * m[11] * m[14] - 
             m[9]  * m[6]  * m[15] + 
             m[9]  * m[7]  * m[14] +
             m[13] * m[6]  * m[11] - 
             m[13] * m[7]  * m[10];

    inv[4] = -m[4]  * m[10] * m[15] + 
              m[4]  * m[11] * m[14] + 
              m[8]  * m[6]  * m[15] - 
              m[8]  * m[7]  * m[14] - 
              m[12] * m[6]  * m[11] + 
              m[12] * m[7]  * m[10];

    inv[8] = m[4]  * m[9] * m[15] - 
             m[4]  * m[11] * m[13] - 
             m[8]  * m[5] * m[15] + 
             m[8]  * m[7] * m[13] + 
             m[12] * m[5] * m[11] - 
             m[12] * m[7] * m[9];

    inv[12] = -m[4]  * m[9] * m[14] + 
               m[4]  * m[10] * m[13] +
               m[8]  * m[5] * m[14] - 
               m[8]  * m[6] * m[13] - 
               m[12] * m[5] * m[10] + 
               m[12] * m[6] * m[9];

    inv[1] = -m[1]  * m[10] * m[15] + 
              m[1]  * m[11] * m[14] + 
              m[9]  * m[2] * m[15] - 
              m[9]  * m[3] * m[14] - 
              m[13] * m[2] * m[11] + 
              m[13] * m[3] * m[10];

    inv[5] = m[0]  * m[10] * m[15] - 
             m[0]  * m[11] * m[14] - 
             m[8]  * m[2] * m[15] + 
             m[8]  * m[3] * m[14] + 
             m[12] * m[2] * m[11] - 
             m[12] * m[3] * m[10];

    inv[9] = -m[0]  * m[9] * m[15] + 
              m[0]  * m[11] * m[13] + 
              m[8]  * m[1] * m[15] - 
              m[8]  * m[3] * m[13] - 
              m[12] * m[1] * m[11] + 
              m[12] * m[3] * m[9];

    inv[13] = m[0]  * m[9] * m[14] - 
              m[0]  * m[10] * m[13] - 
              m[8]  * m[1] * m[14] + 
              m[8]  * m[2] * m[13] + 
              m[12] * m[1] * m[10] - 
              m[12] * m[2] * m[9];

    inv[2] = m[1]  * m[6] * m[15] - 
             m[1]  * m[7] * m[14] - 
             m[5]  * m[2] * m[15] + 
             m[5]  * m[3] * m[14] + 
             m[13] * m[2] * m[7] - 
             m[13] * m[3] * m[6];

    inv[6] = -m[0]  * m[6] * m[15] + 
              m[0]  * m[7] * m[14] + 
              m[4]  * m[2] * m[15] - 
              m[4]  * m[3] * m[14] - 
              m[12] * m[2] * m[7] + 
              m[12] * m[3] * m[6];

    inv[10] = m[0]  * m[5] * m[15] - 
              m[0]  * m[7] * m[13] - 
              m[4]  * m[1] * m[15] + 
              m[4]  * m[3] * m[13] + 
              m[12] * m[1] * m[7] - 
              m[12] * m[3] * m[5];

    inv[14] = -m[0]  * m[5] * m[14] + 
               m[0]  * m[6] * m[13] + 
               m[4]  * m[1] * m[14] - 
               m[4]  * m[2] * m[13] - 
               m[12] * m[1] * m[6] + 
               m[12] * m[2] * m[5];

    inv[3] = -m[1] * m[6] * m[11] + 
              m[1] * m[7] * m[10] + 
              m[5] * m[2] * m[11] - 
              m[5] * m[3] * m[10] - 
              m[9] * m[2] * m[7] + 
              m[9] * m[3] * m[6];

    inv[7] = m[0] * m[6] * m[11] - 
             m[0] * m[7] * m[10] - 
             m[4] * m[2] * m[11] + 
             m[4] * m[3] * m[10] + 
             m[8] * m[2] * m[7] - 
             m[8] * m[3] * m[6];

    inv[11] = -m[0] * m[5] * m[11] + 
               m[0] * m[7] * m[9] + 
               m[4] * m[1] * m[11] - 
               m[4] * m[3] * m[9] - 
               m[8] * m[1] * m[7] + 
               m[8] * m[3] * m[5];

    inv[15] = m[0] * m[5] * m[10] - 
              m[0] * m[6] * m[9] - 
              m[4] * m[1] * m[10] + 
              m[4] * m[2] * m[9] + 
              m[8] * m[1] * m[6] - 
              m[8] * m[2] * m[5];

    det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

    if (det == 0)
        return false;

    det = 1.0 / det;

    for (i = 0; i < 16; i++)
        invOut[i] = inv[i] * det;

    return true;
}


