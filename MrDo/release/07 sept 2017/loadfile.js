// 	Title	:	Binary File Loader (for loading ROM files directly )

//		Info	:	Version 1.0 9th August 2017

//		Author:	Nick Fleming

//		Updated:	9th August 2017.

//		Notes:
//		--------
//		Experimental routines for loading a binary file into a typed array. 
//		(I have no idea if this will work !)
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//		References:
//	https://www.html5rocks.com/en/tutorials/file/dndfiles/
//
//

function BFL_FileLoadSupported()
{
	if (window.File && window.FileReader && window.FileList && window.Blob) 
	{
		// Great success! All the File APIs are supported.
		console.log ("binary file loading supported");
		return true;
	}
	
	console.log ("binary file loading unavailable");
	return false;
}

function BFL_LoadBinaryFile(filename)
{
}