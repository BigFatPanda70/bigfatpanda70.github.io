/*
	Title	:	Inverse Projection Matrix

	Info	:	Version 0.0	8th January 2022

	Author	:	Nick Fleming

	Updated	:	8th January 2022


*/

// based on various code found on the internet.
// objective is to be faster than a complex 4x4 inverse matrix.


// opengl matrix order:
	//	m[0]  m[4]  m[ 8]  m[12]
	//	m[1]  m[5]  m[ 9]  m[13]
	//	m[2]  m[6]  m[10]  m[14]
	// 	m[3]  m[7]  m[11]  m[15]

//
//	Basic idea:
// 	projection matrix
//
// a 0 0 0
// 0 b 0 0
// 0 0 c d
// 0 0 e 0
//


// inverse matrix:
// 1/a    0    0    0
//   0  1/b    0    0
//   0    0    0  1/e
//   0    0  1/d   -c/(de)


// note : this inverse assumes that the origin is in the center
// of the screen i.e left = -right and bottom = -top.

function ProjectionMatrixInverse(pm)
{
	var a;
	var b;
	var c;
	var d;
	var e;
	var im;
	
	console.log ("ProjectionMatrixInverse");
	im = [	0,0,0,0,
			0,0,0,0,
			0,0,0,0,
			0,0,0,0];
			
	a = pm[0];
	b = pm[5];
	c = pm[10];
	d = pm[14];
	e = pm[11];

	im[0] = 1/a;
	im[5] = 1/b;
	im[10] = 0;
	im[11] = 1/d;
	im[14] = 1/e;
	im[15] = -c / (d * e);
	
	console.log (im);
	return new Float32Array (im);
}



