/*
 
	Title	:	Touch Screen Input

	Info	:	Version 0.0	3rd April 2020

	Author	:	Nick Fleming

	Updated	:	3rd April 2020


	 Notes:
 -------------
	Some simple wrapper code for touch screen usage.

	Note : for now, just doing single touch events, but multi touch
	events are on the to do list 

	 To Use:
	----------


	Call TouchScreenAvailable() for an intial check.
	Call TouchScreen_InitEvents(canvas_id) to set touch events for a canvas

	then examine TouchInfo structure whenever you require touch info.
 */
 
 var TOUCHSCREEN_FLAG_TOUCHDOWN = 1;
 var TOUCHSCREEN_FLAG_TOUCHMOVE = 2;
 var TOUCHSCREEN_FLAG_TOUCHUP = 4;

function TouchScreenStruct()
{
	 this.x = [];			// arrays for touch events.
	 this.y = [];
	 this.flags = [];
	 this.canvas_id = "";
	 this.available = false;
}

var TouchInfo = new TouchScreenStruct();

function TouchScreen_TouchStart()
{
		// touch screen touchstart event handler.

	var e;
	var rect;
	var tx;
	var ty;

	e = event;
	e.preventDefault();

	canvas = document.getElementById (TouchInfo.canvas_id);
	rect = canvas.getBoundingClientRect();
	tx = e.changedTouches[0].pageX - rect.left;
	ty = e.changedTouches[0].pageY - rect.top;
	
	tx = Math.floor(tx);
	ty = Math.floor(ty);
	if (tx < 0)
	{
		tx = 0;
	}
	if (ty < 0)
	{
		ty = 0;
	}
	if (tx >= canvas.width)
	{
		tx = canvas.width-1;
	}
	if (ty >= canvas.height)
	{
		ty = canvas.height-1;
	}

	TouchInfo.x[0] = tx;
	TouchInfo.y[0] = ty;
	TouchInfo.flags[0] = TOUCHSCREEN_FLAG_TOUCHDOWN;
	
	console.log ("touch down");
}

function TouchScreen_TouchMove()
{
		// touch screen move event handler

	var e;
		
	var tx;
	var ty;
	var rect;
	var canvas;

	e = event;
	e.preventDefault();

	canvas = document.getElementById (TouchInfo.canvas_id);
	rect = canvas.getBoundingClientRect();
	tx = e.changedTouches[0].pageX - rect.left;
	ty = e.changedTouches[0].pageY - rect.top;

	tx = Math.floor(tx);
	ty = Math.floor(ty);
	if (tx < 0)
	{
		tx = 0;
	}
	if (ty < 0)
	{
		ty = 0;
	}
	if (tx >= canvas.width)
	{
		tx = canvas.width-1;
	}
	if (ty >= canvas.height)
	{
		ty = canvas.height-1;
	}

//	alert ("x:" + tx + " y:" + ty);

	TouchInfo.x[0] = tx;
	TouchInfo.y[0] = ty;
	TouchInfo.flags[0] = TOUCHSCREEN_FLAG_TOUCHMOVE;

//	e.preventDefault();
	console.log ("touch move");
}

function TouchScreen_TouchEnd()
{

	var e;

	var tx;
	var ty;
	var rect;
	var canvas;

	e = event;
	e.preventDefault();

	canvas = document.getElementById (TouchInfo.canvas_id);
	rect = canvas.getBoundingClientRect();
	tx = e.changedTouches[0].pageX - rect.left;
	ty = e.changedTouches[0].pageY - rect.top;

//	alert ("x:" + tx + " y:" + ty);

	TouchInfo.x[0] = tx;
	TouchInfo.y[0] = ty;
	TouchInfo.flags[0] = TOUCHSCREEN_FLAG_TOUCHUP;

//	e.preventDefault();

	console.log ("touch end");

}


	// -----------------------------------
	//		---- Public Routines ----
	// -----------------------------------


function TouchScreenAvailable()
{
	// returns true if available, false otherwise
	
	supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

	TouchInfo.available = false;
	TouchInfo.x[0] = -1;		// at least one touch info record to be available.
	TouchInfo.y[0] = -1;
	TouchInfo.flags[0] = 0;

	if (supportsTouch == true)
	{
		console.log ("touch screen is available");
		return true;
	}
	
	TouchInfo.available = true;

	console.log ("no touch screen available");
	
	return false;
}

function TouchScreen_InitEvents(canvas_id)
{
	var cc;
	
	if (TouchScreenAvailable() == false)
	{
		console.log ("touch screen not supported");
		return;
	}

	cc = document.getElementById (canvas_id);
	cc.addEventListener("touchstart", TouchScreen_TouchStart,false);
	cc.addEventListener("touchmove", TouchScreen_TouchMove,true);
	cc.addEventListener("touchend", TouchScreen_TouchEnd,false);
	
	TouchInfo.canvas_id = canvas_id;
}

function TouchScreen_ResetTouchInfo()
{
	var i;
	
	for (i = 0; i < TouchInfo.x.length; i++)
	{
		TouchInfo.x[i] = -1;
		TouchInfo.y[i] = -1;
		TouchInfo.flags[i] = 0;
	}
}
