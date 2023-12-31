/* -------------------------------------------------------

	Title	:	File Reading Code.
	
	Info	:	Version 2.1 3rd February 2020
	
	Author:	Nick Fleming.
	
	Updated:	31st December 2023
	
	 Notes:
	--------
		Some simple code to read & parse a text file.
	Note. Javascript can't read in a local file directly without it being specified by the user.
	This is by design, for security reasons.

	code from : https://stackoverflow.com/questions/14446447/how-to-read-a-local-text-file

	 To use :
	===========
	
	Create a File object somewhere in your code.
	
	var f = new File();
	
	then just call load with the callback to where you want the data sending.
	
	e.g.
		function loaded (str)
		{
			// str = loaded text file.
		}
		:		:		:
		f.load (loaded);

	handles creation and destruction of hidden input button so it doesn't have
	to appear on the screen anywhere :-)


	 Notes on 'this'
	-----------------
	I tried calling a routine XFile.prototype.readFile as a callback
	but the 'this' referred to the calling object and NOT the XFile object.
	Most confusing !!
		 see here for info :
		 https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback/20279485#20279485
		 
	using bind() keyword to resolve this.
	
	
	 3rd February 2020
	--------------------
		After a bit of googling and debugging.. this actually WORKS !! woohoo !!

	 4th February 2020
	-------------------
		Adding a simple image file reader.
--------------------------------------------------------- */

	// ---- constructor for file object ----

function XFile()
{
	this.callback = null;
	this.fileInput = null;
	this.reader = null;
}

XFile.prototype.Loaded = function (e)
{
		// CAUTION !!! for event callbacks,
		// USE .bind() to make sure correct 'this' value is used.

	contents = e.target.result;
	document.body.removeChild(this.fileInput);
	this.fileInput = null;
	
	if (this.callback != null)
	{
		this.callback (contents);
	}
}

XFile.prototype.readFile = function (e)
{
		// CAUTION !!! for event callbacks,
		// USE .bind() to make sure correct 'this' value is used.
		
	var fh;

	fh = e.target.files[0];
	if (!fh)
	{
		document.body.removeChild(this.fileInput);
		return;
	}
	
	this.reader = new FileReader();
	this.reader.onload = this.Loaded.bind(this);
	this.reader.readAsText (fh);
}

XFile.prototype.load = function(callback_function)
{
			// https://stackoverflow.com/questions/3582671/how-to-open-a-local-disk-file-with-javascript
			
	if (this.fileInput == null)
	{
		this.fileInput = document.createElement("input")
		this.fileInput.type='file'
		this.fileInput.style.display='none'
		this.fileInput.onchange = this.readFile.bind (this);	//XFileReadFile;
		document.body.appendChild(this.fileInput);
 	}
	this.fileInput.click();
	this.callback = callback_function;
}

	// ====== raw data file reading =======

XFile.prototype.readRawFile = function (e)
{
		// CAUTION !!! for event callbacks,
		// USE .bind() to make sure correct 'this' value is used.
		
	var fh;

	fh = e.target.files[0];
	if (!fh)
	{
		document.body.removeChild(this.fileInput);
		return;
	}
	
	this.reader = new FileReader();
	this.reader.onload = this.Loaded.bind(this);
//	this.reader.readAsText (fh);
	this.reader.readAsArrayBuffer (fh);	
}

XFile.prototype.loadRaw = function(callback_function)
{
			// https://stackoverflow.com/questions/3582671/how-to-open-a-local-disk-file-with-javascript
			
	if (this.fileInput == null)
	{
		this.fileInput = document.createElement("input")
		this.fileInput.type='file'
		this.fileInput.style.display='none'
		this.fileInput.onchange = this.readRawFile.bind (this);	//XFileReadFile;
		document.body.appendChild(this.fileInput);
 	}
	this.fileInput.click();
	this.callback = callback_function;
}


	//-------------------------------------------------------------------------
	//			-------------- image loader code goes here ---------------
	//-------------------------------------------------------------------------

var XFile_ImgFileInput;
var XFile_ImgFileReader;
var XFile_ImgLoadCallback;

function XFile_LoadedImg(e)
{
		// retrieve data from results.

	document.body.removeChild(XFile_ImgFileInput);

	XFile_ImgLoadCallback (e.target.result);
}

function XFile_DoLoadImg(e)
{
		// create a file reader with input results.
	var fh;

	fh = e.target.files[0];
	if (!fh)
	{
		document.body.removeChild(XFile_ImgFileInput);
		XFile_ImgLoadCallback (null);
		return;
	}

	XFile_ImgFileReader = new FileReader();
	XFile_ImgFileReader.onload = XFile_LoadedImg;
	XFile_ImgFileReader.readAsDataURL (fh);
}

function XFile_LoadImage(callback)
{
		// create a hidden input element and click it.
	
	XFile_ImgLoadCallback = callback;

	XFile_ImgFileInput = document.createElement("input")
	XFile_ImgFileInput.type='file'
	XFile_ImgFileInput.style.display='none'
	XFile_ImgFileInput.onchange = XFile_DoLoadImg;
	document.body.appendChild(XFile_ImgFileInput);
	XFile_ImgFileInput.click();	
}



