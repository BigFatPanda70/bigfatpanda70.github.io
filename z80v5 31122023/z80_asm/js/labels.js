/* ------------------------------------------------------------

	Title	:	Labels List.

	Info	:	Javascript version 0.0 8th September 2023

	Author	:	Nick Fleming.

	Updated	:	8th September 2023

	 Notes:
	--------

	Based on the c Version 1.0	28th December 2001

	Just a straight port of my c code to javascript.
------------------------------------------------------------ */

//#include <stdio.h>

//#include "clibs.h"

//#include "labels.h"
//#include "msgs.h"

var LABEL_STATUS_UNDEFINED	= 0;
var LABEL_STATUS_DEFINED	= 1;

var LABEL_TYPE_UNDEFINED = null;

//var INITIAL_NUMBER_OF_LABELS = 256;	// allow space for 256 labels.

function LABEL ()		// typedef struct
{						// {
	this.id = -1;						// 	int id;
	this.status = 0;					// 	int status;
	this.type = LABEL_TYPE_UNDEFINED;	// 	int type;	// user defined label type.
	this.name = "";						// 	STRING name;
	this.value = null;					// int value;
}						//} LABEL;

var _label_LabelList = [];		//LINKED_LIST _label_LabelList;

	// --------------------------------------------------------
	//			Private Routines.
	// --------------------------------------------------------

function _label_GetLabelIndex ( label_name)		//LABEL* _label_GetLabelPtr (STRING* label_name)
{												//{
	var item_id;								//int item_id;
	var retval;									//int retval;
	var ptr;									//LABEL* ptr;

	var k;

	for (k = 0; k < _label_LabelList.length; k++)
	{
		if (_label_LabelList[k].name == label_name)
		{
			return k;
		}
	}
	return null;

/*	item_id = GetHeadItemId (&_label_LabelList);
	while (item_id != INVALID_ITEM_ID)
	{
		ptr = GetItem (&_label_LabelList, item_id);
		if (ptr != NULL)
		{
			// check label name to see if it matches.
			retval = MatchString (label_name, &ptr->name);
			if (retval == RETCODE_TRUE)
			{
				return ptr;
			}
		}

		item_id = GetNextItemId (&_label_LabelList, item_id);
	}
	return NULL;
*/
}

	// --------------------------------------------------------
	//			Public Routines.
	// --------------------------------------------------------

function Label_InitLabelList()
{
	// returns true if successful.
	// otherwise returns false

	// different from the c code as my old routines required some
	// rather ropey code to handle lists. Javascript does it better
	// so im using that, rather than my very old code.

	var retval;
	var k;

	//Debug (DEBUG_TRACE, "labels.c: InitLabelList()");

	_label_LabelList = [];

/*	retval = InitList (&_label_LabelList, sizeof (LABEL), INITIAL_NUMBER_OF_LABELS);

	if (retval == RETCODE_ERROR)
	{
		Debug (DEBUG_FATAL_ERROR, "labels.c: InitLabelList(): ** ERROR ** unable to initialise label list");
		Msg ("Internal error : unable to initialise label list");
		return RETCODE_ERROR;
	}
*/

	return true;		// now never fails ??
}

function Label_DestroyLabelList()
{
	_label_LabelList = null;		// just nuke it.
/*
	int item_id;
	LABEL* ptr;

	Debug (DEBUG_TRACE, "labels.c: DestroyLabelList()");

	item_id = GetHeadItemId (&_label_LabelList);
	while (item_id != INVALID_ITEM_ID)
	{
		ptr = GetItem (&_label_LabelList, item_id);
		if (ptr != NULL)
		{
			DestroyString (&ptr->name);
		}
		else
		{
			Msg ("Internal error : label not found");
			Debug (ptr == NULL, "labels.c : DestroyLabelList(): ** ERROR ** label not found");
		}
		item_id = GetNextItemId (&_label_LabelList, item_id);
	}

	DestroyList (&_label_LabelList);
*/
}

function Label_LabelExists (label_name)
{
	// returns RETCODE_TRUE if the label exists,
	// otherwise returns RETCODE_FALSE

	var ptr;
	
	ptr = _label_GetLabelIndex (label_name);
	if (ptr != null)
	{
		return true;
	}
	return false;

/*
	LABEL* ptr;

	ptr = _label_GetLabelPtr (label_name);
	if (ptr == NULL)
	{
		return RETCODE_FALSE;
	}

	return RETCODE_TRUE;
*/
}

function Label_AddLabel (label_name)
{
	// change from c code:
	// returns true if successful,
	// false otherwise.

	
	var retval;
	var new_label;		//LABEL new_label;
	var item_id;

//	console.log ("==========================================Label_AddLabel");

	retval = Label_LabelExists (label_name);
	if (retval == true)
	{
		console.log ("Label :" + label_name + "already exists");
//		Debug (DEBUG_TRACE, "labels.c : Label_AddLabel(): Label already exists");
		return false;
	}
	
//	console.log ("adding new label");
//	console.log ("label_name:" + label_name);

	item_id = _label_LabelList.length;
	
//	console.log ("item_id:" + item_id);

	_label_LabelList[item_id] = new LABEL();

	_label_LabelList[item_id].id = 0;							//	new_label.id = 0;
	_label_LabelList[item_id].status = LABEL_STATUS_UNDEFINED;	// new_label.status = LABEL_STATUS_UNDEFINED;
	_label_LabelList[item_id].type = 0;							// new_label.type = 0;
	_label_LabelList[item_id].name = label_name;				//CreateString (&new_label.name); CopyString (label_name, &new_label.name);

//	retval = AddItem (&_label_LabelList, &new_label, &item_id);
//	if (retval == RETCODE_ERROR)
//	{
//		Debug (DEBUG_TRACE, "labels.c : Label_AddLabel(): Unable to add label to list");
//		return RETCODE_ERROR;
//	}

//	return RETCODE_OK;

	return true;
}

function Label_GetLabelValue (label_name)
{
	var ptr;//	LABEL* ptr;

	ptr = _label_GetLabelIndex (label_name);	//ptr = _label_GetLabelPtr (label_name);
	if (ptr == null)
	{
//		console.log ("label not found");
//		console.log (_label_LabelList);
//		Debug (DEBUG_TRACE, "label.c : GetLabelValue(): label not defined");
		return 0;
	}

	return _label_LabelList[ptr].value;	//	return ptr->value;
}

function Label_SetLabelValue (label_name, label_value)
{
	var ptr;		//LABEL* ptr;

//	console.log ("Label_SetLabelValue");
//	console.log ("label:" + label_name);
//	console.log ("value:" + label_value);

	ptr = _label_GetLabelIndex (label_name);
	if (ptr == null)
	{
//		Debug (DEBUG_TRACE, "label.c : GetLabelValue(): label not defined");
		return false;
	}

	_label_LabelList[ptr].value = label_value;	//ptr->value = label_value;
	_label_LabelList[ptr].status = LABEL_STATUS_DEFINED;	//ptr->status = LABEL_STATUS_DEFINED;

	return true;
}

function Label_GetLabelStatus (label_name)
{
	var ptr;		//LABEL* ptr;

	ptr = _label_GetLabelIndex (label_name);
	if (ptr == null)
	{
//		Debug (DEBUG_TRACE, "label.c : GetLabelStatus(): label not defined");
		return 0;
	}

	return _label_LabelList[ptr].status;	// return ptr->value;	// have I just found a bug :-O ??????
}

function Label_GetLabelType (label_name)
{
	var ptr;	//LABEL* ptr;

	ptr = _label_GetLabelIndex (label_name);
	if (ptr == null)
	{
//		Debug (DEBUG_TRACE, "label.c : GetLabelType(): label not defined");
		return 0;
	}

	return _label_LabelList[ptr].type;		//return ptr->type;
}	

function Label_SetLabelType (label_name, type)
{
//	LABEL* ptr;
	var ptr;

	ptr = _label_GetLabelIndex (label_name);
	if (ptr == null)
	{
		Debug (DEBUG_TRACE, "label.c : SetLabelType(): label not defined");
		return;
	}

	_label_LabelList[ptr].type = type;		//ptr->type = type;
}

function Label_OutputLabelList()
{
	console.log ("Label_OutputLabelList: TO DO ??");
}

/*
void Label_OutputLabelList (char* filename)
{
	FILE* fp;
	int item_id;
	int retval;
	LABEL* ptr;

	fp = FileOpen (filename, "wb");
	if (fp == NULL)
	{
		DebugString (DEBUG_TRACE, "label.c : _OutputLabelList(): ** ERROR ** Unable to create file ", filename);
		return;
	}

	item_id = GetHeadItemId (&_label_LabelList);
	while (item_id != INVALID_ITEM_ID)
	{
		ptr = GetItem (&_label_LabelList, item_id);
		if (ptr != NULL)
		{
			fprintf (fp, "%04x %s\n", ptr->value, GetStringPtr (&ptr->name));
		}
		item_id = GetNextItemId (&_label_LabelList, item_id);
	}
	CloseFile (fp);
}
*/

