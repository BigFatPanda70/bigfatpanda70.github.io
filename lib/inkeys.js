//
//		Experimental Keyboard Stuff.
//
//		Info	:	Version 0.0		6th July 2017
//
//		Author:	Nick Fleming
//
//		Updated:	30th April 2022
//
//		 Notes:
//		----------
//
//		Some simple keyboard functions + constants.
//
//
//	added key codes for , and .   (the buttons with < and > on )
//
//
//	5th November 2022
//	-- added _last_key_pressed for (poorly designed) games that
// require 'press any key'


var keys_KeyCodeArray = [];		// true = key down, false = key up


var _keys_last_key_pressed = null;
var _keys_last_key_code;
var _keys_last_key;


var KEY_LEFT	= 37;
var KEY_UP		= 38;
var KEY_RIGHT	= 39;
var KEY_DOWN	= 40;

var KEY_ENTER		= 13;
var KEY_BACKSPACE	= 8;
var KEY_SPACE		= 32;

var KEY_ESC = 27;

var KEY_0 = 48;
var KEY_1 = 49;
var KEY_2 = 50;
var KEY_3 = 51;
var KEY_4 = 52;
var KEY_5 = 53;
var KEY_6 = 54;
var KEY_7 = 55;
var KEY_8 = 56;
var KEY_9 = 57;

var KEY_A = 65;
var KEY_B = 66;
var KEY_C = 67;
var KEY_D = 68;
var KEY_E = 69;
var KEY_F = 70;
var KEY_G = 71;
var KEY_H = 72;
var KEY_I = 73;
var KEY_J = 74;
var KEY_K = 75;
var KEY_L = 76;
var KEY_M = 77;
var KEY_N = 78;
var KEY_O = 79;
var KEY_P = 80;
var KEY_Q = 81;
var KEY_R = 82;
var KEY_S = 83;
var KEY_T = 84;
var KEY_U = 85;
var KEY_V = 86;
var KEY_W = 87;
var KEY_X = 88;
var KEY_Y = 89;
var KEY_Z = 90;

var KEY_SHIFT = 16;			// left + right shift give same response
var KEY_CAPS = 20;
var KEY_TAB = 9;
var KEY_CTRL = 17;

var KEY_INS	= 45;
var KEY_DEL = 46;
var KEY_HOME = 36;
var KEY_END = 35;
var KEY_PAGEUP = 33;
var KEY_PAGEDOWN = 34;

var KEY_F1 = 112;
var KEY_F2 = 113;
var KEY_F3 = 114;
var KEY_F4 = 115;
var KEY_F5 = 116;
var KEY_F6 = 117;
var KEY_F7 = 118;				// used by firefox.
var KEY_F8 = 119;
var KEY_F9 = 120;
var KEY_F10 = 121;
var KEY_F11 = 122;
var KEY_F12 = 123;				// used by firefox.

var KEY_PAD0 = 96;
var KEY_PAD1 = 97;
var KEY_PAD2 = 98;
var KEY_PAD3 = 99;
var KEY_PAD4 = 100;
var KEY_PAD5 = 101;
var KEY_PAD6 = 102;
var KEY_PAD7 = 103;
var KEY_PAD8 = 104;
var KEY_PAD9 = 105;

var KEY_COMMA = 188;
var KEY_FULLSTOP = 190;


function keys_DoKeyDown (e)
{
	if ((e.keyCode == KEY_ESC) ||
		(e.keyCode == KEY_F5) ||
		(e.keyCode == KEY_F12))
	{
		return;
	}
	keys_KeyCodeArray[e.keyCode] = true;
	e.preventDefault(); 
	
	_keys_last_key_pressed = e.keyCode;
	_keys_last_key_code = e.keyCode;
	_keys_last_key = e.key.charAt(0);	// get char code.

//	alert (e.keyCode);
};

function keys_DoKeyUp (e)
{
	keys_KeyCodeArray[e.keyCode] = false;
		
	_keys_last_key_pressed = null;
	_keys_last_key_code = 0;
	_keys_last_key = 0;
}

function keys_ClearLastKey()
{
	_keys_last_key_pressed = null;
	_keys_last_key_code = 0;
	_keys_last_key = 0;
}

function KeyEventsInit()
{
	var lp;

	for (lp = 0; lp < 255; lp++)
	{
		keys_KeyCodeArray[lp] = false;
	}
	document.addEventListener ("keydown", keys_DoKeyDown, false);
	document.addEventListener ("keyup", keys_DoKeyUp, false);
	
	console.log ("inkeys.js : KeyEventsInit() - done.");
}

function KeyPressed (key_code)
{
	return keys_KeyCodeArray [key_code];
}

function KeyClear (key_code)
{
	keys_KeyCodeArray[key_code] = false;
}

function KeySet (key_code)
{
	keys_KeyCodeArray[key_code] = true;
}


KeyEventsInit();
