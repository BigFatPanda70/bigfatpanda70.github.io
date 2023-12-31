/* -------------------------------------------------------------------

	Title	:	Label Constant Routines.

	Info	:	Javascript version 0.0 8th September 2023

	Author	:	Nick Fleming.

	Updated	:	8th September 2023

	 Notes:
	--------

	Based on C version 1.0	3rd February 2002


	 Routines for creating a list of constants to be filled in 
with address label values once pass one of the compilation process 
has been completed.

	 14th March 2002
	-----------------
	Corrected output errors

	 25th September 2002
	---------------------
		- updated  header files to use clibs.h


	 1st September 2023
	---------------------
	added line number to _AddConstant routine for reporting 
	forward relative jumps out of range.

------------------------------------------------------------------- */

//#include "clibs.h"
//#include "debug.h"
//#include "globals.h"
//#include "stringz.h"

//#include "labels.h"

//#include "list.h"
//#include "msgs.h"

//#include "const.h"
//#include "z80.h"

var CONSTANT_TYPE_ADDRESS = 0;
var CONSTANT_TYPE_BRANCH = 1;

//#define INITIAL_NUMBER_OF_CONSTANTS	10

function LABEL_CONSTANT()
{
	this.code_address;
	this.label_name;
	this.type;
	this.line_number;
}

/*typedef struct
{
	int code_address;
	STRING label_name;
	int type;		// address or branch (8 bit output)
	
	int line_number;

} LABEL_CONSTANT;
*/

var _const_list = [];	// LINKED_LIST _const_list;

function LabelConstant_Init()
{
	_const_list = [];
//	int retval;
//	Debug (DEBUG_TRACE, "const.c: Init()");

//	retval = InitList (&_const_list, sizeof (LABEL_CONSTANT), INITIAL_NUMBER_OF_CONSTANTS);
//	return retval;

	return true;
}

function LabelConstant_Cleanup()
{
	_const_list = null;
/*	int item_id	;
	LABEL_CONSTANT* ptr;

	Debug (DEBUG_TRACE, "const.c: Cleanup()");

	item_id = GetHeadItemId (&_const_list);
	while (item_id != INVALID_ITEM_ID)
	{
		ptr = GetItem (&_const_list, item_id);
		if (ptr != NULL)
		{
			DestroyString (&ptr->label_name);
		}
		else
		{
			Msg ("Internal error : constant not found");
			Debug (ptr == NULL, "const.c: Cleanup(): ** ERROR ** constant not found");
		}
		item_id = GetNextItemId (&_const_list, item_id);
	}

	DestroyList (&_const_list);
*/
}

function LabelConstant_AddConstant (label_name, code_address, type, line_number)
{
//	console.log ("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ add constant:" + label_name + " addr:" + code_address);
	var idx;
	var new_const;
	
	idx = _const_list.length;
	_const_list[idx] = new LABEL_CONSTANT();

	new_const = _const_list[idx];

	new_const.label_name = label_name;
	new_const.code_address = code_address;
	new_const.type = type;
	new_const.line_number = line_number;
	
	return true;
/*
	int retval;
	LABEL_CONSTANT new_const;
	int item_id;

	new_const.code_address = code_address;
	new_const.type = type;
	CreateString (&new_const.label_name);
	CopyString (label_name, &new_const.label_name);

	new_const.line_number = line_number;

	retval = AddItem (&_const_list, &new_const, &item_id);

	return retval;	
*/
}

function LabelConstant_InsertConstantValues()
{
	// attempts to insert the constant values
	// into the code itself.

	// if a label is *not* found in the label list
	// then an error message is output and the label
	// is added to the list to prevent further
	// warnings being issued (?)

	var item_id;		//	int item_id;
	var ptr;			// LABEL_CONSTANT* ptr;
	var value;			// int value;
	var retval;			// int retval;
	var tmp;			// STRING tmp;

	var k;
	var branch_offset;

	var error_status;

	//Debug (DEBUG_TRACE, "const.c: InsertConstantValues()");
	
//	console.log ("const.js : insert const values");
//	console.log (_const_list);
	
	error_status = true;
	for (k = 0; k < _const_list.length; k++)
	{
		ptr = _const_list[k];
		
//		console.log ("ptr.label_name:" + ptr.label_name);
		retval = Label_LabelExists (ptr.label_name);
		if (retval == false)
		{
			console.log ("const.js TO DO : report const label error: unable to locate " + ptr.label_name);
			error_status = false;
		}
		else
		{
			value = Label_GetLabelValue(ptr.label_name);
			if (ptr.type == CONSTANT_TYPE_ADDRESS)
			{
				_CodeBuffer [ptr.code_address] = value & 255;
				_CodeBuffer [ptr.code_address+1] = (value >> 8)  & 255;
			}
			else
			{
				branch_offset = value - (ptr.code_address + 1);
				//	DebugNumber (DEBUG_TRACE, "const.c : branch offset = ", branch_offset);

				if ((branch_offset < -127) || (branch_offset > 127))
				{
					console.log ("TO DO: REPORT BRANCH OUT OF RANGE ERROR");
					error_status = false;
				}
				_CodeBuffer [ptr.code_address] = branch_offset & 255;
//					DebugNumber (DEBUG_TRACE, "const.c : value = ", branch_offset);
			}
		}
	}

	return error_status;
/*
//	error_status = RETCODE_OK;

//	item_id = GetHeadItemId (&_const_list);
//	while (item_id != INVALID_ITEM_ID)
//	{
//		ptr = GetItem (&_const_list, item_id);
//		if (ptr != NULL)
//		{
			retval = Label_LabelExists (&ptr->label_name);
			if (retval == RETCODE_FALSE)
			{
				CreateString (&tmp);
				SetString (&tmp, "*ERROR* Label ");
				ConcatString (&tmp, &ptr->label_name);
				ConcatRawString (&tmp, " undefined.");
				Msg (GetStringPtr (&tmp));
				DestroyString (&tmp);
				error_status = RETCODE_ERROR;
			}
			else
			{
				value = Label_GetLabelValue (&ptr->label_name);

	DebugString (DEBUG_TRACE, "const.c : label name=", GetStringPtr (&ptr->label_name));
	DebugNumber (DEBUG_TRACE, "const.c : code address = ", ptr->code_address);
	DebugNumber (DEBUG_TRACE, "const.c : value = ", value);
	DebugNumber (DEBUG_TRACE, "const.c : type = ", ptr->type);
	Debug (DEBUG_TRACE, " ");

				if (ptr->type == CONSTANT_TYPE_ADDRESS)
				{
					_CodeBuffer [ptr->code_address] = value & 255;
					_CodeBuffer [ptr->code_address+1] = (value >> 8)  & 255;
				}
				else
				{
					// branch constant.
					
					branch_offset = value - (ptr->code_address + 1);
					DebugNumber (DEBUG_TRACE, "const.c : branch offset = ", branch_offset);

					if ((branch_offset < -127) || (branch_offset > 127))
					{
						printf ("branch offset out of range %d %s \n", ptr->line_number, GetStringPtr (&ptr->label_name));
					}


					_CodeBuffer [ptr->code_address] = branch_offset & 255;
					DebugNumber (DEBUG_TRACE, "const.c : value = ", branch_offset);
				}
			}
		}
		else
		{
			Msg ("Internal error : constant not found");
			Debug (ptr == NULL, "const.c: InsertConstantValues(): ** ERROR ** constant not found");
		}
		item_id = GetNextItemId (&_const_list, item_id);
	}
	return error_status;
*/

}
