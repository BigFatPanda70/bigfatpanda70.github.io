/*
	Title	:	Javascript Bat and ball game.
	
	Info	:	Version 0.0	23rd March 2020
	
	Author	:	Nick Fleming
	
	Updated	:	25th March 2020
	
	 Notes:
	--------
	This file contains the main game code for a simple breakout style game.
	
	I'm adding code at the start so that it could possibly be a two player game,
	with a solid block in the middle of the playing area to separate the players.
	.. possibly do a wide screen version with up to 4 players ???
	
	actually.. thats not a bad idea..
	
	1.. 2 .. or 4 players.
	
	1 player .. controls 4 bats
	2 players .. each control 2 bats
	1 player .. controls one bat each.

	3 players ?? .. two control one bat.. one controls 2 bats ???

	 24th March 2020
	-----------------
	 Done some preliminary tests with mock screen layouts to see
	 roughly how it's all going to look.

	 25th March 2020
	------------------
		There is no technical reason why the bricks need to be laid
	out in a boring row by row fashion. Perhaps experiment with 
	different size bricks at different angles ???


	 To Use :
	----------
		Call BNB_Init() to do one time initialisations.
		Call BNB_DoGame (dt) to run the game for dt seconds.
*/

	// === constants ===

var DEFAULT_BAT_WIDTH = 64;
var BNB_BRICK_HEIGHT = 1.8;
var BNB_BRICK_WIDTH = 1.5;
var BAT_WIDTH = 2;
var BALL_RADIUS = 0.25;
var BNB_PLAYER_Y = -5;
var BNB_NUM_ROWS = 6;
var BNB_NUM_COLUMNS = 12;
var BNB_BRICK_WALL_Y = 5;

var BNB_LEFT_WALL_X = -10;
var BNB_RIGHT_WALL_X= 10;

var MAX_BALL_SPEED = 10;

var NO_COLLISION = -1;

var BNB_BRICK_OFF = 0;
var BNB_BRICK_ON = 1;

var BALL_OFF = 0;
var BALL_ON = 1;

	// some possible game states:
var BNB_GAME_MODE_INIT 			= 0;
var BNB_GAME_MODE_TRANSITION	= 1;	// mode for transitions between states.
var BNB_GAME_MODE_TITLE_SCREEN 	= 2;
var BNB_GAME_MODE_INIT_GAME 	= 3;
var BNB_GAME_MODE_START_GAME 	= 4;
var BNB_GAME_MODE_MAIN_LOOP 	= 5;
var BNB_GAME_MODE_PAUSE 		= 6;
var BNB_GAME_MODE_END_LIFE 		= 7;
var BNB_GAME_MODE_SHOW_HISCORES	= 8;
var BNB_GAME_MODE_RESTART_GAME	= 9;

	// -----
	// Ball Structure
	// ----

function BallStruct()
{
	var state;	// BALL_ON BALL_OFF
	var x;
	var y;
	var vx;
	var vy;
	var radius;
	
		// AABB
	var left;
	var right;
	var top;
	var bottom;
}

BallStruct.prototype.calcAABB = function(dt)
{
		// calculate axis aligned bounding box for ball.

	var left;
	var right;
	var top;
	var bottom;
	var x0;
	var y0;
	var x1;
	var y1;

	var dx;
	var dy;

	left = this.x - this.radius;
	right = this.x + this.radius;
	top = this.y - this.radius;
	bottom = this.y + this.radius;

	dx = this.vx * dt;
	dy = this.vy * dt;
	
	if (dx < 0)
	{
		left += dx;
	}
	if (dx > 0)
	{
		right += dx;
	}
	if (dy < 0)
	{
		top += dy;
	}
	if (dy > 0)
	{
		bottom += dy;
	}

	this.left = left;
	this.right = right;
	this.top = top;
	this.bottom = bottom;
}

	// -----
	// Brick Struct
	// -----

function BrickStruct()
{
	this.state = BNB_BRICK_OFF;
	this.x;
	this.y;
	this.width = BRICK_WIDTH;
	this.height = BRICK_HEIGHT;
	this.number_of_hits_required;
	this.red = 1;
	this.green = 1;
	this.blue = 1;
	
		// AABB
	this.left;
	this.right;
	this.top;
	this.bottom;
};

BrickStruct.prototype.calcAABB = function(dt)
{
	// for now, bricks cannot rotate or move, so this is 
	// straightforward to do.
	
	this.left = this.x;
	this.right = this.x + this.width;
	this.top = this.y;
	this.bottom = this.y + this.height;
}

	// --- 
	// player struct
	// ---

function PlayerStruct()
{
	var flags;
	var x;
	var y;
	var bat_width;
	var score;
}

	// =========================
	//     global variables.
	// =========================
	
var BNB_GameMode;
var BNB_NextState;


var Bricks = [];
var Balls = [];

var BatX;
var Baty;

var num_players = 1;
var num_balls = 1;

var Player = [];

function InitLevel (level_number)
{
	/*
	console.log ("batnball.js : init level");
	var i;
	var r;
	var c;
	
	var ox;
	var oy;
	
	for (i = 0; i < Bricks.length; i++)
	{
		Bricks[i].flags = BRICK_NOT_USED;
	}
	
	i = 0;
	ox = 0;
	oy = 0;

	for (r = 0; r < NUM_ROWS; r++)
	{
		for (c = 0; c < NUM_COLUMNS; c++)
		{
			if (i == Bricks.length)
			{
				Bricks[i] = new BrickStruct();
			}
			Bricks[i].x = ox + (c * BRICK_WIDTH);
			Bricks[i].y = oy + (r * BRICK_HEIGHT);
			Bricks[i].number_of_hits_required = 1;
			Bricks[i].width = BRICK_WIDTH;
			Bricks[i].height= BRICK_HEIGHT;
			Bricks[i].red = 255;
			Bricks[i].green = 255;
			Bricks[i].blue = 255;
			i++;
		}
	}
	 */
}

function BrickBallCollisionTime(brick_number, ball_number, dt)
{
	// .. checks to see if the balls movement path will collide with 
	// the stationary rectangular brick. Not skimping on the maths
	// so that the collisions can be reasonably accurate.

	// first check aabb 
	
	var brick;
	var ball;
	var c;
	var r;

	var x0;
	var y0;
	var x1;
	var y1;
	
	c = new CollisionObject();

	brick = Bricks [brick_number];
	ball = Balls[ball_number];

	x0 = brick.x;
	y0 = brick.y;
	x1 = x0 + brick.width;
	y1 = y0 + brick.height;
	
	r = c.overlapAABB (x0,y0,x1,y1, ball.left, ball.right, ball.top, ball.bottom);
	if (r == false)
	{
		return NO_COLLISION;
	}
}

function BNB_MovePlayerLeft(player_number)
{
}

function BNB_MovePlayerRight(player_number)
{
}

function BNB_InitBricks (level)
{
	// for now, all bricks for all levels are the same starting
	// position.. THIS WILL CHANGE.

		console.log ("init bricks");
	var ox;
	var oy;
	var r;
	var c;
	var i;
	
	for (i = 0; i < Bricks.length; i++)
	{
		Bricks[i].status = BNB_BRICK_OFF;
	}

	ox = -((BNB_NUM_COLUMNS-1) * BNB_BRICK_WIDTH) / 2;
	oy = BNB_BRICK_WALL_Y;
	i = 0;
	for (r = 0; r < BNB_NUM_ROWS; r++)
	{
		for (c = 0; c < BNB_NUM_COLUMNS; c++)
		{
			if (i == Bricks.length)
			{
				Bricks[i] = new BrickStruct();
			}
			Bricks[i].state = BNB_BRICK_ON;
			Bricks[i].x = ox + (c * BNB_BRICK_WIDTH);
			Bricks[i].y = oy + (r * BNB_BRICK_HEIGHT);
			Bricks[i].number_of_hits_required = 1;
			Bricks[i].width = BNB_BRICK_WIDTH;
			Bricks[i].height= BNB_BRICK_HEIGHT;
			Bricks[i].red = 255;
			Bricks[i].green = 255;
			Bricks[i].blue = 255;
			i++;
		}
	}
}

function BNB_InitBalls()
{
	// for now.. just 1 balls

	var i;

	for (i = 0; i < Balls.length; i++)
	{
		Balls[i] = BALL_OFF;
	}

	i = 0;
//	while (i < 3)
	{
		if (i == Balls.length)
		{
			Balls[i] = new BallStruct();
		}

		Balls[i].state = BALL_ON;
		Balls[i].x = 0;	//-3 + (i * 3);
		Balls[i].y = -3;
		Balls[i].vx = 0;
		Balls[i].vy = 0;
		Balls[i].radius = 0.25;
		i++;
	}
}

function BNB_SetTransition(next_state)
{
	BNB_NextState = next_state;
	BNB_GameMode = BNB_GAME_MODE_TRANSITION;
}

function BNB_InitGame()
{
	console.log ("BNB_InitGame");
	var i;

	for (i = 0; i < num_players; i++)
	{
		if (i == Player.length)
		{
			Player[i] = new PlayerStruct();
		}
		Player[i].flags = 0;
		Player[i].x = 0;
		Player[i].y = BNB_PLAYER_Y;
		Player[i].bat_width = DEFAULT_BAT_WIDTH;
		Player[i].score = 0;
	}
	
	BatX = 0;
	BatY = -5;
	
	BNB_InitBricks (0);
	BNB_InitBalls();
	BNB_SetTransition (BNB_GAME_MODE_START_GAME);
}

function BNB_Transition()
{
	// for now, just go straight to next state
	BNB_GameMode = BNB_NextState;
}

	// ========================================
	//		Public Facing Routines
	// ========================================

function BNB_DoGame (dt)
{
	switch (BNB_GameMode)
	{
		case BNB_GAME_MODE_INIT :
				break;
		case BNB_GAME_MODE_TRANSITION:
				BNB_Transition();
				break;
		case BNB_GAME_MODE_TITLE_SCREEN:
				break;
		case BNB_GAME_MODE_INIT_GAME:
				BNB_InitGame();
				break;
		case BNB_GAME_MODE_START_GAME:
				break;
		case BNB_GAME_MODE_MAIN_LOOP:
				break;
		case BNB_GAME_MODE_PAUSE:
				break;
		case BNB_GAME_MODE_END_LIFE:
				break;
		case BNB_GAME_MODE_SHOW_HISCORES:
				break;
		case BNB_GAME_MODE_RESTART_GAME:
				break;
		default:
				console.log ("BNB_DoGame: Unknown game state " + BNB_GameMode);
				break;
	}
}

function BNB_Init()
{
		// call here to do one time initialisations to set up
		// all the data + structures required
		
	BNB_GameMode = BNB_GAME_MODE_INIT_GAME;
}
