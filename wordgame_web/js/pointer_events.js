/*
	Title	:	Code for handling canvas pointer/mouse events

	Info	:	Version 0.0

	Author	:	Nick Fleming

	Updated	:	2nd July 2023


	 Notes:
	-----------
	Routines for processing canvas pointer events. Handles all the 
	retrieving and scaling of pointer events so that code can have a 
	1:1 mouse coordinate with the canvas size and position.

	InitPointerEvents sets up the events for a canvas. Done this way
	so you can have multiple canvases with their own callback routines
	if required.

	 Callbacks
	-----------
	Callbacks should take 3 parameters e.g:

		MyMouseDown (mouse_x, mouse_y, e)
	
	where mouse_x and mouse_y are the coordinates within the canvas,
	properly scaled to the physical canvas.

	e = the event object (for advanced stuff)

	 2nd July 2023
	-----------------
	Code added to store last known mouse button press and coordinates 
	in _MouseX , _MouseY, _Mouse_LBN for use by routines that are 
	outside the callback routine.

*/


var _EventList = [];

var _MouseX = null;
var _MouseY = null;
var _Mouse_LBN = false;


function STRUCT_EVENT (cvs_id, down_callback, move_callback, up_callback, capture_flag)
{
	this.cvs_id = cvs_id;
	this.pd = down_callback;
	this.pm = move_callback;
	this.pu = up_callback;
	this.pc = capture_flag;
}

function _getEventListIndex (cvs_id)
{
	var idx;
	
	for (idx = 0; idx < _EventList.length; idx++)
	{
		if (_EventList[idx].cvs_id == cvs_id)
		{
			return idx;
		}
	}
	return null;		// idx not found
}

function _PointerDown(e)
{
	var rect;
	var cvs;
	var rw;
	var rh;
	var mx;
	var my;
	
	var i;

	cvs = e.currentTarget;	//document.getElementById (CvsID);

	rect = cvs.getBoundingClientRect();

	mx = e.clientX - rect.left;
	my = e.clientY - rect.top;

	rw = rect.right - rect.left;
	rh = rect.bottom - rect.top;
	mx = Math.floor (mx * cvs.width / rw);	// scale mx to the physical canvas width.
	my = Math.floor (my * cvs.height / rh);

	_MouseX = mx;
	_MouseY = my;
	_Mouse_LBN = true;

	i = _getEventListIndex (cvs.id);
	if (i == null)
	{
		console.log ("not found");
		return;
	}

	if ( _EventList[i].pc ==  true)
	{
		e.currentTarget.setPointerCapture (e.pointerId);
	}
	
	_EventList[i].pd (mx, my, e);
}

function _PointerMove(e)
{
	var rect;
	var cvs;
	var ctx;
	var rw;
	var rh;
	var mx;
	var my;
	
	cvs = e.currentTarget;	//document.getElementById (CvsID);

	rect = cvs.getBoundingClientRect();

	mx = e.clientX - rect.left;
	my = e.clientY - rect.top;

	rw = rect.right - rect.left;
	rh = rect.bottom - rect.top;
	mx = Math.floor (mx * cvs.width / rw);	// scale mx to the physical canvas width.
	my = Math.floor (my * cvs.height / rh);

	_MouseX = mx;
	_MouseY = my;

	if (e.buttons > 0)
	{
		_Mouse_LBN = true;
	}

	i = _getEventListIndex (cvs.id);
	if (i == null)
	{
		console.log ("not found");
		return;
	}

	_EventList[i].pm (mx, my, e);
}

function _PointerUp(e)
{
	var rect;
	var cvs;
	var rw;
	var rh;
	var mx;
	var my;

	cvs = e.currentTarget;	//document.getElementById (CvsID);

	rect = cvs.getBoundingClientRect();

	mx = e.clientX - rect.left;
	my = e.clientY - rect.top;

	rw = rect.right - rect.left;
	rh = rect.bottom - rect.top;
	mx = Math.floor (mx * cvs.width / rw);	// scale mx to the physical canvas width.
	my = Math.floor (my * cvs.height / rh);

	i = _getEventListIndex (cvs.id);
	if (i == null)
	{
		console.log ("not found");
		return;
	}

	if ( _EventList[i].pc ==  true)
	{
		e.currentTarget.releasePointerCapture (e.pointerId);
	}

	_EventList[i].pu (mx, my, e);

	_Mouse_LBN = false;
}

function _PointerCancel(e)
{
	_Mouse_LBN = false;

	e.preventDefault();
	
	return false;
}

function InitPointerEvents(cvs_id, down_callback, move_callback, up_callback, enable_capture)
{
	// enable capture true = pointer will be captured on mouse down.

	// use pointer events if available.
	// use touch events if available
	// use mouse events if available.
	// use telepathy if available.

	var cvs;
	var check;
	var i;

	if (!window.PointerEvent)
	{
		console.log ("Pointer events not available");
		return;
	}

	cvs = document.getElementById (cvs_id);
	if (cvs == null)
	{
		console.log ("InitPointerEvents: cvs_id " + cvs_id + " not found");
		return;
	}

	cvs.addEventListener("pointerdown", _PointerDown, false);
	cvs.addEventListener("pointermove", _PointerMove, false);
	cvs.addEventListener("pointerup", _PointerUp, false);
	cvs.addEventListener("pointercancel", _PointerCancel, false);

	i = _EventList.length;
	_EventList[i] = new STRUCT_EVENT (
						cvs_id,
						 down_callback,
						 move_callback,
						 up_callback,
						 enable_capture);
}
