/* --------------------------

	Title	:	3D .obj file to raw data reader.
	
	Info	:	Version 0.1	20th March 2020
	
	Author:	Nick Fleming

	Updated:	20th March 2020
	
	 Notes:
	--------

	Converts a 3D .obj file to raw vertex & face data, outputs as text
	for javascript files.
	
	
	 17th September 2019
	-----------------------
	Converting code to directly store data as internal 3D object , to reduce the number of conversion routines required.

	 18th September 2019
	-----------------------
		Some crappy .obj file generators put a double space after the v on a line. I don't know why they do that..
	but javascript doesn't like it, so i am now sanitising my inputs !! 

	.. some models have 4 items per face.. so I have to handle quads.
	
	e.g.
	
	f 0 1 2 3
	
	goes to two triangles..
	
	0 1 2
	
	0 2 3
	 
----------------------------- */

/*
function ObjVertex (x,y,z) 
{
	this.x = x;
	this.y = y;
	this.z = z;
} 

function ObjFace (v0,v1,v2)
{
	this.v0 = v0;
	this.v1 = v1;
	this.v2 = v2;
}
*/

function ReadObjFile (objfile, vertex_array, surface_array)	//vertex_array, surface_array, normal_array, texture_array)
{
	// vertex_array = [];
	// surface_array = [];

		// ** UNDER CONSTRUCTION ****

	var lp;
	var line_type;
	var tokens;
	var v;
	var f;
	var x;
	var y;
	var z;
	var face;
	var v0;
	var v1;
	var v2;
	var v3;

	var vi;
	var fi;
	
		// help garbage collector ??	
	obj.vertex_list = [];
	obj.surface_list = [];

	var vertex_array = obj.vertex_list;
	var surface_array = obj.surface_list;

	lines = objfile.split('\n');		// split text file into line array

	v = 0;
	f = 0;
	vi = 0;
	fi = 0;
	for (lp = 0; lp < lines.length; lp++)
	{
		lines[lp] = lines[lp].replace(/\s\s+/g, ' ');		// remove tabs & double spaces.

		tokens = lines[lp].split(" ");	// split the line into an array of tokens.
		
//		console.log (tokens);
	
		switch(tokens[0])		// look at the first token of the line data. 
		{
			case '#':		// line is a comment, so just skip it
							break;
			case 'v':		// line is vertex.

							x = parseFloat(tokens[1].trim());
							y = parseFloat(tokens[2].trim());
							z = parseFloat(tokens[3].trim());
							vertex_array[vi++] = x;
							vertex_array[vi++] = y;
							vertex_array[vi++] = z;
							v++;
							break;

			case 'f':		// face data., each token needs splitting again using '/' as split character.
								// each face token can contain vertex/texture/normal data. for now
								// only interested in vertex info.
								
								// note '-1' is used as in the file, indices start at 1 and not zero (why???? idk !!)

							face = tokens[1].split("/");
							v0 = parseFloat (face[0].trim()) - 1;

							face = tokens[2].split("/");
							v1 = parseFloat (face[0].trim()) - 1;

							face = tokens[3].split("/");
							v2 = parseFloat (face[0].trim()) - 1;

//							surface_array[f] = new Object3D_Surface (v0,v1,v2);
							surface_array[fi++] = v0;
							surface_array[fi++] = v1;
							surface_array[fi++] = v2;
							f++;

							if (tokens.length == 5)
							{
								if (tokens[4].length > 0)
								{
									face = tokens[4].split("/");
									v3 = parseFloat (face[0].trim()) - 1;
//									surface_array[f] = new Object3D_Surface (v0,v2,v3);
									surface_array[fi++] = v0;
									surface_array[fi++] = v2;
									surface_array[fi++] = v3;
									f++;
								}
							}							
					
							break;

			default:		// unknown, so skip for now
							break;	

		}
	}

	console.log ("vertices : " + v + " faces :" + f);
}

