/*
	Title	:	Z80 Assembler

	Info	:	Javascript Version 0.0	4th September 2023

	Author	:	Nick Fleming

	Updated	:	4th September 2023



// reasonably straightforward copy from my c source code to
// javascript.

//	started 4th September 2023



	 To Use
	---------

	Call Z80_Start() to set everything up.

	Call Z80_Asm (source_text) to assemble the code. Each time 



*/



function RAMBANK ()
{
	this.data_array = new ArrayBuffer (65536);
	this.data = Uint8dArray (this.data_array);
}

function Z80_SOURCE_FILE()
{
	this.filename;
}


var OUTPUT_MODE_48K = 0;
var OUTPUT_MODE_128K = 1;
var OUTPUT_MODE_Z80 = 2;
var OUTPUT_MODE_Z80_128K = 3;

var _pass_one_ProgramCounter = null
var _pass_one_error_level = 0;

var _ProgramOrg = null;
var _CodeArrayBuffer;
var _CodeBuffer;		// a full 64K of space for storing code in

var _RamBank = [];		// space for 8 16K ram banks. (for 128K files)

var _z80_output_mode = OUTPUT_MODE_48K;	//48k = default.

//char* _z80_sym_filename = NULL;

	// ---------------------------------------------
	//		Private Routines.
	// ---------------------------------------------

function _z80_SetRamBanks()
{
	// creates all the ram banks memory required.

	// TO DO :set banks 5 and 2 to be identical to the
	// corresponding parts in the code buffer.
	// _RamBank[0] is assumed to be the top 128K of ram.
	
	var i;
	var d;

	for (i = 0; i < 8; i++)
	{
		_RamBank[i] = new RAMBANK();
	}
}

function _z80_pass_one (source_file)
{
		// for now, as a change from the c version, just going to
		// have a singlesingle file, rather than multiple ones.

	var r;

	r = Z80_PassOne (source_file);
	return r;

/*	Z80_SOURCE_FILE* ptr;
	int item_id;
	int retval;

	item_id = GetHeadItemId (source_file_list);
	while (item_id != INVALID_ITEM_ID)
	{
		ptr = (Z80_SOURCE_FILE*) GetItem (source_file_list, item_id);
		if (ptr == NULL)
		{
			Debug (DEBUG_FATAL_ERROR, "z80.c : pass_one(): ** ERROR ** : unable to find item in list");
			return RETCODE_ERROR;
		}

		retval = Z80_PassOne (GetStringPtr (&ptr->filename));
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

		item_id = GetNextItemId (source_file_list, item_id);
	}
	return RETCODE_OK;
*/
}


function _z80_destroy_file_list (z80_list)
{
		// javascript version does nothing for now.
/*	Z80_SOURCE_FILE* ptr;
	int item_id;

	item_id = GetHeadItemId (z80_list);
	while (item_id != INVALID_ITEM_ID)
	{
		ptr = (Z80_SOURCE_FILE*) GetItem (z80_list, item_id);
		if (ptr == NULL)
		{
			Debug (DEBUG_FATAL_ERROR, "z80.c : _z80_destroy_file_list(): ** ERROR ** : unable to find item in list");
			return;
		}
		DestroyString (&ptr->filename);
		item_id = GetNextItemId (z80_list, item_id);
	}

	DestroyList (z80_list);
*/
}

function _z80_parse_makefile (z80_list, makefile)
{
	// no makefile for javascript version.

/*	FILE* fp;
	FILELINESCANNER scanner;
	char buffer [BUFFER_SIZE];

	Z80_SOURCE_FILE source_file;
	int retval;
	int item_id;

	STRING tmp;

	retval = OpenFileLineScanner (&scanner, makefile, &buffer[0], BUFFER_SIZE);
	if (retval == RETCODE_ERROR)
	{
		DebugString (DEBUG_TRACE, "z80.c :parse_makefile() : ** ERROR ** Unable to initialise makefile scanner: ", makefile);
		Msg ("Internal Error:Unable to initialise makefile scanner");
		return RETCODE_ERROR;
	}

	retval = GetFileLine (&scanner);
	while (FileLineScanDone (&scanner) != RETCODE_TRUE)
	{
		fp = FileOpen (buffer, "rb");
		if (fp == NULL)
		{
			CreateString (&tmp);
			SetString (&tmp, "Error: File ");
			ConcatRawString (&tmp, buffer);
			ConcatRawString (&tmp, " not found.");
			Msg (GetStringPtr (&tmp));

			DestroyString (&tmp);
			EndFileLineScan (&scanner);
			return RETCODE_ERROR;
		}
		CloseFile (fp);
		DebugString (DEBUG_TRACE, "source file : ", buffer);

		CreateString (&source_file.filename);
		SetString (&source_file.filename, buffer);

		retval = AddItem (z80_list, &source_file, &item_id);
		if (retval == RETCODE_ERROR)
		{
			DestroyString (&source_file.filename);
			Debug (DEBUG_TRACE, "z80.c : parse_makefile(): unable to add item to list");
			Msg ("Internal error : unable to access source file list");
			return RETCODE_ERROR;
		}

		retval = GetFileLine (&scanner);
	}
	EndFileLineScan (&scanner);

	return RETCODE_OK;
*/
}

function _z80_ShowCodeSize()
{
	// ** TO DO **
/*	char tmp [256];
	int codesize;

	codesize = _pass_one_ProgramCounter - _ProgramOrg;
	sprintf (&tmp[0], "ORG:%d CodeSize:%d", _ProgramOrg, codesize);

	Msg (tmp);
*/
}

function _z80_DoPassOne()
{
	// ** TO DO pass source code to _z80_pass_one
/*
	int retval;

	Msg ("Pass One..");

	_pass_one_ProgramCounter = ORG_UNDEFINED;
	_pass_one_error_level = 0;
	_ProgramOrg = ORG_UNDEFINED;

	retval = _z80_pass_one (&_z80_file_list);
	if (retval == RETCODE_ERROR)
	{
		Msg ("Pass one failed. ");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}
*/
	return RETCODE_OK;
}

function _z80_DoPassTwo(output_filename)
{
		// do pass two.

		// *** TO DO ***
/*
	int retval;

	Msg ("Pass Two..");

		// fill in address constants.

	retval = LabelConstant_InsertConstantValues();
	if (retval == RETCODE_ERROR)
	{
		Msg ("compilation stopped.");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}

	// finish generating code (fill in labels)
	// and create .sna file.

	if (_ProgramOrg == ORG_UNDEFINED)
	{
		// this should never happen..
		Msg ("No code org - .sna file not generated");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}

		// output file depending on output mode selected

	switch (_z80_output_mode)
	{
		case OUTPUT_MODE_128K:
			Msg ("Not currently supported");
			return RETCODE_ERROR;
		case OUTPUT_MODE_Z80:
			Msg ("Creating .z80 file");
			_z80_SetRamBanks();
			retval = Z80_SaveImage ("out.z80", &_RamBank[0], _ProgramOrg);
			break;
		case OUTPUT_MODE_Z80_128K:
			Msg ("Creating 128K .z80 file");
			_z80_SetRamBanks();
			retval = Z80_Save128KImage ("out128.z80", &_RamBank[0], _ProgramOrg);
			break;
		case OUTPUT_MODE_48K:
		default:
		Msg ("Creating .sna file");
		retval = SNA_SaveImage (output_filename, &_CodeBuffer[16384], _ProgramOrg);
	}

	if (retval == RETCODE_ERROR)
	{
		Msg ("ERROR : Failed to generate file.");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}

	_z80_ShowCodeSize();

	if (_z80_sym_filename != NULL)
	{
		Msg ("Generating symbol file");
		Label_OutputLabelList (_z80_sym_filename);
	}

	// destroy z80_file_list + free resources.
*/
	Z80_Cleanup();
	return RETCODE_OK;
}


	// ---------------------------------------------
	//		Public Routines.
	// ---------------------------------------------


function Z80_Inits()
{
	_CodeArrayBuffer = new ArrayBuffer (65536);
	_CodeBuffer = new Uint8Array (_CodeArrayBuffer);
	
//	console.log ("_CodeBuffer");
//	console.log (_CodeBuffer);

	Label_InitLabelList();
	LabelConstant_Init();

	_pass_one_ProgramCounter = ORG_UNDEFINED;

	
/*
	int retval;

	retval = InitList (&_z80_file_list, sizeof (Z80_SOURCE_FILE), 16);
	if (retval == RETCODE_ERROR)
	{
		Debug (DEBUG_FATAL_ERROR, "z80.c : z80_Inits() : ** ERROR ** unable to init file list");
		Msg ("Internal Error : Unable to initialise internal source file list");
		return RETCODE_ERROR;
	}

	retval = Label_InitLabelList();
	if (retval == RETCODE_ERROR)
	{
		_z80_destroy_file_list (&_z80_file_list);
		Debug (DEBUG_FATAL_ERROR, "z80.c : Z80_Inits(): ** ERROR ** unable to initialise label list");
		Msg ("Internal Error : Unable to initialise label list");
		return RETCODE_ERROR;
	}

	retval = LabelConstant_Init();
	if (retval == RETCODE_ERROR)
	{
		_z80_destroy_file_list (&_z80_file_list);
		Debug (DEBUG_FATAL_ERROR, "z80.c : Z80_Inits(): ** ERROR ** unable to initialise constant table");
		Msg ("Internal Error : Unable to initialise constant table");
		return RETCODE_ERROR;
	}
*/
	return RETCODE_OK;
}


function Z80_Cleanup()
{
	// TO DO 
/*	_z80_destroy_file_list (&_z80_file_list);
	Label_DestroyLabelList();
	LabelConstant_Cleanup();
*/
}

/* -----------------------------------------------------------

	Name	:	Z80

	Syntax	:	int Z80 (char* makefile, char* output_filename);

	Parameters:

		makefile
			Filename of the make file.
			For this vesion of the assembler,
			the makefile is just a list of files
			to compile.

		output_filename
			Name of the file to output to

	Returns:
		returns RETCODE_OK if compilation was successful,
		otherwise returns RETCODE_ERROR

	 Notes:
	--------

----------------------------------------------------------------- */

function Z80 (makefile, output_filename)
{
	// Main control routine for compilation. Processes
	// the make file, overseas the compilation stages.
	// symbol table generation and code generation.
/*
	FILE* fp;
	int retval;

	retval = Z80_Inits();
	if (retval == RETCODE_ERROR)
	{
		Debug (DEBUG_FATAL_ERROR, "z80.c : z80(): ** Program initialisation failed");
		Msg ("Initialisation failed.");
		return RETCODE_ERROR;
	}

		// test to see if makefile exists.

	fp = FileOpen (makefile, "rb");
	if (fp  == NULL)
	{
		DebugString (DEBUG_TRACE, "z80.c : z80() : ** ERROR ** Unable to open make file : ", makefile);
		Msg ("Error:Unable to open makefile");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}
	CloseFile (fp);

		// parse make file.

	retval = _z80_parse_makefile (&_z80_file_list, makefile);
	if (retval == RETCODE_ERROR)
	{
		Msg ("Error : Failed to read makefile");
		Debug (DEBUG_TRACE, "z80.c : z80() : ** ERROR ** unable to read make file");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}

		// now need to feed the file list through
		// the 2 pass compilation process.

		// ---- do pass one. ----

	Msg ("Pass One..");

	_pass_one_ProgramCounter = ORG_UNDEFINED;
	_pass_one_error_level = 0;
	_ProgramOrg = ORG_UNDEFINED;

	retval = _z80_pass_one (&_z80_file_list);
	if (retval == RETCODE_ERROR)
	{
		Msg ("Pass one failed. ");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}

		// fill in address constants.

	retval = LabelConstant_InsertConstantValues();
	if (retval == RETCODE_ERROR)
	{
		Msg ("compilation stopped.");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}

		// do pass two.

	retval = _z80_DoPassTwo (output_filename);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	Msg ("Pass Two..");

	// finish generating code (fill in labels)
	// and create .sna file.

	if (_ProgramOrg == ORG_UNDEFINED)
	{
		// this should never happen..
		Msg ("No code org - .sna file not generated");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}

	Msg ("Creating .sna file");
	retval = SNA_SaveImage (output_filename, &_CodeBuffer[16384], _ProgramOrg);
	if (retval == RETCODE_ERROR)
	{
		Msg ("ERROR : Failed to generate file.");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}
		
	_z80_ShowCodeSize();

	// destroy z80_file_list + free resources.

	if (_z80_sym_filename != NULL)
	{
		Msg ("Generating symbol file");
		Label_OutputLabelList (_z80_sym_filename);
	}

	Z80_Cleanup();
	return RETCODE_OK;
*/

}

/* -----------------------------------------------------------

	Name	:	Z80_SingleFile

	Syntax	:	int Z80_SingleFile (char* filename)

	Parameters:
		filename
			The name of the file to begin assembly
			with. 

	Returns:
		returns RETCODE_OK if compilation was successful,
		otherwise returns RETCODE_ERROR

	 Notes:
	--------
		Creates an internal one-item file list then
	processes the input the same way as the file list does.

----------------------------------------------------------------- */

/*
function Z80_SingleFile (filename, output_filename)
{
	int retval;
	FILE* fp;
	Z80_SOURCE_FILE source_file;
	int item_id;

	retval = Z80_Inits();
	if (retval == RETCODE_ERROR)
	{
		Debug (DEBUG_FATAL_ERROR, "z80.c : z80_SingleFile(): ** Program initialisation failed");
		Msg ("Initialisation failed.");
		return RETCODE_ERROR;
	}

		// test to see if file exists.

	fp = FileOpen (filename, "rb");
	if (fp  == NULL)
	{
		DebugString (DEBUG_TRACE, "z80.c : z80_SingleFile() : ** ERROR ** Unable to open file: ", filename);
		Msg ("Error:Unable to open makefile");
		Z80_Cleanup();
		return RETCODE_ERROR;
	}
	CloseFile (fp);

		// create file list with just one file in it.

	CreateString (&source_file.filename);
	SetString (&source_file.filename, filename);

	retval = AddItem (&_z80_file_list, &source_file, &item_id);
	if (retval == RETCODE_ERROR)
	{
		DestroyString (&source_file.filename);
		Debug (DEBUG_TRACE, "z80.c : parse_makefile(): unable to add item to list");
		Msg ("Internal error : unable to access source file list");
		return RETCODE_ERROR;
	}


		// do various assembler passes.

	retval = _z80_DoPassOne();
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	retval = _z80_DoPassTwo (output_filename);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	return RETCODE_OK;
}
*/

function Z80_SetOutputMode (output_mode)
{
	_z80_output_mode = output_mode;
}

function z80_SetSymFilename (filename)
{
	// if this routine is NOT called, no symbol
	// information is generated.

	_z80_sym_filename = filename;
}



	// -----------------------------------------------------
	//		javascript routines not in C version
	// -----------------------------------------------------
	
//function Z80_Start()
//{
//	Z80_Inits();
//}

function Z80_Asm (source_text)
{
	// returns true if successfully assembled,
	// returns false otherwise, with error messgage in msg 
	// structure.
	
	var r;
	
	Z80_Inits();

	r = Z80_PassOne (source_text);
//	console.log ("R:" + r);
	if (r == RETCODE_OK)
	{
		Z80_PassTwo();
	}
}
