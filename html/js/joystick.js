/* ----- 
//
//	Title	:	Joystick handling code.
//
//	Info	:	Version 2.0	20th March 2020
//
//	Author	:	Nick Fleming.
//
//	Updated	:	26th March 2020
//
//
// some code to handle joysticks.
// How To Use:

// 1) call Joystick_ListenForConnect to register an interest if the user presses a button
// .. until the user presses something.. joysticks are hidden from the browser.

// when the first joystick event is found.. then Joystick_OnConnect is called. 


// https://www.html5rocks.com/en/tutorials/doodles/gamepad/


//	 26th March 2020
//	------------------
//	Adding some code to handle 'dead' zone



	 Joystick Info:
	----------------
	*I should note that these values were taken from firefox 66.0.3 
	under linux. different systems may have different mappings.
	
	Good luck mapping anything.. !!

		Atari  :
	================
	buttons :
		 0 = fire
		 3 = 'x'
		10 = select
		11 = start
	axes:
		up 	: 1 = -1
		down: 1 =  1
		left: 0 = -1
		right:0 = 1

		Trust:17416
	===================
	buttons:
		0 = Y
		1 = B
		2 = A
		3 = X

		4 = L1
		5 = R1
		6 = L2
		7 = R2
	
		8 = start/select ?
		9 = start/select ?
		
		10 = push left stick down
		11 = push right stick down
	
	axes:
		normal mode:
			dpad left 	0 = -1
			dpad right	0 =  1
			dpad up		1 = -1
			dpad down	1 =  1

		analogue mode
			dpad left 	5 = -1
			dpad right	5 =  1
			dpad up		6 = -1
			dpad down	6 =  1
		
			left stick:
				left  : 0 = -ve		2 = -ve
				right : 0 = +ve		2 = +ve
				up    : 1 = -ve
				down  : 1 = +ve

			right stick:
				left  : 3 = -ve
				right : 3 = +ve
				up    : 4 = -ve		2 = -ve
				down  : 4 = +ve		2 = +ve


	  Logitech F310
	 ====================

	buttons: (standard mapping for ABXY)
		0 = A		- 
		1 = B		- only b in same position as trust controller.
		2 = X
		3 = Y

		4 = L1			( standard mapping for L1 and R1)
		5 = R1
		6 = back		( not L2 		- not a button - n)
		7 = start		(not R2		- not a button)
	
		8 = logitech logo button
		
		9 = push left stick down
		10 = push right stick down
	
	axes:
		normal mode:
			dpad left 	6 = -1
			dpad right	6 =  1
			dpad up		7 = -1
			dpad down	7 =  1

		analogue mode
			dpad left 	0 = -1
			dpad right	0 =  1
			dpad up		1 = -1
			dpad down	1 =  1
		
			left stick:
				left  : 0 = -ve		2 = -ve
				right : 0 = +ve		2 = +ve
				up    : 1 = -ve
				down  : 1 = +ve

			right stick:
				left  : 3 = -ve
				right : 3 = +ve
				up    : 4 = -ve		2 = -ve
				down  : 4 = +ve		2 = +ve


	 USB Gamepad : 0810
	---------------------
		(generic, nintendo style, no manufacturer details)
	Note: would only respond after plugging in once browser running.
	buttons:
		X = 0		(totally non-standard!!)
		A = 1
		B = 2
		y = 3
	
		L = 4
		R = 5

		8 = select
		9 = start
		
		6 & 7 not used. 

	dpad:
		left : 0 = -ve
		right: 0 = +ve
		up   : 1 = -ve
		down : 1 = +ve


	 USB Gamepad : 0458 (padix Co. ltd)
	====================================
	"mini pad"

	buttons:
		mapping to logitech layout shown

		1 = 0	-> A
		2 = 1	-> B
		3 = 2   -> X
		4 = 3	-> Y
		
		5 = 4	->select?
		6 = 5   ->start ?

	dpad:
		left : 0 = -ve
		right: 0 = +ve
		up   : 1 = -ve
		down : 1 = +ve

// *************************************************
// GOING TO ADD MAPPINGS FOR MY JOYSTICKS TO MATCH
// THE STANDARD GAMEPAD WHERE POSSIBLE
// *************************************************

https://w3c.github.io/gamepad/#remapping


Button/Axis 	Location
buttons[0]   Bottom button in right cluster
buttons[1]   Right button in right cluster
buttons[2]   Left button in right cluster
buttons[3]   Top button in right cluster

buttons[4]   Top left front button
buttons[5]   Top right front button
buttons[6]   Bottom left front button
buttons[7]   Bottom right front button

buttons[8]   Left button in center cluster
buttons[9]   Right button in center cluster

buttons[10]  Left stick pressed button
buttons[11]  Right stick pressed button

buttons[12]  Top button in left cluster
buttons[13]  Bottom button in left cluster
buttons[14]  Left button in left cluster
buttons[15]  Right button in left cluster

axes[0]      Horizontal axis for left stick (negative left/positive right)
axes[1]      Vertical axis for left stick (negative up/positive down)

axes[2]      Horizontal axis for right stick (negative left/positive right)
axes[3]      Vertical axis for right stick (negative up/positive down) 

 
	Ok.. so.. Left button cluster is a problem.. as
	they ALL appear to map to the axes when a stick is not available.

*/

	// joystick identifiers 

var JOYSTICK_ID_UNKNOWN       = -1;
var JOYSTICK_ID_STANDARD      = 0;		// none of my joysticks match this!!
var JOYSTICK_ID_LOGITECH_F310 = 1;
var JOYSTICK_ID_DRAGONRISE    = 2;
var JOYSTICK_ID_ATARI         = 3;		// SHANWAN Android Gamepade (atari style :-))
var JOYSTICK_ID_NINTY         = 4;		// ye ole snes style. - no manufacturer info
var JOYSTICK_ID_MINIPAD       = 5;		// Padix Co. Ltd

	// joystick standard button layout
var JOYSTICK_RBC_BOTTOM = 0;			// RBC = right button cluster
var JOYSTICK_RBC_RIGHT  = 1;
var JOYSTICK_RBC_LEFT   = 2;
var JOYSTICK_RBC_TOP    = 3;

var JOYSTICK_FB_TOP_LEFT  = 4;
var JOYSTICK_FB_TOP_RIGHT = 5;
var JOYSTICK_FB_BOTTOM_LEFT = 6;
var JOYSTICK_FV_BOTTOM_RIGHT= 7;

var JOYSTICK_CB_LEFT  = 8;
var JOYSTICK_CB_RIGHT = 9;

var JOYSTICK_LEFT_STICK_BUTTON  = 10;
var JOYSTICK_RIGHT_STICK_BUTTON = 11;

var JOYSTICK_LBC_TOP    = 12;		// LBC = left button cluster
var JOYSTICK_LBC_BOTTOM = 13;
var JOYSTICK_LBC_LEFT   = 14;
var JOYSTICK_LBC_RIGHT  = 15;


var joystick_map_standard =
[
	0,	// JOYSTICK_RBC_BOTTOM = 0;			// RBC = right button cluster
	1,	// JOYSTICK_RBC_RIGHT  = 1;
	2,	// JOYSTICK_RBC_LEFT   = 2;
	3,	// JOYSTICK_RBC_TOP    = 3;

	4,	// JOYSTICK_FB_TOP_LEFT  = 4;
	5,	// JOYSTICK_FB_TOP_RIGHT = 5;
	6,	// JOYSTICK_FB_BOTTOM_LEFT = 6;
	7,	// JOYSTICK_FV_BOTTOM_RIGHT= 7;

	8,	// JOYSTICK_CB_LEFT  = 8;
	9,	// JOYSTICK_CB_RIGHT = 9;

	10,  // JOYSTICK_LEFT_STICK_BUTTON  = 10;
	11, // JOYSTICK_RIGHT_STICK_BUTTON = 11;

	12, // JOYSTICK_LBC_TOP    = 12;		// LBC = left button cluster
	13, // JOYSTICK_LBC_BOTTOM = 13;
	14, // JOYSTICK_LBC_LEFT   = 14;
	15, // JOYSTICK_LBC_RIGHT  = 15;
];

var joystick_map_LF310 =
[
	0,	// JOYSTICK_RBC_BOTTOM = 0;			// RBC = right button cluster
	1,	// JOYSTICK_RBC_RIGHT  = 1;
	2,	// JOYSTICK_RBC_LEFT   = 2;
	3,	// JOYSTICK_RBC_TOP    = 3;

	4,	// JOYSTICK_FB_TOP_LEFT  = 4;
	5,	// JOYSTICK_FB_TOP_RIGHT = 5;
	-1,	// JOYSTICK_FB_BOTTOM_LEFT = 6;
	-1,	// JOYSTICK_FV_BOTTOM_RIGHT= 7;

	6,	// JOYSTICK_CB_LEFT  = 8;
	7,	// JOYSTICK_CB_RIGHT = 9;

	9,  // JOYSTICK_LEFT_STICK_BUTTON  = 10;
	10, // JOYSTICK_RIGHT_STICK_BUTTON = 11;

	// JOYSTICK_LBC_TOP    = 12;		// LBC = left button cluster
	// JOYSTICK_LBC_BOTTOM = 13;
	// JOYSTICK_LBC_LEFT   = 14;
	// JOYSTICK_LBC_RIGHT  = 15;
];

var joystick_map_0079 = 	// trust / dragonrise
[
	2,	// JOYSTICK_RBC_BOTTOM = 0;			// RBC = right button cluster
	1,	// JOYSTICK_RBC_RIGHT  = 1;
	3,	// JOYSTICK_RBC_LEFT   = 2;
	0,	// JOYSTICK_RBC_TOP    = 3;

	4,	// JOYSTICK_FB_TOP_LEFT  = 4;
	5,	// JOYSTICK_FB_TOP_RIGHT = 5;
	6,	// JOYSTICK_FB_BOTTOM_LEFT = 6;
	7,	// JOYSTICK_FV_BOTTOM_RIGHT= 7;

	8,	// JOYSTICK_CB_LEFT  = 8;
	9,	// JOYSTICK_CB_RIGHT = 9;

	10,  // JOYSTICK_LEFT_STICK_BUTTON  = 10;
	11, // JOYSTICK_RIGHT_STICK_BUTTON = 11;

	// JOYSTICK_LBC_TOP    = 12;		// LBC = left button cluster
	// JOYSTICK_LBC_BOTTOM = 13;
	// JOYSTICK_LBC_LEFT   = 14;
	// JOYSTICK_LBC_RIGHT  = 15;
];

var joystick_map_0810 = 	// ninty / snes style button controller.
[
	2,	// JOYSTICK_RBC_BOTTOM = 0;			// RBC = right button cluster
	1,	// JOYSTICK_RBC_RIGHT  = 1;
	3,	// JOYSTICK_RBC_LEFT   = 2;
	0,	// JOYSTICK_RBC_TOP    = 3;

	4,	// JOYSTICK_FB_TOP_LEFT  = 4;
	5,	// JOYSTICK_FB_TOP_RIGHT = 5;
	-1,	// JOYSTICK_FB_BOTTOM_LEFT = 6;
	-1,	// JOYSTICK_FV_BOTTOM_RIGHT= 7;

	8,	// JOYSTICK_CB_LEFT  = 8;
	9,	// JOYSTICK_CB_RIGHT = 9;

	-1, // JOYSTICK_LEFT_STICK_BUTTON  = 10;
	-1, // JOYSTICK_RIGHT_STICK_BUTTON = 11;

	// JOYSTICK_LBC_TOP    = 12;		// LBC = left button cluster
	// JOYSTICK_LBC_BOTTOM = 13;
	// JOYSTICK_LBC_LEFT   = 14;
	// JOYSTICK_LBC_RIGHT  = 15;
];

var joystick_map_0458 = 	// minipad
[
	0,	// JOYSTICK_RBC_BOTTOM = 0;			// RBC = right button cluster
	1,	// JOYSTICK_RBC_RIGHT  = 1;
	2,	// JOYSTICK_RBC_LEFT   = 2;
	3,	// JOYSTICK_RBC_TOP    = 3;

	-1,	// JOYSTICK_FB_TOP_LEFT  = 4;
	-1,	// JOYSTICK_FB_TOP_RIGHT = 5;
	-1,	// JOYSTICK_FB_BOTTOM_LEFT = 6;
	-1,	// JOYSTICK_FV_BOTTOM_RIGHT= 7;

	4,	// JOYSTICK_CB_LEFT  = 8;
	5,	// JOYSTICK_CB_RIGHT = 9;

	-1, // JOYSTICK_LEFT_STICK_BUTTON  = 10;
	-1, // JOYSTICK_RIGHT_STICK_BUTTON = 11;

	// JOYSTICK_LBC_TOP    = 12;		// LBC = left button cluster
	// JOYSTICK_LBC_BOTTOM = 13;
	// JOYSTICK_LBC_LEFT   = 14;
	// JOYSTICK_LBC_RIGHT  = 15;
];

var joystick_map_2563 = 	// shanwan android gamepad (atari joystick)
[
	0,	// JOYSTICK_RBC_BOTTOM = 0;		fire button			// RBC = right button cluster
	-1,	// JOYSTICK_RBC_RIGHT  = 1;
	-1,	// JOYSTICK_RBC_LEFT   = 2;
	-1,	// JOYSTICK_RBC_TOP    = 3;

	-1,	// JOYSTICK_FB_TOP_LEFT  = 4;
	-1,	// JOYSTICK_FB_TOP_RIGHT = 5;
	-1,	// JOYSTICK_FB_BOTTOM_LEFT = 6;
	-1,	// JOYSTICK_FV_BOTTOM_RIGHT= 7;

	11,	// JOYSTICK_CB_LEFT  = 8;	// start 
	12,	// JOYSTICK_CB_RIGHT = 9;	// select

	-1, // JOYSTICK_LEFT_STICK_BUTTON  = 10;
	-1, // JOYSTICK_RIGHT_STICK_BUTTON = 11;

	// JOYSTICK_LBC_TOP    = 12;		// LBC = left button cluster
	// JOYSTICK_LBC_BOTTOM = 13;
	// JOYSTICK_LBC_LEFT   = 14;
	// JOYSTICK_LBC_RIGHT  = 15;
];

var joystick_maps =
[
	joystick_map_standard,
	joystick_map_LF310,
	joystick_map_0079,	 	// trust / dragonrise
	joystick_map_2563, 		// shanwan android gamepad (atari joystick)
	joystick_map_0810,		// ninty / snes style button controller.
	joystick_map_0458	 	// minipad
];

	// ---- end of button layout info

var JoystickConnected = false;		// false = no/unknown.
var Joystick_NumSticks = 0;
var Joystick_DeadZone = 0.1;

var Joystick = null;

function Joystick_GetMapIndex(jstk)
{
		// for now, just assume single joystick attached.
	var id_str;
	var id;

	id_str = jstk.id.substring (0,4);
	
	switch (id_str)
	{
		case "0079": id = JOYSTICK_ID_DRAGONRISE; break;
		case "046d": id = JOYSTICK_ID_LOGITECH_F310; break;
		case "2563": id = JOYSTICK_ID_ATARI; break;
		case "0458": id = JOYSTICK_ID_MINIPAD; break;
		case "0810": id = JOYSTICK_ID_NINTY; break;
		case "xinp":
					id = JOYSTICK_ID_UNKNOWN;
					if (jstk.mapping == "standard")
					{
						id = JOYSTICK_ID_STANDARD;
					}
					break;
		default:

			id = JOYSTICK_ID_UNKNOWN; break;
	}
	return id;
}


function Joystick_MapStandardToOEM (jstk, standard_button_id)
{
	var jid;

	// maps the requested standard button id to the specific joystick
	// id.
	
	jid = Joystick_GetIdNum(jstk);
	switch (jid)
	{
		case JOYSTICK_ID_LOGITECH_F310:
				
		case JOYSTICK_ID_STANDARD:
				return standard_button_id;

		case JOYSTICK_ID_UNKNOWN:
				return standard_button_id;
	}
}



function Joystick_Available()
{
	var r;
    r = "getGamepads" in navigator;
    if (r)
    {
		return true;
	}
	return false;
}

function Joystick_OnConnect (e)
{
  	console.log("Gamepad connected at index %d: id='%s'. %d buttons, %d axes.",
   	 e.gamepad.index, e.gamepad.id,
    	e.gamepad.buttons.length, e.gamepad.axes.length);
    	
    	JoystickConnected = true;

    	var gamepads = navigator.getGamepads();
    	
    	console.log ("gamepads:");
    	console.log (gamepads);
    	Joystick_NumSticks =gamepads.length;
    	
    	console.log ("num pads " + gamepads.length);
}

function Joystick_ListenForConnect()
{
		// This should be the first function called after Joystick_Available
		// if you want to handle joystick messages.

	window.addEventListener("gamepadconnected", Joystick_OnConnect);
}

var gggh = 0
function Joystick_Update()
{
	Joystick = navigator.getGamepads();
	if (Joystick == null)	return 0;
	if (Joystick.length < 1)	return 0;

	if (gggh == 0)
	{
		console.log ("jotstcjk~~~" + Joystick_GetIdNum (Joystick));

		console.log (Joystick);
		gggh = 1;
	}
}

function Joystick_ButtonCount(jidx)
{
	if (Joystick == null)	return 0;
	if (Joystick.length < 1)	return 0;
	if ((jidx < 0) || (Joystick.length <= jidx))	return 0;

	return Joystick[jidx].buttons.length;
}

function Joystick_AxisCount(jidx)
{
	if (Joystick == null)	return 0;
	if (Joystick.length < 1)	return 0;
	if ((jidx < 0) || (Joystick.length <= jidx))	return 0;

	return Joystick[jidx].axes.length;
}

function Joystick_GetButton (jidx, standard_button_idx)
{
		// standard_button_idx = standard button index.

	var id;
	var map;
	var button_id;

	if (Joystick == null)	return 0;
	if (Joystick.length < 1)	return 0;
	if ((jidx < 0) || (Joystick.length <= jidx))	return 0;

//	function Joystick_GetIdNum (jstk)

	id = Joystick_GetMapIndex (Joystick[jidx]);
	if (id == JOYSTICK_ID_UNKNOWN)
	{
		return Joystick[jidx].buttons[button_idx].pressed;
	}

	map = joystick_maps[id];
	button = map[
	button = Joystick[jidx]
}

function Joystick_GetAxis (jidx, axis_idx)
{
	if (Joystick == null)	return 0;
	if (Joystick.length < 1)	return 0;
	if ((jidx < 0) || (Joystick.length <= jidx))	return 0;

	if (Math.abs (Joystick[jidx].axes[axis_idx]) < Joystick_DeadZone)
	{
		return 0;
	}

	return Joystick[jidx].axes[axis_idx];
}

function Joystick_setDeadzone (deadzone)
{
	Joystick_DeadZone = deadzone;
}

