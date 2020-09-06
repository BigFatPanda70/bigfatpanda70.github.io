// ----- 
// some code to handle joysticks.
// How To Use:

// 1) call Joystick_Connect to register an interest if the user presses a button
// .. until the user presses something.. joysticks are hidden from the browser.

// when the first joystick event is found.. then Joystick_OnConnect is called. 


// https://www.html5rocks.com/en/tutorials/doodles/gamepad/

var JoystickConnected = false;		// false = no/unknown.
var Joystick_NumSticks = 0;

function Joystick_Available()
{
    return "getGamepads" in navigator;
}

function Joystick_OnConnect (e)
{
  	console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
   	 e.gamepad.index, e.gamepad.id,
    	e.gamepad.buttons.length, e.gamepad.axes.length);
    	
    	JoystickConnected = true;

    	var gamepads = navigator.getGamepads();
    	Joystick_NumSticks =gamepads.length;
    	
    	console.log ("num pads " + gamepads.length);
}

function Joystick_ListenForConnect()
{
		// This should be the first function called after Joystick_Available
		// if you want to handle joystick messages.

	window.addEventListener("gamepadconnected", Joystick_OnConnect);
}

function Joystick_Update()
{
	 Joystick = navigator.getGamepads();
}

function Joystick_GetButton (jidx, button_idx)
{
	if (Joystick == null)	return 0;
	if (Joystick.length < 1)	return 0;
	if ((jidx < 0) || (Joystick.length < jidx))	return 0;

	return Joystick[jidx].buttons[button_idx].pressed;
}

function Joystick_GetAxis (jidx, axis_idx)
{
	if (Joystick == null)	return 0;
	if (Joystick.length < 1)	return 0;
	if ((jidx < 0) || (Joystick.length < jidx))	return 0;

	return Joystick[jidx].axes[axis_idx];
}
