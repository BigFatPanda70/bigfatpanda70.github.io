//
//		Title	:	Canvas drag 'n' drop library
//
//		Info	:	Version 1.1	30th September 2017
//
//		Author:	Nick Fleming.
//
//		Updated:	30th September 2017
//

/*
			Notes:
		-----------
			Provides a simple drag and drop interface for moving things around a canvas
		.. handles all the keyboard/mouse/touchscreen events.
		
		.. trying to get multiple touch presses worked into this code from the start,
		.. so for each press, a call to your code is activated.


		This version (1.1) has a simplified callback mechanism.. you need to provide
		function names for 3 events types .. up, down and move.		

		each callback should allow 2 parameters for the mouse/touch coordinates e.g.

				function MyEventCallBack (px, py)
		
						.. where .. and px, py are the pixel coordinates of the point on the canvas.
*/

var DD_Canvas = null;
var DD_EventFuncUp	= null;
var DD_EventFuncMove = null;
var DD_EventFuncDown = null;

//var DD_CALLBACK_DOWN	= 0;
//var DD_CALLBACK_MOVE	= 1;
//var DD_CALLBACK_UP	= 2;

						// ========================
						// ==== MOUSE ROUTINES ====
						// ========================

function dnd_MouseDown (e)
{
//	var e;
	var rect;

	var mx;
	var my;
	
//	e = event;
	if (e == null)	return;
	if (e.which != 1)	return;	// 1 = left mouse button
	rect = DD_Canvas.getBoundingClientRect();

//	console.log ("rx : " + rect.left + " ry:"+rect.top);
//	console.log ("px : " + e.pageX + " py:"+ e.pageY);
//	console.log ("cx : " + e.clientX + " cy:"+ e.clientY);
//	mx = e.pageX - e.clientX;	//rect.left;
//	my = e.pageY - e.clientY;	//rect.top;
	mx = e.clientX - rect.left;
	my = e.clientY - rect.top;

//	console.log ("down:"+DD_EventFuncDown);

	DD_EventFuncDown(mx, my);
}

function dnd_MouseUp (e)
{
//	var e;
	var rect;

	var mx;
	var my;
	
//	e = event;
	if (e == null)	return;
	if (e.which != 1)	return;	// 1 = left mouse button
	rect = DD_Canvas.getBoundingClientRect();
	

//	mx = e.pageX - rect.left;
//	my = e.pageY - rect.top;

	mx = e.clientX - rect.left;
	my = e.clientY - rect.top;


//	console.log ("up:"+DD_EventFuncUp);

	DD_EventFuncUp (mx, my);
}

function dnd_MouseMove (e)
{
//	var e;
	var rect;

	var mx;
	var my;

//	e = event;
	if (e == null)	return;
	if (e.which != 1)	return;	// 1 = left mouse button
	rect = DD_Canvas.getBoundingClientRect();

//	mx = e.pageX - rect.left;
//	my = e.pageY - rect.top;

	mx = e.clientX - rect.left;
	my = e.clientY - rect.top;


//	console.log ("move:"+DD_EventFuncMove);
	DD_EventFuncMove (mx, my);
}

						// ========================
						// ==== TOUCH ROUTINES ====
						// ========================

function dnd_TouchStart()
{
	var e;
	var rect;

	var i;

	var tx;
	var ty;
	
	if (DD_Canvas == null)	return;

	e = event;
//	alert (e);
	rect = DD_Canvas.getBoundingClientRect();

	for (i = 0; i < e.targetTouches.length; i++)
	{
		tx = Math.floor (e.targetTouches[i].pageX) - rect.left;
		ty = Math.floor (e.targetTouches[i].pageY) - rect.top;

		// TO DO : CALLBACK HERE.	
		DD_EventFuncDown (tx, ty);
	}
	e.preventDefault();
}

function dnd_TouchMove()
{
		// *** UNDER CONSTRUCTION ****

	var e;
	var tx;
	var ty;

	e = event;
	
	if (e.targetTouches.length < 1)
	{
		return;		// should always be at least 1.
	}

	rect = DD_Canvas.getBoundingClientRect();

	tx = e.targetTouches[0].pageX;
	ty = e.targetTouches[0].pageY;

	//event.touches[0].clientX;
//	TouchX = e.touches[0].clientX;
//	TouchY = e.touches[0].clientY;

	tx = Math.floor (tx) - rect.left;
	ty = Math.floor (ty) - rect.top;

	DD_EventFuncMove (tx, ty);


	e.preventDefault();
}

function dnd_TouchEnd()
{
	var e;
	var rect;
	var tx;
	var ty;
	var i;

	if (DD_Canvas == null)	return;

	e = event;
	rect = DD_Canvas.getBoundingClientRect();

	for (i = 0; i < e.changedTouches.length; i++)
	{
		tx = Math.floor (e.changedTouches[i].pageX) - rect.left;
		ty = Math.floor (e.changedTouches[i].pageY) - rect.top;

		// DO CALLBACK HERE
		DD_EventFuncUp (tx, ty);
	}

	e.preventDefault();
}

function dnd_InitTouchEvents(canvas_id)
{
	var supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

	console.log ("touch events supported:" + supportsTouch);
	
	if (supportsTouch == true)
	{
			// only adding this for the apple safari browser.
			// note that safari should only get set for apple products
			
		canvas_id.addEventListener("touchstart",dnd_TouchStart,false);
		canvas_id.addEventListener("touchmove",dnd_TouchMove,true);
		canvas_id.addEventListener("touchend",dnd_TouchEnd,false);
	}
}

						// =========================
						// ==== PUBLIC ROUTINES ====
						// =========================

function DND_Init (canvas_id, event_func_up, event_func_move, event_func_down)
{
	var supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

	DD_Canvas = canvas_id;
	DD_EventFuncUp = event_func_up;
	DD_EventFuncMove = event_func_move;
	DD_EventFuncDown = event_func_down;

//	console.log (event_func_up);
//	console.log (DD_EventFuncUp);
//	console.log (DD_EventFuncMove);
//	console.log (DD_EventFuncDown);
	if (supportsTouch == true)	{ dnd_InitTouchEvents(DD_Canvas); }
	
	canvas_id.addEventListener("mousedown", dnd_MouseDown);
	canvas_id.addEventListener("mousemove", dnd_MouseMove);
	canvas_id.addEventListener("mouseup", dnd_MouseUp);

}
