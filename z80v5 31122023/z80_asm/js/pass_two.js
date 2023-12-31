/*

	Title	:	Z80 Assembler, 'pass two'

	Info	:	Version 0.0	11th September 2023

	Author	:	Nick Fleming

	Updated	:	11th September 2023

	 Notes:
	---------

	Not really a second pass over the source, as all of the information
	required to complete the pass is stored in the constant label
	list.

	All thats really required here is to insert values into the
	source code, depending on the number of bytes required.



*/


function Z80_PassTwo()
{
	var retval;

	console.log ("Pass two..");
	retval = LabelConstant_InsertConstantValues();	// in const.js file
}

/*
int _z80_DoPassTwo(char* output_filename)
{
		// do pass two.

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

	Z80_Cleanup();
	return RETCODE_OK;
}
*/
