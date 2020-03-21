/*

Title:	Create IcoSphere

Info:	Version 0.0	21st March 2020

Author:	Nick Fleming

Updated:	21st March 2020

 Notes:
-------
	creates an array of x,y,z coordinates for vertices
	as well as an array of vertex indices for faces.

	// based on : https://en.wikipedia.org/wiki/Regular_icosahedron
	// and : http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html
*/

function CreateIcosahedron (vertex_array, face_array)
{
	var t;
	var i;
	var v;
	var f;

	t = (1 + Math.sqrt(5))/2;

	i = 0;
	v = vertex_array;
	
	v[i++] =-1;	v[i++] = t;	v[i++] = 0;		// addVertex(new Point3D(-1,  t,  0));
	v[i++] = 1; v[i++] = t; v[i++] = 0;		// addVertex(new Point3D( 1,  t,  0));
	v[i++] =-1; v[i++] =-t; v[i++] = 0;		// addVertex(new Point3D(-1, -t,  0));
	v[i++] = 1; v[i++] =-t; v[i++] = 0;		// addVertex(new Point3D( 1, -t,  0));

	v[i++] = 0; v[i++] =-1; v[i++] = t;		// addVertex(new Point3D( 0, -1,  t));
	v[i++] = 0; v[i++] = 1; v[i++] = t;		// addVertex(new Point3D( 0,  1,  t));
	v[i++] = 0; v[i++] =-1; v[i++] =-t;		// addVertex(new Point3D( 0, -1, -t));
	v[i++] = 0; v[i++] = 1; v[i++] =-t;		// addVertex(new Point3D( 0,  1, -t));

	v[i++] = t; v[i++] = 0;	v[i++] =-1;		// addVertex(new Point3D( t,  0, -1));
	v[i++] = t; v[i++] = 0; v[i++] = 1;		// addVertex(new Point3D( t,  0,  1));
	v[i++] =-t; v[i++] = 0; v[i++] =-1;		// addVertex(new Point3D(-t,  0, -1));
	v[i++] =-t; v[i++] = 0; v[i++] = 1;		// addVertex(new Point3D(-t,  0,  1));

	i = 0;
	f = face_array;

		// 5 faces around point 0
	f[i++] = 0;	f[i++] = 11; f[i++] = 5;	//faces.Add(new TriangleIndices(0, 11, 5));
	f[i++] = 0;	f[i++] =  5; f[i++] = 1;	//faces.Add(new TriangleIndices(0, 5, 1));
	f[i++] = 0;	f[i++] =  1; f[i++] = 7;	//faces.Add(new TriangleIndices(0, 1, 7));
	f[i++] = 0;	f[i++] =  7; f[i++] = 10;	//faces.Add(new TriangleIndices(0, 7, 10));
	f[i++] = 0;	f[i++] = 10; f[i++] = 11;	//faces.Add(new TriangleIndices(0, 10, 11));

		// 5 adjacent faces
	f[i++] = 1;	f[i++] =  5; f[i++] = 9;	//faces.Add(new TriangleIndices(1, 5, 9));
	f[i++] = 5;	f[i++] = 11; f[i++] = 4;	//faces.Add(new TriangleIndices(5, 11, 4));
	f[i++] =11;	f[i++] = 10; f[i++] = 2;	//faces.Add(new TriangleIndices(11, 10, 2));
	f[i++] =10;	f[i++] =  7; f[i++] = 6;	//faces.Add(new TriangleIndices(10, 7, 6));
	f[i++] = 7;	f[i++] =  1; f[i++] = 8;	//faces.Add(new TriangleIndices(7, 1, 8));

		// 5 faces around point 3
	f[i++] = 3;	f[i++] =  9; f[i++] = 4;	//faces.Add(new TriangleIndices(3, 9, 4));
	f[i++] = 3;	f[i++] =  4; f[i++] = 2;	//faces.Add(new TriangleIndices(3, 4, 2));
	f[i++] = 3;	f[i++] =  2; f[i++] = 6;	//faces.Add(new TriangleIndices(3, 2, 6));
	f[i++] = 3;	f[i++] =  6; f[i++] = 8;	//faces.Add(new TriangleIndices(3, 6, 8));
	f[i++] = 3;	f[i++] =  8; f[i++] = 9;	//faces.Add(new TriangleIndices(3, 8, 9));

		// 5 adjacent faces
	f[i++] = 4;	f[i++] = 9; f[i++] =  5;	//faces.Add(new TriangleIndices(4, 9, 5));
	f[i++] = 2;	f[i++] = 4; f[i++] = 11;	//faces.Add(new TriangleIndices(2, 4, 11));
	f[i++] = 6;	f[i++] = 2; f[i++] = 10;	//faces.Add(new TriangleIndices(6, 2, 10));
	f[i++] = 8;	f[i++] = 6; f[i++] =  7;	//faces.Add(new TriangleIndices(8, 6, 7));
	f[i++] = 9;	f[i++] = 8; f[i++] =  1;	//faces.Add(new TriangleIndices(9, 8, 1));
}
