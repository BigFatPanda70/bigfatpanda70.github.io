/*
	Title	:	Javascript Bat and ball game.
	
	Info	:	Version 0.0	23rd March 2020
	
	Author	:	Nick Fleming
	
	Updated	:	23rd March 2020
	
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


*/

var DEFAULT_BAT_WIDTH = 64;
var BRICK_HEIGHT = 16;
var BRICK_WIDTH = 32;

var NUM_ROWS = 5;
var NUM_COLUMNS = 10;

var MAX_BALL_SPEED = 10;

var BRICK_NOT_USED = -1;

var NO_COLLISION = -1;

	// -----
	// Ball Structure
	// ----

function BallStruct()
{
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

BallStruct.prototype.calcAABB(dt)
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
	this.flags = BRICK_NOT_USED;
	this.x;
	this.y;
	this.width;
	this.height;
	this.number_of_hits_required;
	this.red;
	this.green;
	this.blue;
	
		// AABB
	this.left;
	this.right;
	this.top;
	this.bottom;
};

BrickStruct.prototype.calcAABB(dt)
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

function PlayerStruct
{
	var flags;
	var x;
	var y;
	var bat_width;
	var score;
}

var Bricks = [];
var Balls = [];

var num_players = 1;
var num_balls = 1;

var Player = [];

function InitLevel (level_number)
{
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
			Bricks[i].heigth= BRICK_HEIGHT;
			Bricks[i].red = 255;
			Bricks[i].green = 255;
			Bricks[i].blue = 255;
		}
	}
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


function MovePlayerLeft(player_number)
{
}

function MovePlayerRight(player_number)
{
}



function InitGame (num_players)
{
	var i;
	
	for (i = 0; i < num_players; i++)
	{
		if (i == Player.length)
		{
			Player[i] = new PlayerStruct();
		}
		Player[i].flags = 0;
		Player[i].x = 0;
		Player[i].y = 0;
		Player[i].bat_width = DEFAULT_BAT_WIDTH;
		Player[i].score = 0;

	}
	
}
