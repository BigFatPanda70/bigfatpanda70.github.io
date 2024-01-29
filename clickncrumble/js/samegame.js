/*

	Title	:	Same Game

	Info	:	Version 0.7			29th January 2024

	Author	:	Nick Fleming

	Updated	:   29th January 2024

	 Notes:
	--------

	 11th June 2023
	---------------
	Restarting this project, sort of... trying to make
	more of the code platform independent where possible, so there
	should be no direct screen buffer manipulation by the routines
	in this file if at all possible.


	 14th June 2023
	-----------------
		Doing main title page stuff.

	 23rd June 2023
	-----------------
		I think I've got enough fx code ready to actually start doing
	the game proper this weekend  !!! (yeah well, that didn't happen!)

	 30th June 2023
	-----------------
		Need icons for :
			Settings
			Play
			Instructions

	 2nd July 2023
	----------------
		Deciding how to handle input.

	Need at least a 'mouse up' routine for checking button clicks.

	Also need some way to use a joystick / keyboard for other input.

	Moved Mouse Events over from .htm file.


	 4th November 2023
	-------------------
		Revisiting the code.. doing some level select stuff.

	 6th November 2023
	-------------------
		Code added to do stars, display numbers, and adding another
	transition.. one that rotates a shape and enlarges it to clear
	the screen.

	 8th November 2023
	-------------------
	Doing some extra graphics work to allow a bigger range of colours
	for the shapes.

	 10th November 2023
	---------------------
		Done with the basic ui, starting to get the game working now.
	I want transitions when a block is clicked on.. the block should
	either explode , or disintegrate into pixels which fade away.


	 4th January 2024
	-------------------
		Trying at least to get the game started.. all blocks are created
	as sprites and they are checked against each other for being able
	to move. Hopefully this means when you click and remove a block,
	they will automatically fall down into place.

	 5th January 2024
	-------------------
		Got main game working, which has given me some ideas of where
	to go next with this..

	1)	DONE- Don't press a button at the start, go straight into the loading animation

	2)	DONE - Display current level on the screen - must allow for up to 1001 levels

	3)	DONE - Provide restart icon in one corner.

	4)	- instead of restart, hamburger icon for options perhaps?

			options would be : quit, restart.
	
	5)	DONE - different levels to have different block graphics

	6)	background to change depending on level

	7)	reward sequence for each completed level. (show stars ???)

	8)	DONE - fix start polygon drawing



	 Block Graphics Sequence:
	==========================

	There are 7 colours available (grey is for game over) and there
	are 8 block designs,

	So here is the (possible ??) algorithm.

	first block y = level % 8

	first block x = 1 + ((level / 8) % 7)

	the next blocks are:
		( previous block y + 1 ) % 8
		1 + ( previous block x + 1 ) % 7

	 7th January 2024
	-------------------
		Added 'clear' message when a level is complete, to distinguish
	it from just a simple level reset. Seems to work well.
	

	 9th January 2024
	-------------------
		Looking at using localStorage object to keep track of all the
	level stars. localStorage has some hard limits on the amount of 
	data that can be stored, so using some sort of data compaction to
	reduce the storage footprint size.

		Each level can have 0,1,2 or 3 stars, which requires 2 bits of
	data for each level. 1001 levels = 2002 bits = ~250 bytes

	Want to store the data as a string though so perhaps use base 64
	encoding ??

		.. do I use localStorage or sessionStorage... ??? I think there
	are a *lot* of levels that may take days to clear.. so localStorage
	is probably the better option.
	
	 12th January 2024
	-------------------
		LocalStorage btoa experiment..failed.. so trying another 
	approach.

	 14th January 2024
	-------------------
		For privacy reasons, firefox deletes localStorage data every
	time the browser is closed, so may need another method of storing
	the level data somehow, perhaps even just saving a file and letting
	the player manually load it in.

		Need a few simple menu options to finish things off,
	such as quit game, restart level, possibly an instructions screen.

		There are 1000 levels, so need some way of accessing them all
	possibly in batches of 25 which would require 40 

	 15th January 2024
	--------------------
		Added level select arrows and updated drawing code to allow
	numbers up to 999 to be displayed.

	 16th January 2024
	-------------------
		Looking at doing a 'burger' style menu selection for the
	main game

	menu has the following options:

		.. restart level
		.. select another level ??
		.. quit to main screen.

	each menu item is displayed centered, with a colour background and
	a border.


	 27th January 2024
	-------------------

		Pop up menu.... need to store current game mode so can return
	to it when 'esc' pressed , or override it to go to main screen.

		Only really need two options for now:
	
			restart level
			
			quit game.


		.. maybe save / load progress at some point ??
	

	 29th January 2024
	--------------------
		Adding skip level option to popup menu.

			
*/

	// enum constants
var cc = 0;

var LOGO_ANIM_0 = cc++;
var LOGO_ANIM_1 = cc++;
var LOGO_ANIM_2 = cc++;

var BUTTON_ID_START = cc++;

var CvsData;

	// global constants
var SCR_WIDTH = 192;	// internal screen resolution size.
var SCR_HEIGHT= 192;
var GRID_WIDTH = 5;
var GRID_HEIGHT = 5;

var MAX_LEVELS = 1000;		// needs to be divisible by 4 for storage purposes.

var CLS_BLOCK_SIZE = Math.floor (SCR_WIDTH/16);

var LOCAL_STORAGE_NAME = "clickncrumble";

var LEVEL_SELECT_OFFSET = 4;

var MENU_MARGIN_VERTICAL = 8;
var MENU_MARGIN_HORIZONTAL = 10;

var TEXT_HEIGHT = 8;		// for menu text 

var IMG_BLOCKS = 0;
var IMG_LOGO = 1;
var IMG_CLOUDS = 2;
var IMG_COPYRIGHT = 3;
//var IMG_GREY_BLOCK = 3;
//var IMG_PENTAGON = 4;
//var IMG_TRIANGLE = 5;
//var IMG_BLUE_BLOCK = 6;
//var IMG_HEXAGON = 7;
//var IMG_CIRCLE = 8;
var IMG_START = 4;
var IMG_TWISTY_BORDER = 5;
var IMG_STAR = 6;
var IMG_DIGITS = 7;
var IMG_SMALL_DIGITS = 8;
var IMG_RESTART_IMAGE = 9;
var IMG_CLEAR = 10;
var IMG_LITTLE_FAT_STAR = 11;
var IMG_LEFT_ARROW = 12;
var IMG_RIGHT_ARROW = 13;
//var IMG_FONT_GFX = 14;
var IMG_BURGER = 14;


	// global vars.
var LOGO_TIMER_SIZE = 500;
var LogoAnim = LOGO_ANIM_0;
var LogoAnimTable = [LOGO_ANIM_0, LOGO_ANIM_1, LOGO_ANIM_2];
var LogoWobble = 0;
var LogoTimer = LOGO_TIMER_SIZE;

	// cursor & game grid edges.
var LeftX = 16;
var RightX = 176;
var TopY = 16;
var BottomY = 176;

var CursorOn = true;
var CursorX = LeftX;
var CursorY = TopY;
var CursorToX = LeftX + 32;
var CursorToY = TopY;

var CloudArray = [];
var MAX_CLOUDS = 8;
var MAX_CLOUD_WIDTH = 32;


var MAX_TWINKLES = 16;
var TwinkleBits = [];

var MENU_ITEM_RESTART = 1000;
var MENU_ITEM_CONTINUE = 1050;
var MENU_ITEM_SKIP = 1080;
var MENU_ITEM_QUIT = 1100;


		// main game grid, of size GRID_WIDTH*GRID_HEIGHT
var GameGrid = [
1,3,2,4,2,				// test data
4,4,4,2,2,
1,2,5,4,2,
1,3,4,4,2,
4,4,5,5,4
];

var _gm=0;
var GM_INIT 		= _gm++;
var GM_CLS 			= _gm++;
var GM_MAIN_MENU 	= _gm++;
var GM_INSTRUCTIONS = _gm++;
var GM_GAMEOVER 	= _gm++;
var GM_TRANSITION1 	= _gm++;
var GM_TRANSITION2 	= _gm++;
var GM_TRANSITION3 	= _gm++;
var GM_STARTGAME 	= _gm++;
var GM_MAIN_GAME	= _gm++;
var GM_PAUSE 		= _gm++;
var GM_SELECT_GAME 	= _gm++;			// normal, time trial, hide n seek
var GM_SELECT_DIFFICULTY = _gm++;		// easy, medium, hard(ish!)
var GM_SETTINGS 	= _gm++;
var GM_LEVEL_START 	= _gm++;
var GM_LEVEL_CLEAR	= _gm++;
var GM_LEVEL_END 	= _gm++;
var GM_LEVEL_SELECT = _gm++;
var GM_LOST_LIFE 	= _gm++;
var GM_INTERMISSION = _gm++;
var GM_POPUP_MENU 	= _gm++;

var GameMode;

var NUM_RAINBOW_INKS = 64;

var Ink = new INK_STRUCT();

var RainbowLine = [];
var RainbowIdx = 0;

var _Scr;

var GameLevel = 0;
var GameLevelOffset = 0;

var ClsBlockList = [];
var ClsBlockCount;

var LevelStars = [];		// the number of stars collected for each level.

var NumStars = 3;			// number of stars for the current level.

var ButtonMenu_Main;

var ClearMsgX = 200;
var ClearMsgY = 0;		// 0 = message is off.

var TransPoly = [];
var TransPolyScale;
var TransPolyAngle;
var TransPolyX;
var TransPolyY;

var TransPoly_Cube =		// cube 1 unit square centered on the origin
[
	// (x,y)
	0.5,	0.5,
	0.5,	-0.5,
	-0.5,	-0.5,
	-0.5,	0.5
];

//var TPL = 1;
var TransPoly_Triangle =
[
//	-TPL/2, -TPL/2,
//	TPL/2, -TPL/2,
//	0,	Math.sqrt (2 * (TPL/2)*(TPL/2))

//https://stackoverflow.com/questions/11449856/draw-a-equilateral-triangle-given-the-center

	-0.866, -0.5,
	0.866, -0.5,
	0.0, 1.0
	
//	0,0.5,
//	0.5,-0.5,
//	-0.5,-0.5
];

// https://polytope.miraheze.org/wiki/Pentagon
// https://mathworld.wolfram.com/RegularPentagon.html
var sqrt_5 = 2.236;
var sin_2_513272 = 0.587786;
var sin_1_256636 = 0.951;
//console.log (Math.sin (1.256636));
var TransPoly_Pentagon =
[
	0, 1,
	sin_1_256636, 	0.25 * (sqrt_5-1),
	sin_2_513272, 	-0.25 * (sqrt_5+1),
	-sin_2_513272, 	-0.25 * (sqrt_5+1),
	-sin_1_256636,	0.25 * (sqrt_5-1)
	
];

function LocalStorageAvailable()
{
	// from w3 schools example

	if (typeof(Storage) !== "undefined")
	{
		// Code for localStorage/sessionStorage.
		return true;
	}

	return false;
}

function SaveLevelStars()
{
	// btoa and atob are acting weird.. so trying another
	// approach.

	// I only need 2 bits of data per level, so can easily encode as
	// offset from ascii code 'a' and get 2 levels per character

	var k;
	
	var s;
	var b;
	
	var base_ascii_code;

	if (LocalStorageAvailable() == false)
	{
		console.log ("SaveLevelStars : no local storage available.");
		return;
	}
	
	s = "";
	
	base_ascii_code = "a".charCodeAt(0);
	
	for (k = 0; k < MAX_LEVELS; k += 2)
	{
		b = base_ascii_code + (LevelStars[k]<<2) + (LevelStars[k+1]);
		s = s + String.fromCharCode(b);
	}
	
//	console.log ("level data:");
//	console.log (s);
	
	localStorage.setItem(LOCAL_STORAGE_NAME, s);


/*
	var ab;
	var a;
	
	var k;
	var b;
	var i;
	
	var b64;
	
	if (LocalStorageAvailable() == false)
	{
		console.log ("SaveLevelStars : no local storage available.");
		return;
	}
	
	ab = new ArrayBuffer(MAX_LEVELS/4);
	a = new Uint8Array (ab);

	i = 0;
	for (k = 0; k < MAX_LEVELS; k += 4)
	{
		b = (LevelStars[k]<<6) +
			(LevelStars[k+1]<<4) +
			(LevelStars[k+2]<<2) +
			(LevelStars[k+3]);

		b = 255;
			
		console.log ("i:" + i + " b:" + b);

		a[i++] = b&0xff;
	}
	
//	b64 = window.btoa (a);
	b64 = btoa (ab);
	
	console.log (b64);
	
	localStorage.setItem(LOCAL_STORAGE_NAME, b64);
	
	a = null;
	ab = null;
*/
}

function LoadLevelStars()
{
	var k;
	
	var s;
	var b;
	var i;
	
	var base_ascii_code;
	
	if (LocalStorageAvailable() == false)
	{
		console.log ("LoadLevelStars : no local storage available.");
		return;
	}
	
	base_ascii_code = "a".charCodeAt(0);

	s = localStorage.getItem(LOCAL_STORAGE_NAME);
	if (s == null)
	{
		console.log ("stored levels not available");
		return;
	}
	
	i = 0;
	for (k = 0; k < MAX_LEVELS; k += 2)
	{
		b = s.charCodeAt(i) - base_ascii_code;
		LevelStars[k] = (b>>2)&3;
		LevelStars[k+1] = b & 3;
		i++;
	}

	console.log ("level stars:" );
	console.log (LevelStars);
	

/*	var ab;
	var a;
	
	var k;
	var b;
	var i;
	
	var b64;

	if (LocalStorageAvailable() == false)
	{
		console.log ("LoadLevelStars : no local storage available.");
		return;
	}
	
	
	//clickncrumble:"MTkzLDksMywwLDIsMCw4LDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCww"

	b64 = localStorage.getItem(LOCAL_STORAGE_NAME);
	if (b64 == null)
	{
		// no level data stored
		console.log ("No level data stored");
		return;
	}

	console.log ("loading:");
	console.log (b64);

//	ab = new ArrayBuffer(MAX_LEVELS/4);
//	a = new Uint8Array (ab);
	
	a = atob (b64);
	
//	ab = new ArrayBuffer (window.atob (b64));
//	a = new Uint8Array (ab);
	
	console.log ("raw:");
	
	console.log (a);
	console.log (a[0]);
	console.log (a[1]);

	i = 0;
	for (k = 0; k < MAX_LEVELS; k += 4)
	{
		console.log ("a:" + i + " b:" + a[i]);
		b = a[i++];
		LevelStars[k] = (b>>6)&3;
		LevelStars[k+1] = (b>>4)&3;
		LevelStars[k+2] = (b>>2)&3;
		LevelStars[k+3] = b & 3;
	}

	console.log ("level stars:" );
	console.log (LevelStars);
	a = null;
	ab = null;
*/
}


	// ------------------------------------------------------
	//
	//		---- Simple Popup Menu stuff ----
	//
	// -----------------------------------------------------

var PopupMenuItems =
[
	MENU_ITEM_CONTINUE, "Continue",
	MENU_ITEM_RESTART,	"Retry",
	MENU_ITEM_SKIP,		"Skip Level",
	MENU_ITEM_QUIT,		"Quit",
];

function POPUP_MENU_ITEM_INFO()
{
	this.id;
	this.x;
	this.y;
	this.w;
	this.h;
	
	this.str;
}

function PopupMenu_GetItemInfo (item_index, menu_item_array, info)
{
	var num_items;
	var y_spacing;
	var v_margin;
	var h_margin;
	var str;

	num_items = menu_item_array.length/2;
	y_spacing = Math.floor (_Scr.height / ((num_items*2)+1));
	str = menu_item_array[1 + (item_index*2)];

		// same calculation as drawCenteredTextBox

	v_margin = MENU_MARGIN_VERTICAL;
	h_margin = MENU_MARGIN_HORIZONTAL;
	w = (h_margin*2) + _Scr.textWidth (str);
	h = (v_margin*2) + TEXT_HEIGHT;

	x = Math.floor ((_Scr.width - w)/2);
	y = y_spacing + ((y_spacing + h) * item_index);
	
	info.id = menu_item_array[ item_index * 2 ];
	info.x = x;
	info.y = y;
	info.w = w;
	info.h = h;
	info.str = str;

}

function PopUpMenu_Draw (menu_items)
{
	var num_items;
	var y;
	var y_spacing;
	var k;
	var str;
	
	var r;
	var g;
	var b;
	
	var border_red;
	var border_green;
	var border_blue;
	
	var background_red;
	var background_green;
	var background_blue;
	
	var info;
	
	info = new POPUP_MENU_ITEM_INFO();
	
	r = 255;
	g = 255;
	b = 255;
	
	border_red = 255;
	border_green = 240;
	border_blue = 200;
	
	background_red = 128;
	background_green = 76;
	background_blue = 48;

	num_items = menu_items.length/2;
	
	y_spacing = Math.floor (_Scr.height / ((num_items*2)+1));
	
	y = y_spacing;
//	for (k = 0; k < menu_items.length; k += 2)
	for (k = 0; k < num_items; k++)
	{
		PopupMenu_GetItemInfo (k, menu_items, info);
		
//		str = menu_items [k+1];
//		DrawCenteredTextBox (y, str,

		DrawCenteredTextBox (info.y, info.str,
					r,g,b,
					border_red, border_green, border_blue,
					background_red, background_green, background_blue);
		y += y_spacing*2;
	}
}

function PopupMenu_Click (mx, my, menu_items)
{
	var info;
	var num_items;
	var k;
	var left;
	var right;
	var top;
	var bottom;
	
	info = new POPUP_MENU_ITEM_INFO();
	
	num_items = menu_items.length/2;
	
//	console.log ("mx:" + mx + " my:" + my);

	for (k = 0; k < num_items; k++)
	{
		PopupMenu_GetItemInfo (k, menu_items, info);
		
		left = info.x;
		right = info.x + info.w;
		top = info.y;
		bottom = info.y + info.h;
		
//		console.log (k);
//		console.log (info);
//		console.log ("left:" + left + " right:" + right + " top:" + top + " bottom:" + bottom);
	
		if ((left < mx) && (mx < right) &&
			(top < my) && (my < bottom))
		{
			console.log ("Clicked :" + info.str);

			
			switch (info.id)
			{
				case MENU_ITEM_CONTINUE:		// continue 
					GameMode = GM_MAIN_GAME;	// back to main game.
					break;

				case MENU_ITEM_RESTART:	
					DoRestartLevel();
					break;

				case MENU_ITEM_SKIP:
					SetNextLevel();
					GameMode = GM_MAIN_GAME;	// back to main game.
					break;

				case MENU_ITEM_QUIT:	// back to main menu.
					SetGameMode (GM_MAIN_MENU);
					break;

				default:
					break;
			}
		}
	}

}


var SpriteArray = [];

function SPRITE_STRUCT ()
{
	this.id;
	this.block_type;
	this.flags;
	this.x;
	this.y;
	this.width;
	this.height;
	this.tx;
	this.ty;
	this.tw;
	this.th;
}

function InitSprites ()
{
	var grid_width;
	var grid_height;
	var j;
	var k;
	var s;
	var g;
	
	var tx;
	var ty;
	
	var sprite_width;
	var sprite_height;
	
	var block_type;
	
	sprite_width = 32;
	sprite_height = 32;

	SpriteArray = [];
	
	s = 0;		// sprite index
	g = 0;		// game grid index

	grid_width = 5;
	grid_height = 5;
	

	for (j = 0; j < grid_height; j++)
	{
		for (k = 0; k < grid_width; k++)
		{
			block_type = GameGrid[g++];
			SpriteArray[s] = new SPRITE_STRUCT();
			SpriteArray[s].id = 2;	//s;
			SpriteArray[s].block_type = block_type;
			SpriteArray[s].flags = 0;

			SpriteArray[s].x = 16 + (k * sprite_width);
			SpriteArray[s].y = -((grid_height - j) * (sprite_height+8));		// -ve start value.
			SpriteArray[s].width = sprite_width;
			SpriteArray[s].height = sprite_height;

			ty = Math.floor (GameLevel % 8);
			tx = Math.floor ((GameLevel/8) % 7);
			
			ty = ty + (block_type-1);		// assumes block_type is at least 1
			tx = tx + (block_type-1);
			
			ty = Math.floor (ty % 8);
			tx = 1 + Math.floor (tx % 7);

			//console.log ("j:" + j + " k:" + k + " tx:" + tx + " ty:" + ty);

			
			ty *= sprite_height;
			tx *= sprite_width;

			SpriteArray[s].tx = tx;
			SpriteArray[s].ty = ty;

//			SpriteArray[s].tx = 0;
//			SpriteArray[s].ty = 0;

			SpriteArray[s].tw = sprite_width;
			SpriteArray[s].th = sprite_height;
			s++;
		}
	}
	
//	console.log (SpriteArray);
}

function SpriteCanMoveLeft (idx)
{
	// sprite can only move left if the *entire column* to the left
	// is empty.

	var x0;
	var b;
	var lhs_x;
	var p;
	
	
	lhs_x = 16;

	x0 = SpriteArray[idx].x - SpriteArray[idx].width;
	
	if (x0 <= lhs_x)	return false;		// can't go any further left
	
	for (p = 0; p < SpriteArray.length; p++)
	{
		if ((p != idx) && (SpriteArray[p].block_type != 0))
		{
			if (x0 == SpriteArray[p].x)	return false;
		}
	}
	
	return true;
}

function SpriteCanMoveDown (idx, inc_x, inc_y)
{
	// checks surrounding sprites to see if current sprite can move.
	
	var left;
	var top;
	var right;
	var base;
	var k;
	
	var x0;
	var x1;
	var y0;
	var y1;
	
	var q;
	
	left = SpriteArray[idx].x + inc_x;
	top = SpriteArray[idx].y + inc_y;
	right = left + SpriteArray[idx].width-1;
	base = top + SpriteArray[idx].height-1;
	
	if (base >= (16 + (5 * 32)))
	{
		return false;		// can't move through bottom row of screen.
	}
	
	for (k = 0; k < SpriteArray.length; k++)
	{
		if (SpriteArray[k].block_type != 0)
		{
			if (k != idx)
			{
				x0 = SpriteArray[k].x;
				y0 = SpriteArray[k].y;
				x1 = x0 + SpriteArray[k].width - 1;
				y1 = y0 + SpriteArray[k].height - 1;
				
				q = false;
				if (right < x0)	q = true;
				if (left > x1)	q = true;
				if (base < y0)	q = true;
				if (top > y1)	q = true;
				if (q == false)	return false;
				
//				if ((base >= y0) && (base <= y1))	return false;
				
//				if ((x0 >= left) && (x0 <= right))	return false;
//				if ((y0 >= top) && (y0 <= base))	return false;
			}
		}
	}
	
	return true;
}

function MoveSprites()
{
	var t;
	var m;
	var inc_y;
	var inc_x;
	
	inc_y = 2;
	inc_x = -4;

	for (t = 0; t < SpriteArray.length; t++)
	{
		
		m = SpriteCanMoveDown (t, 0, inc_y);
		if (m == true)
		{
			SpriteArray[t].y += inc_y;
		}
		
		m = SpriteCanMoveLeft (t);
		if (m == true)
		{
			SpriteArray[t].x += inc_x;
		}
	}
}

function DrawSprites()
{
	var k;
	
	var x;
	var y;

	var idx;
	var w;
	var h;
	var img;
	
	var tx;
	var ty;
	var tw;
	var th;

	idx = IMG_BLOCKS;
	if (Raw_GetImageData(idx) == null)	return;
	w = Raw_GetImageData(idx).width;
	h = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;
	
	tw = 32;
	th = 32;
	
	for (k = 0; k < SpriteArray.length; k++)
	{
		if (SpriteArray[k].block_type != 0)
		{
			x = SpriteArray[k].x;
			y = SpriteArray[k].y;

//			tx = SpriteArray[k].block_type * tw;
//			ty = SpriteArray[k].block_type * th;

			tx = SpriteArray[k].tx;
			ty = SpriteArray[k].ty;

			_Scr.drawScaledImage
				(x,y,tw,th,
				tx,ty, tw,th,		//tx,ty,tw,th,
				img,
				w,
				h);
		}
	}
}

function LinkSpr (x,y, block_type)
{
	// looks for and links a sprite at position (x,y) but only if it has
	// the same block type.
	
	var g;
	
	for (g = 0; g < SpriteArray.length; g++)
	{
		if ((SpriteArray[g].x == x) && (SpriteArray[g].y == y) && 
			(SpriteArray[g].block_type == block_type) &&
			(SpriteArray[g].flags == 0))
		{
			SpriteArray[g].flags = 1;
			// match found, do recursive search
			LinkSpr (
					SpriteArray[g].x + SpriteArray[g].width,
					SpriteArray[g].y,
					SpriteArray[g].block_type);

			LinkSpr (
					SpriteArray[g].x - SpriteArray[g].width,
					SpriteArray[g].y,
					SpriteArray[g].block_type);

			LinkSpr (
					SpriteArray[g].x,
					SpriteArray[g].y + SpriteArray[g].height,
					SpriteArray[g].block_type);

			LinkSpr (
					SpriteArray[g].x,
					SpriteArray[g].y - SpriteArray[g].height,
					SpriteArray[g].block_type);
		}
	}
}

function LinkSprites (idx)
{
		// assumes all sprites are *not* moving

	var i;
	var x;
	var y;
	var block_type;

	for (i = 0; i < SpriteArray.length; i++)
	{
		SpriteArray[i].flags = 0;
	}
	
	x = SpriteArray[idx].x;
	y = SpriteArray[idx].y;
	block_type = SpriteArray[idx].block_type;
	
	LinkSpr (x, y, block_type);
}

function RemoveLinkedSprites()
{
		// only remove sprites if more than one sprite selected.
	
	var r;
	
	var n;
	
	n = 0;
	for (r = 0; r < SpriteArray.length; r++)
	{
		if (SpriteArray[r].flags != 0)
		{
			n++;
		}
	}
	if (n < 2)	return;		// nothing to do.

	
	for (r = 0; r < SpriteArray.length; r++)
	{
		if (SpriteArray[r].flags != 0)
		{
			SpriteArray[r].block_type = 0;
			SpriteArray[r].id = 0;
		}
	}
}

function ClickOnSprite (mx,my)
{
	var u;
	var left;
	var top;
	var right;
	var base;
	
	for (u = 0; u < SpriteArray.length; u++)
	{
		if (SpriteArray[u].block_type != 0)
		{
			left = SpriteArray[u].x;
			top = SpriteArray[u].y;
			right = left + SpriteArray[u].width;
			base = top + SpriteArray[u].height;
			
			if ((left < mx) && (right > mx) && (top < my) && (base > my))
			{
				LinkSprites (u);
			}
		}
	}
	
	RemoveLinkedSprites();
}


function DoRestartLevel()
{
	// click top left corner to restart the level.

//	if (mx > 16)	return;
//	if (my > 16)	return;
	
	if (NumStars > 0)
	{
		NumStars--;
	}

	SetLevelData();
	InitSprites();

	GameMode = GM_MAIN_GAME;
}

function ClickOnBurger (mx,my)
{
	// click top left corner to restart the level.

	if (mx > 16)	return;
	if (my > 16)	return;

	
	SetGameMode (GM_POPUP_MENU);
}

	
function IsLevelClear()
{
	var s;
	
	for (s = 0; s < SpriteArray.length; s++)
	{
		if (SpriteArray[s].block_type != 0)
		{
			return false;
		}
	}
	
	return true;		// all blocks clear.
}

function DrawDigit (x,y,d)
{
	// d = 0 to 9
	
	var idx;
	var iw;
	var ih;
	var img;
	var w;
	var h;
	var tx;
	var ty;
	
	
	w = 8;
	h = 8;
	tx = d * w;
	ty = 0;

	idx = IMG_SMALL_DIGITS;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;


	_Scr.drawScaledImage
		(x,y,w,h,
		tx,ty,w,h,
		img, iw, ih);
}

function DrawNumber (sx,sy,num)
{
		// draws an unsigned integer value at position (sx,sy)

	var units;
	var x;
	var n;
	var digit;
	
	units = 1;
	while ((units*10) < num)
	{
		units *= 10;
	}

	n = num;
	x = sx;
	while (units >= 1)
	{
		digit = Math.floor (n / units);
		DrawDigit (x,sy,digit);
		
		n = n % units;
		
		units = Math.floor (units / 10);
		
		x += 8;
	}
}


	// ----------------- fat little star stuff -----------------

var NUM_FAT_LITTLE_STARS = 16;

var FatLittleStars = [];

function FatLittleStar()
{
	this.flags;
	this.x;
	this.y;
	this.incx;
	this.incy;
}

function FatLittleStars_Init()
{
	var k;
	
	for (k = 0; k < NUM_FAT_LITTLE_STARS; k++)
	{
		FatLittleStars[k] = new FatLittleStar();
	}
}

function FatLittleStars_Reset()
{
	// resets the stars to the middle of the screen.
	var k;
	var speed;
	var a;
	
	speed = 3;
	
	for (k = 0; k < NUM_FAT_LITTLE_STARS; k++)
	{
//		a = (k * 196 / NUM_FAT_LITTLE_STARS);
		a = (k * 360 / NUM_FAT_LITTLE_STARS);
		a = (a * Math.PI / 180);
	
		FatLittleStars[k].flags = 1;
		FatLittleStars[k].x = 96;
		FatLittleStars[k].y = 64;	//96;	//170;
		FatLittleStars[k].incx = speed * Math.cos(a);	//(-4 + (Math.random() * 8));
		FatLittleStars[k].incy = speed * Math.sin(a);	//(-4 + (Math.random() * 8));
	}
}

function FatLittleStars_Move()
{
	var k;

	for (k = 0; k < NUM_FAT_LITTLE_STARS; k++)
	{
		if (FatLittleStars[k].flags != 0)
		{
			FatLittleStars[k].x += FatLittleStars[k].incx;
			FatLittleStars[k].y += FatLittleStars[k].incy;
			
			if ((FatLittleStars[k].x < 0) || (FatLittleStars[k].x > 192)
				|| (FatLittleStars[k].y < 0) || (FatLittleStars[k].y > 192))
			{
				FatLittleStars[k].flags = 0;
			}
		}
	}
}

function FatLittleStars_Draw()
{
	var idx;
	var iw;
	var ih;
	var img;
	var w;
	var h;
	var tx;
	var ty;
	var k;
	
	w = 16;
	h = 16;
	tx = 0;
	ty = 0;
	tw = w;
	th = h;

	idx = IMG_LITTLE_FAT_STAR;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	for (k = 0; k < NUM_FAT_LITTLE_STARS; k++)
	{
		if (FatLittleStars[k].flags != 0)
		{
			x = Math.floor (FatLittleStars[k].x);
			y = Math.floor (FatLittleStars[k].y);
			
			_Scr.drawScaledImage
				(x,y,w,h,
				tx,ty,w,h,
				img, iw, ih);
		}
	}
}


/*
 * 	float n;

	int units;

	int d;

	char digit [2];

	SetString (string, "");

	units = 1;
	while ((units *10) <= number)
	{
		units *= 10;
	}

		// for now just output the 'whole' part
		// of the number

	n = number;
	while (units >= 1)
	{
		d = 0;
		while (n >= units)
		{
			d++;
			n -= units;
		}

		digit[0] = '0' + d;
		digit[1] = '\0';
		ConcatRawString (string, &digit[0]);

		units /= 10;
	}
*/


// ===========================================================
//			==== GRAPHICS SPECIFIC CODE GOES HERE ====
// ===========================================================

function GenerateRainbowLine()
{
	var h;
	var i;
	var n;
	var num_inks;

	Ink.r = 255;
	Ink.g = 255;
	Ink.b = 255;
	Ink.h = 0;
	Ink.s = 1;
	Ink.v = 1;

	num_inks = NUM_RAINBOW_INKS;

	i = 0;
	for (n = 0; n < num_inks; n++)
	{
		Ink.h = n / num_inks;
		Ink.HSVtoRGB();

		i = n * 4;
		RainbowLine[i+0] = Ink.r;
		RainbowLine[i+1] = Ink.g;
		RainbowLine[i+2] = Ink.b;
		RainbowLine[i+3] = 255;
	}
}

/*
function RainbowRectangle (x,y,width,height, rainbow_line_start)
{
	// hue = [0..360]
	var w;
	var h;
	var i;
	var d;

	var ink;
	var r;
	var g;
	var b;

	d = CvsData;

	// draw 4 lines
	ink = (rainbow_line_start % NUM_RAINBOW_INKS) * 4;
	for (w = 0; w < width; w++)
	{
		r = RainbowLine [ink++];
		g = RainbowLine [ink++];
		b = RainbowLine [ink++];
		ink++;

		if (ink >= (NUM_RAINBOW_INKS*4))	ink = 0;
		i = (4*(x+w)) + (4 * y * CvsWidth);

		d.data[i+0] = r;
		d.data[i+1] = g;
		d.data[i+2] = b;
		d.data[i+3] = 255;
	}

	w = (width-1);
	for (h = 0; h < height; h++)
	{
		r = RainbowLine [ink++];
		g = RainbowLine [ink++];
		b = RainbowLine [ink++];
		ink++;
		if (ink >= (NUM_RAINBOW_INKS*4))	ink = 0;

		i = (4*(x+w)) + (4 * (y+h) * CvsWidth);
		d.data[i+0] = r;
		d.data[i+1] = g;
		d.data[i+2] = b;
		d.data[i+3] = 255;
	}

	h = height - 1;
	for (w = width-1; w >= 0; w--)
	{
		r = RainbowLine [ink++];
		g = RainbowLine [ink++];
		b = RainbowLine [ink++];
		ink++;
		if (ink >= (NUM_RAINBOW_INKS*4))	ink = 0;

		i = (4*(x+w)) + (4 * (y+h) * CvsWidth);
		d.data[i+0] = r;
		d.data[i+1] = g;
		d.data[i+2] = b;
		d.data[i+3] = 255;
	}

	w = 0;
	for (h = (height-1); h > 0; h--)
	{
		r = RainbowLine [ink++];
		g = RainbowLine [ink++];
		b = RainbowLine [ink++];
		ink++;
		if (ink >= (NUM_RAINBOW_INKS*4))	ink = 0;

		i = (4*(x+w)) + (4 * (y+h) * CvsWidth);
		d.data[i+0] = r;
		d.data[i+1] = g;
		d.data[i+2] = b;
		d.data[i+3] = 255;
	}
}

function FastAlphaShadow(raw_img, img_width, img_height, sx,sy)
{
		// to do : proper clipping.

	var i;
	var x;
	var y;
	var d;
	var r;
	var g;
	var b;
	var a;

	var idx;

	d = CvsData;

	idx = 0;

	for (y = 0; y < img_height; y++)
	{
		for (x = 0; x < img_width; x++)
		{
			if (((sx+x)>0) && ((sy+y)>0) &&
			((sx+x)<CvsWidth) && ((sy+y)<CvsHeight))
			{
				a = raw_img[idx+3];
				if (a != 0)
				{
					r = raw_img[idx+0];
					g = raw_img[idx+1];
					b = raw_img[idx+2];
					r = g = b = 0;
					i = (4*(sx+x)) + (4 * CvsWidth * (y+sy));
					d.data[i+0] = ((d.data[i+0]*3)>>2) + (r>>2);
					d.data[i+1] = ((d.data[i+1]*3)>>2) + (g>>2);
					d.data[i+2] = ((d.data[i+2]*3)>>2) + (b>>2);
				}
			}
			idx += 4;
		}
	}
}
*/

/*
function ButtonRect (sx,sy,w,h, r,g,b)
{
	var y;
	var d;

	var shadow_offset;

	shadow_offset = 4;
	d = CvsData;

	FastAlphaRect (sx+w,sy+shadow_offset, shadow_offset,h-shadow_offset-1, 0,0,0);
	FastAlphaRect (sx+shadow_offset,sy+h-1, w,shadow_offset, 0,0,0);

	Scr.drawRect (sx, sy, w-1,h-1, r,g,b);
	DrawLine (d, CvsWidth, CvsHeight, sx,sy,	sx+w-1,sy, 255,255,255,255, 255,255,255,128);
	DrawLine (d, CvsWidth, CvsHeight, sx,sy,	sx,sy+h, 255,255,255,255, 255,255,255,128);
	DrawLine (d, CvsWidth, CvsHeight, sx,sy+h-1,sx+w-1,sy+h-1, 128,128,128,128, 64,64,64,128);
	DrawLine (d, CvsWidth, CvsHeight, sx+w-1,sy,	sx+w-1,sy+h, 128,128,128,128, 64,64,64,128);

	w -= 4;
	h -= 4;
	DrawLine (d, CvsWidth, CvsHeight, sx+2,sy+2,	sx+2+w-1,sy+2, 255,255,255,255, 255,255,255,128);
	DrawLine (d, CvsWidth, CvsHeight, sx+2,sy+h,	sx+2+w-1,sy+h, 255,255,255,255, 255,255,255,128);

//	DrawLine (d, Scr.canvas.width, Scr.canvas.height, sx+2,sy,	sx,sy+h, 255,255,255,255, 255,255,255,128);
//	DrawLine (d, Scr.canvas.width, Scr.canvas.height, sx+2,sy+h-1,sx+w-1,sy+h-1, 128,128,128,128, 64,64,64,128);
//	DrawLine (d, Scr.canvas.width, Scr.canvas.height, sx+w-1,sy,	sx+w-1,sy+h, 128,128,128,128, 64,64,64,128);


//	FastAlphaRect (sx,sy, w,h, 0,0,0);
//	FastAlphaRect (sx,sy, w,h, 0,0,0);

//	for (y = 0; y < h; y++)
//	{

//	}
}
*/

/*
function FastScaledImageLine (sx,sy, width, img_line_data, img_offset, img_width)
{
		// note : no clipping or blending  done here, only raw speed !!

		// aliasing will be horrible !!

	var d;
	var i;
	var dx;
	var w;
	var idx;

	d = CvsData;
	i = (4*sx) + (4 * CvsWidth * sy);

	dx = img_width / width;
	for (w = 0; w < img_width; w += dx)
	{
		idx = img_offset + (4*Math.floor (w));

		if (img_line_data[idx+3] != 0)
		{
			d.data[i+0] = img_line_data[idx+0];
			d.data[i+1] = img_line_data[idx+1];
			d.data[i+2] = img_line_data[idx+2];
		}
		i += 4;
	}
}
*/

/*
function FastAlphaScaledShadow (sx,sy, width, img_line_data, img_offset, img_width)
{
	var d;
	var i;
	var dx;
	var w;
	var idx;

	d = CvsData;
	i = (4*sx) + (4 * CvsWidth * sy);

	dx = img_width / width;
	for (w = 0; w < img_width; w += dx)
	{
		idx = img_offset + (4*Math.floor (w));

		if (img_line_data[idx+3] != 0)
		{
//			d.data[i+0] = img_line_data[idx+0];
//			d.data[i+1] = img_line_data[idx+1];
//			d.data[i+2] = img_line_data[idx+2];

			d.data[i+0] = ((d.data[i+0]*3)>>2);
			d.data[i+1] = ((d.data[i+1]*3)>>2);
			d.data[i+2] = ((d.data[i+2]*3)>>2);
		}
		i += 4;
	}
}
*/


// ===========================================================
//			==== END OF GRAPHICS SPECIFIC STUFF ====
// ===========================================================

		// Logo Drawing stuff

function DrawWobblyLogo()
{
		// scaled using sine between min and max width values.
		// , wavey top and bottom edges, like a flag waving.

	var imgdata;
	var sx;
	var sy;
	var w;
	var h;

	var offset;
	var lp;

	var idx;

	var min_w;
	var max_w;

	var min_h;
	var max_h;

	var r;
	var a;
	var ww;

	idx = IMG_LOGO;

	if (Raw_GetImageData(idx) == null)	return;

	w = Raw_GetImageData(idx).width;
	h = Raw_GetImageData(idx).height;
	imgdata = Raw_GetImageData(idx).data.data;

	min_h = Math.floor (h);
	max_h = Math.floor (h*2);

	sx = Math.floor ((Cvs.width - Math.abs(w))/2);

	r = ((max_h - min_h)/4);

	LogoWobble += 8;
	if (LogoWobble >= 360)
	{
		LogoWobble = 0;
	}

	offset = 0;

	for (lp = 0; lp < w; lp++)
	{
		a = LogoWobble + (360 * lp/h);
		a = a * Math.PI / 180;

		ww = min_h + Math.floor (Math.sin(a) * r);

		sy = 44 - Math.floor (ww/2);

		Scr.ScaledHeightImageLine (sx,sy, ww, imgdata, w * 4, offset, h);

		sx++;

		offset += 4;
	}
}

function DrawPlainLogo()
{
	var sx;
	var sy;
	var w;
	var h;
	var img;
	var idx;

	idx = IMG_LOGO;

	if (Raw_GetImageData(idx) == null)	return;

	w = Raw_GetImageData(idx).width;
	h = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	sx = Math.floor ((_Scr.width - w)/2);
	sy = 16;

	_Scr.drawImgA (sx,sy,w,h,img);
}

function DrawMainLogo()
{
	switch (LogoAnim)
	{
		case LOGO_ANIM_0:	DrawPlainLogo();	break;
		case LOGO_ANIM_1:	DrawWobblyLogo();	break;
		case LOGO_ANIM_2:
		default:
			DrawPlainLogo();
			break;
	}
}

	// ------ cloud stuff ---------

function CloudSort(a,b)
{
	return a.h - b.h;
}
function CLOUD_STRUCT (y, inc_x, tx, ty, w, h)
{
	this.x = Math.floor (Math.random() * _Scr.width);
	this.y = y;
	this.inc_x = inc_x;
	this.tx = tx;
	this.ty = ty;
	this.tw = 16;
	this.th = 16;
	this.w = w;
	this.h = h;
	this.speed = 1;
}

function InitCloudArray()
{
	var i;

	for (i = 0; i < MAX_CLOUDS; i++)
	{
		CloudArray[i] = new CLOUD_STRUCT(0,0,0,0,32,32);
	}
}

function SetCloud(i)
{
//	var i;
	var c;
	var min_w;
	var max_w;
	var min_h;
	var max_h;
	var w;
	var h;
	var min_speed;
	var max_speed;
	var speed;

	min_w = 10;
	max_w = MAX_CLOUD_WIDTH;
	min_h = 10;
	max_h = 50;

	min_speed = 0.125;
	max_speed = 1;

	c = 4 * Math.floor ((CloudData.length/4) * Math.random());
	w = min_w + Math.floor (Math.random() * (max_w - min_w));
	h = Math.floor (w*0.6);
	CloudArray[i].x = -max_w;
	CloudArray[i].y = 10 + Math.floor (Math.random() * 0.32 * _Scr.height);
	CloudArray[i].tx = CloudData[c+0];
	CloudArray[i].ty = CloudData[c+1];
	CloudArray[i].tw = CloudData[c+2];
	CloudArray[i].th = CloudData[c+3];
	CloudArray[i].w = w;
	CloudArray[i].h = h;

	speed = min_speed + ((h/max_h) * (max_speed-min_speed));
	CloudArray[i].speed = speed;
}

function SetClouds()
{
	for (i = 0; i < MAX_CLOUDS; i++)
	{
		SetCloud(i);
		CloudArray[i].x = Math.floor (Math.random() * _Scr.width);
	}
}

function DrawClouds()
{
	var i;
	var sx;
	var sy;
	var sw;
	var sh;
	var tx;
	var ty;
	var tw;
	var th;
	var img;
	var iw;
	var ih;

	idx = IMG_CLOUDS;

	if (Raw_GetImageData(idx) == null)	return;
	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	for (i = 0; i < MAX_CLOUDS; i++)
	{
		sx = Math.floor(CloudArray[i].x);
		sy = CloudArray[i].y;
		sw = CloudArray[i].w;
		sh = CloudArray[i].h;
		tx = CloudArray[i].tx;
		ty = CloudArray[i].ty;
		tw = CloudArray[i].tw;
		th = CloudArray[i].th;

		_Scr.drawScaledImage
			(sx,sy,sw,sh,
				tx,ty,tw,th,
				img,
				iw,
				ih);
	}
}

function MoveClouds()
{
	var i;

	for (i = 0; i < MAX_CLOUDS; i++)
	{
		CloudArray[i].x += CloudArray[i].speed;
		if (CloudArray[i].x > (_Scr.width+MAX_CLOUD_WIDTH))
		{
			SetCloud(i);
			CloudArray.sort(CloudSort);
		}
	}
}

	// ----------- twinkles --------------

var TwinkleBits = [];

function TWINKLE_STRUCT (num_cols, num_rows)
{
	this.num_cols = num_cols;
	this.num_rows = num_rows;

	this.x = Math.floor (Math.random() * num_cols);
	this.y = Math.floor (Math.random() * num_rows);

	this.red = 255;
	this.green = 255;
	this.blue = 255;
	this.alpha = 64 + Math.floor (Math.random() * 64);
	this.da = 0;
	while (this.da == 0)
	{
		this.da = 2 * Math.floor (8 - (Math.random() * 16));
	}
}

TWINKLE_STRUCT.prototype.draw = function()
{
	var ox;
	var oy;

	ox = 0;
	oy = Cvs.height - Math.floor (Cvs.height/4);
	_Scr.alphaSetPixel (ox+Math.floor(this.x), oy+this.y, this.red, this.green, this.blue, this.alpha);
}

TWINKLE_STRUCT.prototype.update = function()
{
	var a;

//	this.x -= 0.1;
//	if (this.x < 1)	this.x = 190;

	a = this.alpha + this.da;

	if (a > 255)
	{
		a = 255;
		this.da = 0;
		while (this.da == 0)
		{
			this.da = -2 *  Math.floor (Math.random() * 8);
		}
	}

	if (a < 0)
	{
		a = 0;

			// randomly reposition
		this.x = Math.floor (Math.random() * this.num_cols);
		this.y = Math.floor (Math.random() * this.num_rows);
		this.alpha = 64 + Math.floor (Math.random() * 64);
		this.da = 0;
		while (this.da == 0)
		{
			this.da = 2 *  Math.floor (Math.random() * 8);
		}
	}
	this.alpha = a;
}

function InitTwinkles()
{
	var w;
	var h;
	var i;

	w = Cvs.width;
	h = Math.floor (Cvs.height/3);

	TwinkleBits = [];
	for (i = 0; i < MAX_TWINKLES; i++)
	{
		TwinkleBits[i] = new TWINKLE_STRUCT (w,h);
	}
}

function DrawTwinkles()
{
	for (i = 0; i < MAX_TWINKLES; i++)
	{
		TwinkleBits[i].update();
		TwinkleBits[i].draw();
	}
}


function MoveCursor()
{
	var dx;
	var dy;

	dx = 2;
	dy = 2;

	if ((CursorX < CursorToX) && (CursorX < RightX))
	if ((CursorX < CursorToX) && (CursorX < RightX))
	{
		CursorX += dx;
	}
	if ((CursorX > CursorToX) && (CursorX > LeftX))
	{
		CursorX -= dx;
	}

	if ((CursorY < CursorToY) && (CursorY < BottomY))
	{
		CursorY += dy;
	}
	if ((CursorY > CursorToY) && (CursorY > TopY))
	{
		CursorY -= dy;
	}

}

function MoveCursorUp()
{
	if (CursorY != CursorToY)	return;		// already moving.

	if (((CursorY - CURSOR_WIDTH) >= TopY))
	{
		CursorToY = CursorY - CURSOR_HEIGHT;
	}
}

function MoveCursorDown()
{
	if (CursorY != CursorToY)	return;		// already moving.

	if (((CursorY+CURSOR_WIDTH) < BottomY))
	{
		CursorToY = CursorY + CURSOR_HEIGHT;
	}
}

function MoveCursorLeft()
{
	if (CursorX != CursorToX)	return;		// already moving.

	if (((CursorX - CURSOR_WIDTH) >= LeftX))
	{
		CursorToX = CursorX - CURSOR_WIDTH;
	}
}

function MoveCursorRight()
{
	if (CursorX != CursorToX)	return;		// already moving.

	if (((CursorX+CURSOR_WIDTH) < RightX))
	{
		CursorToX = CursorX + CURSOR_WIDTH;
	}
}



function GameSolved(grid)
{
	// returns true = yes. false =no.
	var k;
	for (k = 0; k < (GRID_WIDTH * GRID_HEIGHT); k++)
	{
		if (grid[k] != 0)	return false;
	}

	return true;
}

function GameOver(grid)
{
	// returns true if game over
	// returns false otherwise

	// game is not over if there are two identical tiles
	// next to each other.

	var j;
	var k;
	var i;
	var t;

	i = 0;
	for (j = 0; j < GRID_HEIGHT; j++)
	{
		for (k = 0; k < GRID_WIDTH; k++)
		{
			t = grid[i];
			if (grid[i] != 0)
			{
				if (k > 0)
				{
					if (t == grid[i-1])	return false;
				}
				if (k < (GRID_WIDTH-1))
				{
					if (t == grid[i+1])	return false;
				}
				if (j > 0)
				{
					if (t == grid[i-GRID_WIDTH])	return false;
				}
				if (j < (GRID_HEIGHT-1))
				{
					if (t == grid[i+GRID_WIDTH])	return false;
				}
			}
			i++;
		}
	}

	return true;
}

function CanRemoveTile (grid,x,y)
{
	// checks to see if there is an identical tile
	// next to the one at grid cell (x,y).

	// returns true if can remove tile,
	// returns false otherwise

	var i;
	var t;

	i = (y * GRID_WIDTH) + x;
	t = grid[i];

	if (t == 0)	return false;

	if (x > 0)
	{
		if (grid[i-1] == t)	return true;
	}
	if (x < (GRID_WIDTH-1))
	{
		if (grid[i+1] == t)	return true;
	}
	if (y > 0)
	{
		if (grid[i-GRID_WIDTH] == t)	return true;
	}
	if (y < (GRID_HEIGHT-1))
	{
		if (grid[i+GRID_WIDTH] == t)	return true;
	}
	return false;
}

function RemoveTile (grid,x,y)
{
	// NOTE : CALL CanRemoveTile to do test BEFORE CALLING THIS

	// recursive 'fill' based tile removal.. removes all connected
	// tiles of the same type.

	var i;
	var t;

	if ((x < 0) || (y < 0) || (x >= GRID_WIDTH)	||(y >= GRID_HEIGHT))
	{
		return;
	}

	i = (y*GRID_WIDTH)+x;
	t = grid[i];

	if (t == 0)	return;		// nothing to do.

	grid[i] = 0;


	if (x > 0)
	{
		if (grid[i-1] == t)	RemoveTile (grid,x-1,y);
	}
	if (x < (GRID_WIDTH-1))
	{
		if (grid[i+1] == t)	RemoveTile (grid,x+1,y);
	}
	if (y > 0)
	{
		if (grid[i-GRID_WIDTH] == t)	RemoveTile (grid,x,y-1);
	}
	if (y < (GRID_HEIGHT-1))
	{
		if (grid[i+GRID_WIDTH] == t)	RemoveTile (grid,x,y+1);
	}
}


function DropTiles(grid)
{
		// ** UNDER CONSTRUCTION **
/*	var i;

	for (i = (GRID_WIDTH*GRID_HEIGHT)-1; i >= GRID_WIDTH; i--)
	{

		if (grid[i] == 0)
		{
			grid[i] = grid[i-GRID_WIDTH];
			grid[i-GRID_WIDTH] = 0;
		}
	}
*/
	var x;
	var y;
	var i;
	var k;

	for (x = 0; x < GRID_WIDTH; x++)
	{
		for (y = 1; y < GRID_HEIGHT; y++)
		{
			i = (GRID_WIDTH * y) + x;
			if (grid[i] == 0)
			{
				for (k = y; k > 0; k--)
				{
					i = (GRID_WIDTH * k) + x;
					grid[i] = grid[i-GRID_WIDTH];
					grid[i-GRID_WIDTH]= 0;
				}
			}
		}
	}
}

function ShiftColumns (grid)
{
	// works from right to left, so only need to make one pass
	// through each column.


	var x;
	var y;
	var column_clear;
	var i;
	var k;

	for (x = GRID_WIDTH-2; x >= 0; x--)
	{
		column_clear = true;
		for (y = 0; y < GRID_HEIGHT; y++)
		{
			i = (y * GRID_WIDTH) + x;
			if (grid[i] != 0)
			{
				column_clear = false;
				y = GRID_HEIGHT;		// quick exit.
			}
		}
		if (column_clear == true)
		{
			for (y = 0; y < GRID_HEIGHT; y++)
			{
				for (k = x; k < (GRID_WIDTH-1);k++)
				{
					i = (y * GRID_WIDTH) + k;
					grid[i] = grid[i+1];
				}
				i = (y * GRID_WIDTH) + GRID_WIDTH-1;
				grid[i] = 0;
			}
		}
	}
}


function DrawSkyline()
{
	var s;
	var y;
	var x;
	var r;
	var g;
	var b;
	
	var idx;
	
	idx = (GameLevel>>2) % skyline_array.length;
	
	skyline_raw = skyline_array[idx];

	for (x = 0; x < 192; x++)
	{
		Scr.drawImgA (x, 0, 1, 192, skyline_raw);
	}
}

function InitClearScreen()
{
		// create a randomised permutation of a list of values
		// from 0 to max.
	var i;
	var idx;
	var list;
	var max;

	max = (SCR_WIDTH / CLS_BLOCK_SIZE) * (SCR_HEIGHT / CLS_BLOCK_SIZE);

//	max = 200;

	list = [];

		// list all the values in order
	for (i = 0; i < max; i++)
	{
		list[i] = i;
	}

	ClsBlockList = [];

		// now remove them from the list at random. if already
		// removed, removed the nearest item above in list.
	for (i = 0; i < max; i++)
	{
		idx = Math.floor (max * Math.random());
		while (list[idx] == -1)
		{
			idx++;
			if (idx == max)	idx = 0;		// wrap around if end of list reached.
		}
		ClsBlockList[i] = idx;
		list[idx] = -1;
	}

	ClsBlockCount = 0;
//	console.log (ClsBlockList);
}

function ClearScreen()
{
	var i;
	var x;
	var y;
	var w;
//	var h;
	var b;
	var k;
	var j;
	var sx;
	var sy;
	var s;

	DrawSkyline();

	SetGameMode (GM_MAIN_MENU);

/*	return;

	w = Math.floor (SCR_WIDTH / CLS_BLOCK_SIZE);
//	h = Math.floor (SCR_HEIGHT/ CLS_BLOCK_SIZE);

//	console.log ("cls");
	for (i = 0; i < ClsBlockCount; i++)
	{
		b = ClsBlockList[i];
		y = CLS_BLOCK_SIZE * (Math.floor (b / w));
		x = CLS_BLOCK_SIZE * (Math.floor (b % w));

//		console.log ("x:" + x + " y:" + y);

//		Scr.drawRect(x,y,CLS_BLOCK_SIZE,CLS_BLOCK_SIZE, i*16,i*16,i*16);

		s = y * 4;
		for (k = 0; k < CLS_BLOCK_SIZE; k++)
		{
			r = skyline_raw[s+0];
			g = skyline_raw[s+1];
			b = skyline_raw[s+2];
			sy = y + k;
			for (j = 0; j < CLS_BLOCK_SIZE; j++)
			{
				sx = x + j;
				Scr.setPixel (sx, sy, r,g,b);
			}
			s += 4;
		}
	}

	if (ClsBlockCount < ClsBlockList.length)
	{
		ClsBlockCount += 4;
	}
	else
	{
		// end
	}
*/
}

function DoLogoTimer()
{
	LogoTimer--;
	if (LogoTimer < 1)
	{
		LogoTimer = LOGO_TIMER_SIZE;
		LogoAnim = LogoAnimTable [Math.floor (Math.random() * LogoAnimTable.length)];

		GameLevel++;
		if (GameLevel > 999)	{	GameLevel = 0;	}
	}
}

function DrawCopyrightMsg()
{
	var idx;
	var iw;
	var ih;
	var img;

	var sx;
	var sy;
	var sw;
	var sh;

	var tx;
	var ty;
	var tw;
	var th;

	idx = IMG_COPYRIGHT;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	sx = Math.floor ((_Scr.width - iw)/2);
	sy = _Scr.height - ih - 8;
	sw = iw;
	sh = ih;

	tx = 0;
	ty = 0;
	tw = iw;
	th = ih;

	_Scr.drawScaledImage
		(sx,sy,sw,sh,
			tx,ty,tw,th,
			img,
			iw,
			ih);

}

function InitButtonMenu()
{
	var w;
	var h;
	var x;
	var y;

	w = 64;
	h = 22;
	x = Math.floor ((_Scr.width-w)/2);
	y = Math.floor (_Scr.height*0.45);

	ButtonMenu_Main = new STRUCT_BUTTON_MENU();

	ButtonMenu_Main.addButton(
			BUTTON_ID_START,
			BUTTON_TYPE_TEXT,
			"Play",
			x,y,
			w,h);
}

function InitMainMenu()
{
	// UNDER CONSTRUCTION
	SetClouds();
	InitTwinkles();
	InitButtonMenu();
}

function DrawTwistyBorder()
{
	var idx;
	var iw;
	var ih;
	var img;
	var sx;
	var sy;
	var sw;
	var sh;
	var tx;
	var ty;
	var tw;
	var th;

	idx = IMG_TWISTY_BORDER;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

		// draw corners.
	sx = 0;
	sy = 0;
	sw = 16;
	sh = 16;

	tx = 0;
	ty = 0;
	tw = sw;
	th = sh;

	_Scr.drawScaledImage
		(sx,sy,sw,sh,
			tx,ty,tw,th,
			img,
			iw,
			ih);

	sx = _Scr.width-sw;
	sy = 0;
	tx = sw+sw;
	ty = 0;

	_Scr.drawScaledImage
		(sx,sy,sw,sh,
			tx,ty,tw,th,
			img,
			iw,
			ih);

	sx = 0;
	sy = _Scr.height - sh;
	tx = 0;
	ty = sh+sh;

	_Scr.drawScaledImage
		(sx,sy,sw,sh,
			tx,ty,tw,th,
			img,
			iw,
			ih);

	sx = _Scr.width-sw;
	sy = _Scr.height - sh;
	tx = sw+sw;
	ty = sh+sh;

	_Scr.drawScaledImage
		(sx,sy,sw,sh,
			tx,ty,tw,th,
			img,
			iw,
			ih);

		// draw top border
	sy = 0;
	tx = sw;
	ty = 0;
	for (sx = sw; sx < (_Scr.width-sw); sx += sw)
	{
		_Scr.drawScaledImage
			(sx,sy,sw,sh,
				tx,ty,tw,th,
				img,
				iw,
				ih);
	}

		// draw bottom border
	sy = _Scr.height-sh;
	tx = sw;
	ty = sh+sh;
	for (sx = sw; sx < (_Scr.width-sw); sx += sw)
	{
		_Scr.drawScaledImage
			(sx,sy,sw,sh,
				tx,ty,tw,th,
				img,
				iw,
				ih);
	}

		// draw lhs border
	sx = 0;
	tx = 0;
	ty = sh;
	for (sy = sh; sy < (_Scr.height-sh); sy += sh)
	{
		_Scr.drawScaledImage
			(sx,sy,sw,sh,
				tx,ty,tw,th,
				img,
				iw,
				ih);
	}

		// draw rhs border
	sx = _Scr.width-sw;
	tx = sw+sw;
	ty = sh;
	for (sy = sh; sy < (_Scr.height-sh); sy += sh)
	{
		_Scr.drawScaledImage
			(sx,sy,sw,sh,
				tx,ty,tw,th,
				img,
				iw,
				ih);
	}
}

function DrawLevelStars()
{
	var idx;
	var img;
	var iw;
	var ih;
	var sx;
	var sy;
	var sw;
	var sh;
	var tx;
	var ty;
	var tw;
	var th;
	var x;
	var y;

	var level;

	var ox;
	var oy;
	var x_step;
	var y_step;

	var num_rows;
	var num_cols;


	num_rows = 5;
	num_cols = 5;

	idx = IMG_STAR;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	ox = 18;
	oy = 38 - LEVEL_SELECT_OFFSET;
	x_step = 32;
	y_step = 32;

	level = GameLevelOffset;

//	LevelStars[0] = 1;
//	LevelStars[10] = 1;
//	LevelStars[20] = 1;

//	LevelStars[6] = 2;
//	LevelStars[17] = 2;
//	LevelStars[22] = 2;

//	LevelStars[5] = 3;
//	LevelStars[12] = 3;
//	LevelStars[24] = 3;


	for (y = 0; y < num_rows; y++)
	{
		for (x = 0; x < num_cols; x++)
		{
			sx = ox + (x_step * x);
			sy = oy + (y_step * y);
			sw = iw;
			sh = Math.floor(ih/2);

			tx = 0;
			ty = 0;
			tw = iw;
			th = Math.floor (ih/2);


			ty = th;
			if (LevelStars[level] > 0)	ty = 0;
			_Scr.drawScaledImage
				(sx,sy,sw,sh,
					tx,ty,tw,th,
					img,
					iw,
					ih);

			sx += 18;
			ty = th;
			if (LevelStars[level] > 1)	ty = 0;
			_Scr.drawScaledImage
				(sx,sy,sw,sh,
					tx,ty,tw,th,
					img,
					iw,
					ih);

			sx -= 9;
			sy -= 3;
			ty = th;
			if (LevelStars[level] > 2)	ty = 0;

			_Scr.drawScaledImage
				(sx,sy,sw,sh,
					tx,ty,tw,th,
					img,
					iw,
					ih);

			level++;
		}
	}
}

function DrawLevelSelect()
{
	var w;
	var h;
	var x;
	var h;
	var j;
	var k;
	var num_rows;
	var num_cols;
	var x_spacing;
	var y_spacing;
	var ox;
	var oy;
	var r;
	var g;
	var b;

	r = 255;
	g = 224;
	b = 192;

	num_rows = 5;
	num_cols = 5;

	w = 20;
	h = 20;

	Ink.r = r;
	Ink.g = g;
	Ink.b = b;
	Ink.h = 0;
	Ink.s = 1;
	Ink.v = 1;

	x_spacing = 32;	//Math.floor(_Scr.width / (num_cols+1));
	y_spacing = 32;	//Math.floor(_Scr.height / (num_rows+1));

	ox = Math.floor ( (_Scr.width - ((x_spacing * num_cols) - (x_spacing-w)))/2);
	oy = Math.floor ( (_Scr.width - ((y_spacing * num_rows) - (y_spacing-h)))/2);
	
	oy -= LEVEL_SELECT_OFFSET;

	for (j = 0; j < num_rows; j++)
	{
		for (k = 0; k < num_cols; k++)
		{
			Ink.h = (((j*num_cols)+k)/ (num_rows*num_cols));
			Ink.HSVtoRGB();
			r = Ink.r;
			g = Ink.g;
			b = Ink.b;

			x = Math.floor (ox + (k * x_spacing));
			y = Math.floor (oy + (j * y_spacing));

			_Scr.drawRect (x-1,y,w+2,h, r,g,b);

			r = 0;
			g = 0;
			b = 0;

			_Scr.drawLine (x-1,y, x+w+1, y, r,g,b);
			_Scr.drawLine (x-1,y, x-1, y + h-1, r,g,b);
			_Scr.drawLine (x+w+1,y, x+w+1, y + h-1, r,g,b);
		}
	}
}

function DrawLevelNumber (x,y,n)
{
		// n = 1 to 999

	var idx;
	var iw;
	var ih;
	var img;
	var d0;
	var d1;
	var d2;
	var sx;
	var sy;
	var sw;
	var sh;
	var tx;
	var ty;
	var tw;
	var th;
	
	var d;

	idx = IMG_DIGITS;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	d = 1;
	sx = x;
	sy = y;
	sw = 10;
	sh = 13;
	tw = sw;
	th = sh;
	ty = 0;


	if (n >= 10)	{ d = 10; }
	if (n >= 100)	{ d = 100; }
	
	while (d > 0)
	{
		tx = sw * Math.floor (n/d);
		_Scr.drawScaledImage
		(sx,sy,sw,sh,
			tx,ty,tw,th,
			img,
			iw,
			ih);
		sx += sw;
		
		n = n % d;
		d = Math.floor (d / 10);
	}
/*
	d0 = Math.floor (n/100);
	d1 = Math.floor (n/10
	

	sx = x;
	sy = y;
	tw = sw;
	th = sh;
	ty = 0;

	if (d0 > 0)
	{
		tx = d0 * sw;
		_Scr.drawScaledImage
		(sx,sy,sw,sh,
			tx,ty,tw,th,
			img,
			iw,
			ih);
		sx += sw;
	}

	tx = d1 * sw;
	_Scr.drawScaledImage
		(sx,sy,sw,sh,
			tx,ty,tw,th,
			img,
			iw,
			ih);
*/
}

function DrawLevelNumbers()
{
	var x;
	var y;
	var rows;
	var cols;
	var sx;
	var sy;
	var n;
	var w;

	rows = 5;
	cols = 5;

	w = 32;
	sy = 24-LEVEL_SELECT_OFFSET;

	n = GameLevelOffset+1;		// internally, levels start at zero, but player sees start = 1
	
	for (y = 0; y < rows; y++)
	{
		sx = 22;
		for (x = 0; x < cols; x++)
		{
			if (n < 10)
			{
				DrawLevelNumber (sx+6,sy,n);
			}
			if ((n > 9) && (n < 20))
			{
				DrawLevelNumber (sx,sy,n);
			}
			if ((n > 19) && (n <100))
			{
				DrawLevelNumber (sx+1,sy,n);
			}

			if (n > 99)
			{
				DrawLevelNumber (sx-4,sy,n);
			}


			n++;
			sx += w;
		}
		sy += 32;
	}
}

/*
function DrawRestartIcon()
{
	var idx;
	var iw;
	var ih;
	var img;
	var x;
	var y;
	var w;
	var h;
	
	x = 2;
	y = 2;
	w = 12;
	h = 12;
	
	idx = IMG_RESTART_IMAGE;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;


	Scr.drawRect(x-1,y-1, w+2,h+2, 92,32,192);


	_Scr.drawScaledImage
		(x,y,w,h,
			0,0,w,h,		//tx,ty,tw,th
			img,
			iw,
			ih);
}
*/

function DrawBurgerIcon()
{
	var idx;
	var iw;
	var ih;
	var img;
	var x;
	var y;
	var w;
	var h;
	
	x = 2;
	y = 2;
	w = 12;
	h = 12;
	
//	idx = IMG_RESTART_IMAGE;
	idx = IMG_BURGER;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;


	Scr.drawRect(x-1,y-1, w+2,h+2, 92,32,192);


	_Scr.drawScaledImage
		(x,y,w,h,
			0,0,w,h,		//tx,ty,tw,th
			img,
			iw,
			ih);
}


function DrawArrows()
{
	var idx;
	var iw;
	var ih;
	var img;
	var x;
	var y;
	var w;
	var h;
	
	var d;
	
	d = 40;
	
	x = 96-d;
	y = 172;	//192-16-4;
	w = 16;
	h = 16;
	
	idx = IMG_LEFT_ARROW;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

//	Scr.drawRect(x-1,y-1, w+2,h+2, 92,32,192);

	_Scr.drawScaledImage
		(x,y,w,h,
			0,0,w,h,		//tx,ty,tw,th
			img,
			iw,
			ih);
	

	x = 96+d-w;
//	y = 192-16-4;
//	w = 16;
//	h = 16;
	
	idx = IMG_RIGHT_ARROW;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

//	Scr.drawRect(x-1,y-1, w+2,h+2, 92,32,192);

	_Scr.drawScaledImage
		(x,y,w,h,
			0,0,w,h,		//tx,ty,tw,th
			img,
			iw,
			ih);

}

function InitLevelSelect()
{
	GameLevel = 0;
	GameLevelOffset = 0;
}

function DoLevelSelect()
{
	DrawLevelSelect();
	DrawTwistyBorder();
	DrawLevelNumbers();
	DrawLevelStars();
	DrawArrows();
}


function SelectLevel (mx, my)
{
	var ox;
	var oy;
	var x;
	var y;
	var w;
	var h;
	var level;
	var block_width;
	var block_height;
	
	var left_x;
	var right_x;
	var top_y;
	var bottom_y;

	var d;
	
	GameLevel = -1;	// -1 = no level selected

	
	if (my >= 172)
	{
		// update level offset.
		d = 40;
		left_x = 96-d;
		right_x = left_x + 16;
		if ((mx >= left_x) && (mx <= right_x))
		{
			console.log ("left arrow pressed");
			GameLevelOffset -= 25;
			if (GameLevelOffset < 0) GameLevelOffset = 0;
			return;
		}
		left_x = 96+d-16;
		right_x = left_x + 16;
		if ((mx >= left_x) && (mx <= right_x))
		{
			console.log ("right arrow pressed");
			GameLevelOffset += 25;
			if (GameLevelOffset > 975) GameLevelOffset = 975;
			return;
		}
	}
	
	ox = 22;
	oy = 24 - LEVEL_SELECT_OFFSET;
	w = 32;
	h = 32;

	rows = 5;
	cols = 5;
	
	block_width = 22;
	block_height = 20;
	
	level = -1;
	for (y = 0; y < rows; y++)
	{
		for (x = 0; x < cols; x++)
		{
			left_x = ox + (x * w);
			right_x = left_x + block_width;
			top_y = oy + (y * h);
			bottom_y = top_y + block_height;
			
			if ((left_x < mx) && (right_x >= mx) &&
				(top_y < my) && (bottom_y > my))
			{
				level = GameLevelOffset + (y*rows)+x;
			}
		}
	}
	
	GameLevel = level;
	
	console.log ("Level selected:" + level);
}


function DrawCenteredTextBox (box_y, str, r,g,b,
				outline_red, outline_green,outline_blue,
				background_red, background_green, background_blue)
{
	// for now r,g,b, ignored.
	var x;
	var y;
	var w;
	var h;
	var v_margin;
	var h_margin;
	var text_height;
	
	v_margin = MENU_MARGIN_VERTICAL;
	h_margin = MENU_MARGIN_HORIZONTAL;
	text_height = TEXT_HEIGHT;

	w = (h_margin*2) + _Scr.textWidth (str);
	h = (v_margin*2) + text_height;

	x = Math.floor ((_Scr.width - w)/2);
	y = box_y;	// + Math.floor (h/2);
	
		// draw background
//	_Scr.drawRect(x,y,w,h, 
//			background_red, background_green, background_blue);

	_Scr.FastAlphaRect3 (x,y,w,h,
			background_red, background_green, background_blue);


		// draw border
	_Scr.drawLine (x,y, x+w, y, 
				outline_red, outline_green, outline_blue);
	_Scr.drawLine (x,y+h, x+w, y+h, 
				outline_red, outline_green, outline_blue);
	_Scr.drawLine (x,y, x, y+h, 
				outline_red, outline_green, outline_blue);
	_Scr.drawLine (x+w,y, x+w, y+h, 
				outline_red, outline_green, outline_blue);

	x = Math.floor ((_Scr.width - _Scr.textWidth (str))/2);
	y = box_y + Math.floor ((h+text_height)/2);
	_Scr.drawText (x,y, r,g,b,255, str);
}

function InitFadeTransition()
{
	FadePercent = 0;

	_Scr.clearBuffer(0,0,192);
//	_Scr.copyToBuffer();
}

function DoFade()
{
	var fade_percent;

	fade_percent = 2;

	if (FadePercent >= 100)
	{
			// TO DO
		SetGameMode (GM_LEVEL_SELECT);
		return;
	}
	_Scr.fade(fade_percent);
	FadePercent++;
}

function DoFade2()
{
	// uses copy buffer
	if (FadePercent >= 50)
	{
			// TO DO
		SetGameMode (GM_LEVEL_SELECT);
		return;
	}
	_Scr.blendBuffer (Math.floor (FadePercent));
	FadePercent += 1;	//0.5;
}

function DrawStartImg()
{
	var idx;
	var iw;
	var ih;
	var img;

	idx = IMG_START;
	if (Raw_GetImageData(idx) == null)	return;
	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx);

	_Scr.drawImgA (76,90, iw, ih, img.data.data);
}

function DoMainMenu(current_time)
{
	// current time passed in for animation timings....
	DrawSkyline();
	DrawTwinkles();
	MoveClouds();
	DrawClouds();
	DrawMainLogo();
	DoLogoTimer();

	DrawCopyrightMsg();

	ButtonMenu_Main.setRGB (BUTTON_ID_START, 192,224,255);
	ButtonMenu_Main.draw (_Scr);


	DrawStartImg();
}

function InitTrans2()
{
	var ox;
	var oy;
	var i;
	var poly;
	
	var g;
	
	g = GameLevel % 25;

//	console.log ("INIT TRANS 2");

	TransPolyScale = 1;
	TransPolyAngle = 0;
	TransPoly = [];

	TransPolyX = 26 + ((g % 5)*32);
	TransPolyY = 24 + (Math.floor (g / 5)*32);

	
//	poly = TransPoly_Triangle;
	poly = TransPoly_Pentagon;

	for (i = 0; i < poly.length; i++)
	{
		TransPoly[i] = poly[i];
	}

}

function DoTrans2()
{
	var poly;
	var x;
	var y;

	var ox;
	var oy;

	var tx;
	var ty;

	var sin;
	var cos;
	var a;
	
	var max_scale;

	var r;
	var g;
	var b;

	max_scale = 164;		// 140

//	ox = 96;
//	oy = 96;


	poly = [];

	TransPolyAngle += 4;
	if (TransPolyAngle >= 360)
	{
		TransPolyAngle -= 360;
	}
	a = TransPolyAngle * Math.PI / 180;

	if (TransPolyScale < max_scale)
	{
		TransPolyScale += 2;
	}
	
	ox = TransPolyX + ((96-TransPolyX) * TransPolyScale / max_scale);
	oy = TransPolyY + ((96-TransPolyY) * TransPolyScale / max_scale);


	sin = Math.sin(a);
	cos = Math.cos(a);

		// rotate points into temporary array
	for (i = 0; i < TransPoly.length; i += 2)
	{
		tx = TransPoly[i];
		ty = TransPoly[i+1];

		x = (tx * cos) - (ty * sin);
		y = (tx * sin) + (ty * cos);

		poly[i] = ox + Math.floor (0.5 + (x * TransPolyScale));
		poly[i+1]=oy + Math.floor (0.5 + (y * TransPolyScale));
	}

	Ink.r = 255;
	Ink.g = 255;
	Ink.b = 255;
	Ink.h = 0;
	Ink.s = 1;
	Ink.v = 1;
	Ink.h = GameLevel / 25;
	Ink.HSVtoRGB();

	r = Ink.r * ((TransPolyScale / max_scale));
	g = Ink.g * ((TransPolyScale / max_scale));
	b = Ink.b * ((TransPolyScale / max_scale));

	_Scr.drawPolygon (poly, r,g,b, true);


	if (TransPolyScale >= max_scale)
	{
		SetGameMode (GM_STARTGAME);
	}
}


function DrawGameGrid()
{
//	GameGrid

	var idx;
	var w;
	var h;
	var img;
	
	var x;
	var y;
	var sw;
	var sh;
	
	var tx;
	var ty;
	var tw;
	var th;
	
	var b;
	var k;

	idx = IMG_BLOCKS;
	if (Raw_GetImageData(idx) == null)	return;

	w = Raw_GetImageData(idx).width;
	h = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	tw = 32;
	th = 32;
	
	sw = 32;
	sh = 32;

	k = 0;
	for (y = (sh>>1); y < 192; y += sh)
	{
		for (x = (sw>>1); x < (192-32); x += sw)
		{
			b = GameGrid[k++];
			if (b > 0)
			{
				tx = 32 + (b*tw);
				ty = (b*th);
				
//			_Scr.drawImgA (x,y, w, h, img);	//,90, iw, ih, img.data.data);

//ScrBuffer.prototype.drawScaledImage = function (sx,sy,sw,sh, tx,ty,tw,th, raw_img_data, img_width, img_height)

			_Scr.drawScaledImage
				(x,y,sw,sh,
				tx,ty, tw,th,		//tx,ty,tw,th,
				img,
				w,
				h);
			}

//			tx += tw;

		}
//		ty += th;
	}

}





function TestDrawShapes()
{
	var idx;
	var w;
	var h;
	var img;
	
	var x;
	var y;
	var sw;
	var sh;
	
	var tx;
	var ty;
	var tw;
	var th;

//	idx = IMG_PENTAGON;
	idx = IMG_BLOCKS;
	if (Raw_GetImageData(idx) == null)	return;

	w = Raw_GetImageData(idx).width;
	h = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	tw = 32;
	th = 32;
	
	sw = 32;
	sh = 32;

	ty = 0;
	for (y = (sh>>1); y < 192; y += sh)
	{
		tx = 0;
		for (x = (sw>>1); x < (192-32); x += sw)
		{
//			_Scr.drawImgA (x,y, w, h, img);	//,90, iw, ih, img.data.data);

//ScrBuffer.prototype.drawScaledImage = function (sx,sy,sw,sh, tx,ty,tw,th, raw_img_data, img_width, img_height)

		_Scr.drawScaledImage
			(x,y,sw,sh,
			tx,ty, tw,th,		//tx,ty,tw,th,
			img,
			w,
			h);

			tx += tw;

		}
		ty += th;
	}
}


function SetGameMode (new_mode)
{
	// do initialisations for each game mode here.

	switch (new_mode)
	{
		case GM_INIT:	// do initial set up of system
					break;

		case GM_CLS:	InitClearScreen();
						break;

		case GM_MAIN_MENU:	InitMainMenu();	break;

		case GM_LEVEL_SELECT: InitLevelSelect(); break;

		case GM_TRANSITION1:	InitFadeTransition();
								break;

		case GM_TRANSITION2:	InitTrans2();
								break;

		case GM_STARTGAME:		// see DoStartGame()
					break;

		case GM_POPUP_MENU:		
								PopUpMenu_Draw (PopupMenuItems);
								break;

		case GM_MAIN_GAME:
		
//				FatLittleStars_Reset();
//					DrawGameGrid();
					break;

	}

	GameMode = new_mode;
}

function SetLevelData()
{
	var p;
	var i;
	p = GameLevel * 25;
	
	for (i = 0; i < 25; i++)
	{
		GameGrid[i] = PuzzleData [p++];
	}
}

function SetNextLevel()
{
	LevelStars[GameLevel] = NumStars;	// store number of stars.
	SaveLevelStars();		// save to local storage (automatically???)
	
	GameLevel++;
	
//	console.log ("GameLevel:" + GameLevel);

	if (GameLevel > 999)
	{
//		console.log ("WRAPPING GAME LEVEL");
		GameLevel = 0;		// just wrap around forever for now..
	}
	SetLevelData();
	InitSprites();
	
	
	ClearMsgY = 64;
	ClearMsgX = 192;
	
	NumStars = 3;

//	FatLittleStars_Reset();
}


function DoStartGame()
{
	SetLevelData();
	InitSprites();
	SetGameMode (GM_MAIN_GAME);
}


function DrawGameLevel()
{
	var x;
	var y;
	var w;

	w = 10;
	x = _Scr.width-11;
	y = 3;
	if (GameLevel >= 10) {x -= 8; w = 18;}
	if (GameLevel >= 100){x -= 8; w = 26;}

	Scr.drawRect(x-1,y-1, w,10, 92,32,32);

	DrawNumber (x,y, GameLevel+1);
}


function DrawClearMsg()
{
		// also handles message moving.
	
//	var ClearMsgX = 10;
//var ClearMsgY = 90;

	var idx;
	var iw;
	var ih;
	var img;
	
	var x;
	var y;
	var sw;
	var sh;
	
	var tx;
	var ty;
	var tw;
	var th;
	
	if (ClearMsgY < 1)	return;		// msg is not visible.

	idx = IMG_CLEAR;
	if (Raw_GetImageData(idx) == null)	return;
	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;


	tx = 0;
	ty = 0;
	tw = 72;
	th = 16;
	
	sw = 72;
	sh = 16;
	
	x = ClearMsgX;
	y = ClearMsgY;

	_Scr.drawScaledImage
			(x,y,sw,sh,
			tx,ty, tw,th,		//tx,ty,tw,th,
			img,
			iw,
			ih);

	if ((ClearMsgX & 0xFE) == 96)
	{
		FatLittleStars_Reset();
	}



	ClearMsgX -= 2;
	if (ClearMsgX < -72)
	{
		ClearMsgY = 0;
	}
//			_Scr.drawImgA (x,y, w, h, img);	//,90, iw, ih, img.data.data);
}

function DrawLittleFatStar (x,y)
{
	var idx;
	var iw;
	var ih;
	var img;
	
	var x;
	var y;
	var sw;
	var sh;
	
	var tx;
	var ty;
	var tw;
	var th;
	
	idx = IMG_LITTLE_FAT_STAR;
	if (Raw_GetImageData(idx) == null)	return;
	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;


	tx = 0;
	ty = 0;
	tw = 16;
	th = 16;
	
	sw = tw;
	sh = th;
	
	_Scr.drawScaledImage
			(x,y,sw,sh,
			tx,ty, tw,th,		//tx,ty,tw,th,
			img,
			iw,
			ih);
}


function DrawStars()
{
	// draws the stars for the current level.
		
	var idx;
	var img;
	var iw;
	var ih;

	var sx;
	var sy;
	var sw;
	var sh;
	var tx;
	var ty;
	var tw;
	var th;
	var x;
	var y;

	idx = IMG_STAR;
	if (Raw_GetImageData(idx) == null)	return;
	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	sy = 2;
	sw = iw;
	sh = Math.floor(ih/2);

	for (x = 0; x < 3; x++)
	{
		tx = 0;
		ty = 0;
		tw = iw;
		th = Math.floor (ih/2);

		ty = th;
		if (x < NumStars)	ty = 0;

		sx = 16 + (x*12);

		_Scr.drawScaledImage
				(sx,sy,sw,sh,
					tx,ty,tw,th,
					img,
					iw,
					ih);
		
	}
}

function DoMainGame()
{
	DrawSkyline();
	DrawTwinkles();
	MoveClouds();
	DrawClouds();
	DrawTwistyBorder();

	MoveSprites();
	DrawSprites();
	
	DrawGameLevel();
	
//	DrawRestartIcon();
	DrawBurgerIcon();
	
	DrawStars();
	
	FatLittleStars_Move();
	FatLittleStars_Draw();

	DrawClearMsg();
	
//	DrawLittleFatStar (128,128);

	
	if (IsLevelClear() == true)
	{
		SetNextLevel();
	}
}

function DoPopupMenu()
{
	// does nothing.. drawing done when first entering game mode
	// mouseup handles clicks.
//	PopUpMenu_Draw (PopupMenuItems);
}

function MainGameLoop(t)
{

	switch (GameMode)
	{
		case GM_INIT:			SetGameMode (GM_CLS); break;
		case GM_CLS:			ClearScreen();	break;
		case GM_MAIN_MENU:		DoMainMenu(t);	break;
		case GM_LEVEL_SELECT: 	DoLevelSelect(); break;
		case GM_TRANSITION1:	DoFade2();	break;
		case GM_TRANSITION2:	DoTrans2();
								DrawTwistyBorder();
								break;

		case GM_STARTGAME:		DoStartGame();	break;
		case GM_MAIN_GAME:		DoMainGame();	break;
		
		case GM_POPUP_MENU:		DoPopupMenu();	break;
					break;

	}

//	DrawCenteredTextBox (20, "This is a long box", 255,255,255,
//				255,240,200,
//				224,192,176);

//	DrawLevelNumber (18,22,25);

//DoTrans2();


//	DrawGameGrid();
//	TestDrawShapes();

	_Scr.drawBuffer();
}

	// -------------------------------------------
	//		---- Mouse / Pointer Events ----
	// -------------------------------------------

function MouseDown (mx,my,e)
{
//	console.log ("mouse down:" + mx + " " + my);

//	if (GameLoopState == GAME_LOOP_STATE_START)
//	{
//		// need to change state, as
//	}

}

function MouseMove (mx,my,e)
{
//	console.log ("mouse move:" + mx + " " + my);

	_MouseX = mx;
	_MouseY = my;
}

function MouseUp (mx,my,e)
{
	var bid;
//		console.log ("mouse up:" + mx + " " + my);
	_MouseX = mx;
	_MouseY = my;

	// menu buttons are only checked on mouse up, so if you accidentally
	// press a button, you can move off it before releasing the mouse.

	switch (GameMode)
	{
//		case GameMode:
//				_ExitStartLoop = true;
//				break;

		case GM_MAIN_MENU:
				bid = ButtonMenu_Main.getButtonId (mx,my);
				if (bid == null)
				{
					return;
				}
				if (bid == BUTTON_ID_START)
				{
					console.log ("button " + bid + " pressed");
					SetGameMode (GM_TRANSITION1);
				}
				break;

		case GM_LEVEL_SELECT:
				SelectLevel (mx,my);
				if (GameLevel < 0)	return;
				SetGameMode (GM_TRANSITION2);
				break;
				
		case GM_MAIN_GAME:
				ClickOnSprite (mx,my);
//				ClickOnRestart (mx,my);
				ClickOnBurger (mx,my);
				break;

		case GM_POPUP_MENU:
				PopupMenu_Click (mx, my, PopupMenuItems);
				break;

		default:	break;
	}
}

function Game_InitPointerEvents(cvs_id)
{
	InitPointerEvents(cvs_id, MouseDown, MouseMove, MouseUp, true);
}

function InitLevelStars()
{
	var i;
	for (i = 0; i < MAX_LEVELS; i++)
	{
		LevelStars[i] = 0;
	}
	
	LoadLevelStars();		// load stored data if available.
}

function InitGame(scr_buffer_struct)
{
	GameMode = GM_INIT;
	_Scr = scr_buffer_struct;
	LogoAnim = LogoAnimTable[0];
	LogoTimer = LOGO_TIMER_SIZE;
	GenerateRainbowLine();

	InitCloudArray();

	InitLevelStars();
	
	FatLittleStars_Init();

//	InitTrans2();

//		var i;
//	console.log (TransPoly.length);
//	console.log (TransPoly);
//	for (i = 0; i < TransPoly.length; i += 2)
//	{
//		console.log ("i:" + i);
//	}
}
