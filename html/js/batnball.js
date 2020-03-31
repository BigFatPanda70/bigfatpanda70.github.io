/*
	Title	:	Javascript Bat and ball game.
	
	Info	:	Version 0.0	23rd March 2020
	
	Author	:	Nick Fleming
	
	Updated	:	28th March 2020
	
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

	 28th march 2020
	-----------------
		Still under lockdown .. virus peak expected within the
	next 14 days or so. 
	
		Hopefully, today is the day that I get proper brick-ball
	collision detection working correctly, rather than the very
	crude aabb checks currently in place.

	 To Use :
	----------
		Call BNB_Init() to do one time initialisations.
		Call BNB_DoGame (dt) to run the game for dt seconds.
*/

	// === constants ===

//var DEFAULT_BAT_WIDTH = 64;
var BNB_BAT_WIDTH = 3;
var BNB_BAT_HEIGHT = 0.5;

var BNB_BRICK_HEIGHT = 1.8;
var BNB_BRICK_WIDTH = 1.5;
var BAT_WIDTH = 2;
var BALL_RADIUS = 0.25;

var BNB_PLAYER_Y = -4.5;

var BNB_NUM_ROWS = 6;
var BNB_NUM_COLUMNS = 12;
var BNB_BRICK_WALL_Y = 5;

var BNB_LEFT_WALL_X = -9;
var BNB_RIGHT_WALL_X= 9;
var BNB_TOP_WALL_Y = 19.5;

var MAX_BALL_SPEED = 0.3;

var PLAYER_SPEED = 0.2;

var NO_COLLISION = -1;

var BNB_BRICK_OFF = 0;
var BNB_BRICK_ON = 1;
var BNB_BRICK_EXPLODING = 2;		// lets destroy the bricks creatively !!

var BNB_EXPLOSION_TIME = 50;

var BALL_OFF = 0;
var BALL_ON = 1;

var PLAYER_OFF = 0;
var PLAYER_ON = 1;

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
	top = this.y + this.radius;
	bottom = this.y - this.radius;

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
	
	this.exploding = 0;
	
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
	
	this.left = this.x - (this.width/2);
	this.right = this.left + this.width;
	this.top = this.y + (this.height/2);
	this.bottom = this.top - this.height;
}

	// --- 
	// player struct
	// ---

function PlayerStruct()
{
	this.state;
	this.flags;
	this.x;
	this.y;
	this.vx;
	this.vy;
	this.bat_width;
	this.score;
	
		// AABB.
	this.left;
	this.right;
	this.top;
	this.bottom;
}

PlayerStruct.prototype.calcAABB = function (dt)
{
	// assume bat not moving for aabb calculations.

	this.left = this.x - (this.bat_width / 2);
	this.right= this.left + this.bat_width;
	this.top = this.y + (this.bat_height/2);
	this.bottom = this.top - this.bat_height;
}

	// =========================
	//     global variables.
	// =========================
	
var BNB_GameMode;
var BNB_NextState;


var Bricks = [];
var Balls = [];

//var BatX;
//var Baty;

var num_players = 1;
var num_balls = 1;

var Player = [];

function InitLevel (level_number)
{
}


function BNB_MoveBalls(dt)
{
	var i;
	var x;
	var y;
	var vx;
	var vy;
	
	var left;
	var right;
	var ball_width;

	var	left_wall_x;
	var right_wall_x;
	
	ball_width = 0.25;
	
	
	left_wall_x = BNB_LEFT_WALL_X;
	right_wall_x = BNB_RIGHT_WALL_X;
	
	for (i = 0; i < Balls.length; i++)
	{
		Balls[i].calcAABB(dt);
		x = Balls[i].x;
		y = Balls[i].y;
		
		vx = Balls[i].vx;
		vy = Balls[i].vy;
		
		x += vx;
		y += vy;
		
		if (y < -6)		{	vy *= -1;	}			// test code to stop ball disappearing off the bottom

		if (y > BNB_TOP_WALL_Y)
		{
			y = BNB_TOP_WALL_Y;
			vy *= -1;
		}
		
		left = x - (ball_width/2);
		right = left + ball_width;

		if (left <= left_wall_x)
		{
			x = left_wall_x + (ball_width/2);
			vx *= -1;
		}
		if (right >= right_wall_x)
		{
			x = right_wall_x - ball_width;
			vx *= -1;
		}
		
		Balls[i].x = x;
		Balls[i].y = y;
		Balls[i].vx = vx;
		Balls[i].vy = vy;
	}
}

function BNB_CalcAABBs (dt)
{
	var i;
	
	for (i = 0; i < Player.length; i++)
	{
		Player[i].calcAABB(dt);
	}
	for (i = 0; i < Balls.length; i++)
	{
		Balls[i].calcAABB(dt);
	}
}

function BNB_PlayerBallCollision (p,b,dt)
{
	var c;

	var r;

	var x0;
	var y0;
	var x1;
	var y1;
	
	var x2;
	var y2;
	var x3;
	var y3;
	

	c = new CollisionObject();

	x0 = Player[p].left;
	y0 = Player[p].top;
	x1 = Player[p].right;
	y1 = Player[p].bottom;

	x2 = Balls[b].left;
	y2 = Balls[b].top;
	x3 = Balls[b].right;
	y3 = Balls[b].bottom;
	
	r = c.overlapAABB(x0,y0,x1,y1,  x2,y2,x3,y3);
	if (r == false)
	{
		return false;
	}
	return true;
}

function BNB_PlayerBallCollisionTests (dt)
{
	// just doing AABB collisions for bat and ball.
	// .. hopefully making things more playable by giving the player
	// as much bat to er..bat with.

	var p;
	var b;

	var vx;
	var inc_v;

	for (p = 0; p < Player.length; p++)
	{
		if (Player[p].state == PLAYER_ON)
		{
			for (b = 0; b < Balls.length; b++)
			{
				if (Balls[b].state == BALL_ON)
				{
					// test collision between player p and ball b
					r = BNB_PlayerBallCollision (p,b,dt);
					if (r == true)
					{
						// collision occurred, do collision response.
						Balls[b].vy  = -Balls[b].vy;
						if (Player[p].vx != 0)
						{
							// if player is moving, adjust the balls horizontal velocity 
							vx = Balls[b].vx;
							inc_v = 0;
							if (Player[p].vx < 0)
							{
								inc_v = -0.05;
							}
							if (Player[p].vx > 0)
							{
								inc_v = 0.05;
							}
							vx += inc_v;
							if (vx > MAX_BALL_SPEED)
							{
								vx = MAX_BALL_SPEED;
							}
							if (vx < (-MAX_BALL_SPEED))
							{
								vx = -MAX_BALL_SPEED;
							}
							Balls[b].vx = vx;
						}
					}
				}
			}
		}
	}
}

var tibbs = 0;
function BNB_BallBrickCollisionTime (ball_idx, brick_idx, dt)
{
		// there are 8 collisions to test for
		// 4 corners and 4 sides.
		
		// this seems like complete overkill..
	
		// *** UNDER CONSTRUCTION **

	var ct = [-1,-1,-1,-1,-1,-1,-1,-1];	// 4 walls, 4 points.
	var top;
	var left;
	var right;
	var bottom;
	var c;
	
	var i;
	var x0;
	var y0;
	var x1;
	var y1;
	
	var cx;
	var cy;
	var cr;
	var vx;
	var vy;
	
	var ball;
	var brick;
	
	var r;
	
	var nearest;
	var nearest_idx;

	c = new CollisionObject();
	
	ball = Balls[ball_idx];
	
	cx = ball.x;
	cy = ball.y;
	cr = ball.radius;
	vx = ball.vx;
	vy = ball.vy;

	if (tibbs == 0)
	{
		console.log ("BALL");
		console.log (ball);
		console.log ("cx==:" + cx + " cy==:" + cy);
	}

	brick = Bricks[brick_idx];

	x0 = brick.x - (brick.width/2);
	x1 = x0 + brick.width;

	y0 = brick.y + (brick.height/2);
	y1 = y0 - brick.height;
	
	if (tibbs == 0)
	{
		console.log ("BRICK");
		console.log (brick_idx);
		console.log ("y : " + brick.y + " h/2:" + (brick.height/2));
		console.log ("x0:" + x0 + " y0" + y0 + " x1:" + x1 + " y1:" + y1);
		console.log (brick);
		tibbs = 1;
	}


/*	r = c.circleLineCollision (cx,cy,cr, vx, vy, dt, x0,y0,x1,y0);		// check top
	if (r == true)
	{
		if (ct <= dt)
		{
			ct[0] = c.t;
		}
	}
	
	r = c.circleLineCollision (cx,cy,cr, vx, vy, dt, x1,y0,x1,y1);	// check right
	if (r == true)
	{
		if (ct <= dt)
		{
			ct[1] = c.t;
		}
	}
*/
	r = c.circleLineCollision (cx,cy,cr, vx, vy, dt, x0,y1,x1,y1);	// check bottom
	if (r == true)
	{
		brick.state = BNB_BRICK_EXPLODING;
		brick.exploding = BNB_EXPLOSION_TIME;
		if (ct <= dt)
		{
			ct[2] = c.t;
		}
	}
/*	r = c.circleLineCollision (cx,cy,cr, vx, vy, dt, x0,y0,x0,y1);	// check left
	if (r == true)
	{
		if (ct <= dt)
		{
			ct[3] = c.t;
		}
	}
*/	
	if ((ct[0] == -1) && (ct[1] == -1) && (ct[2] == -1) && (ct[3] == -1))
	{
		return;	// not colliding
	}

	nearest = dt;
	nearest_idx = -1;
	for (i = 0; i < 4; i++)
	{
		if (ct[i] != -1)
		{
			if (ct[i] <= nearest)
			{
				nearest = ct[i];
				nearest_idx = i;
			}
		}
	}
	
	if (nearest_idx == -1)
	{
		// gone wrong somewhere ???
		return;
	}
	
	// for now.. assume axis aligned walls for easy reflection.
	switch (nearest_idx)
	{
		case 0:		ball.vy *= -1;  break;
		case 1:		ball.vx *= -1;	break;
		case 2:		ball.vy *= -1;	break;
		case 3:		ball.vx *= -1;	break;
	}

	brick.state = BNB_BRICK_EXPLODING;
	brick.exploding = BNB_EXPLOSION_TIME;
}

function BNB_BrickBallCollided (s,b,dt)
{
	// returns true if their AABB area collide, false otherwise.
	var r;
	var c;
	var x0;
	var y0;
	var x1;
	var y1;
	var x2;
	var y2;
	var x3;
	var y3;
	
	x0 = Bricks[s].left;
	y0 = Bricks[s].top;
	x1 = Bricks[s].right;
	y1 = Bricks[s].bottom;
	
	x2 = Balls[b].left;
	y2 = Balls[b].top;
	x3 = Balls[b].right;
	y3 = Balls[b].bottom;
	
	
	var ox;
	var oy;
	var s;
	s = 20;
	ox = 250;
	oy = 200;
	Ctx.beginPath();
	Ctx.strokeStyle = "#ff0000";
	Ctx.moveTo (ox + (x0*s), oy - (y0*s));
	Ctx.lineTo (ox + (x1*s), oy - (y0*s));
	Ctx.lineTo (ox + (x1*s), oy - (y1*s));
	Ctx.lineTo (ox + (x0*s), oy - (y1*s));
	Ctx.lineTo (ox + (x0*s), oy - (y0*s));
	Ctx.stroke();

	Ctx.beginPath();
	Ctx.strokeStyle = "#ff00ff";
	Ctx.moveTo (ox + (x2*s), oy - (y2*s));
	Ctx.lineTo (ox + (x3*s), oy - (y2*s));
	Ctx.lineTo (ox + (x3*s), oy - (y3*s));
	Ctx.lineTo (ox + (x2*s), oy - (y3*s));
	Ctx.lineTo (ox + (x2*s), oy - (y2*s));
	Ctx.stroke();
	

	
	
	c = new CollisionObject();
	
	

	r = c.overlapAABB (x0,y0,x1,y1, x2,y2,x3,y3);
	if (r == false)
	{
		return false;
	}
	
	// aabb collision.. so now need to do more detailed checks.
	
	
	return true;
}

var gggk = 0;
function BNB_BrickBallCollisions(dt)
{
	var s;
	var b;
	var r;

	for (s = 0; s < Bricks.length; s++)
	{
		if (Bricks[s].state == BNB_BRICK_ON)
		{
			for (b = 0; b < Balls.length; b++)
			{
				if (Balls[b].state == BALL_ON)
				{
					r = BNB_BrickBallCollided(s,b,dt);
					if (r == true)
					{
							// need to do some more checks.
						BNB_BallBrickCollisionTime (b,s,dt);
//						Bricks[s].state = BNB_BRICK_EXPLODING;
//						Bricks[s].exploding = BNB_EXPLOSION_TIME;
//						Balls[b].vy *= -1;
					}
				}
			}
		}
	}
}

function BNB_ExplodeBricks()
{
	var i;

	for (i = 0; i < Bricks.length; i++)
	{
		if (Bricks[i].state == BNB_BRICK_EXPLODING)
		{
			Bricks[i].exploding--;
			if (Bricks[i].exploding < 1)
			{
				Bricks[i].exploding = 0;
				Bricks[i].state= BNB_BRICK_OFF;
			}
		}
	}
}

function BNB_MovePlayer(player_number)
{
	var bat_left;
	var left_wall_x;
	var bat_right;
	var right_wall_x;
	var bat_width;
	var i;
	var x;
	var vx;

	i = player_number;
	
	x = Player[i].x;
	vx = Player[i].vx;
	bat_width = Player[i].bat_width;
	x += vx;

	left_wall_x = BNB_LEFT_WALL_X;
	right_wall_x = BNB_RIGHT_WALL_X;
	
	bat_left = x - (bat_width/2);
	bat_right = bat_left + bat_width;
	if (bat_left < left_wall_x)
	{
		x = left_wall_x + (bat_width/2);
	}
	if (bat_right > right_wall_x)
	{
		x = right_wall_x - (bat_width/2);
	}
	vx = 0;

	Player[i].x = x;
	Player[i].vx = vx;
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
	
	// test value.
	i = 0;
	Bricks
	if (i == Bricks.length)
	{
		Bricks[i] = new BrickStruct();
	}
	Bricks[i].state = BNB_BRICK_ON;
	Bricks[i].x = 0;
	Bricks[i].y = 4;
	Bricks[i].number_of_hits_required = 1;
	Bricks[i].width = BNB_BRICK_WIDTH;
	Bricks[i].height= BNB_BRICK_HEIGHT;
	Bricks[i].red = 255;
	Bricks[i].green = 255;
	Bricks[i].blue = 255;
			
	Bricks[i].exploding = 0;
			
	Bricks[i].calcAABB(0);

	return;

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
			
			Bricks[i].exploding = 0;
			
			Bricks[i].calcAABB(0);
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
	
	
	// test values
	i = 0;
	if (i == Balls.length)
	{
			Balls[i] = new BallStruct();
	}

	Balls[i].state = BALL_ON;
	Balls[i].x = 0;
	Balls[i].y = 0;
	Balls[i].vx = 0
	Balls[i].vy = +0.005
	Balls[i].radius = 0.25;
	return;

	i = 0;
	while (i < 2)
	{
		if (i == Balls.length)
		{
			Balls[i] = new BallStruct();
		}

		Balls[i].state = BALL_ON;
		Balls[i].x = -5 + (i * 3);
		Balls[i].y = 14;
		Balls[i].vx = Math.random() * 0.1;
		Balls[i].vy = -0.4 + (Math.random() * 0.8);
		Balls[i].radius = 0.25;
		i++;
	}
}

function BNB_InitPlayers()
{
	var i;

	for (i = 0; i < num_players; i++)
	{
		if (i == Player.length)
		{
			Player[i] = new PlayerStruct();
		}
		Player[i].state = PLAYER_ON;
		Player[i].flags = 0;
		Player[i].x = 0;
		Player[i].y = BNB_PLAYER_Y;
		Player[i].vx = 0;
		Player[i].vy = 0;
		Player[i].bat_width = BNB_BAT_WIDTH;
		Player[i].bat_height= BNB_BAT_HEIGHT;
		Player[i].score = 0;
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
	
	BNB_InitPlayers();
	BNB_InitBricks (0);
	BNB_InitBalls();
	BNB_SetTransition (BNB_GAME_MODE_START_GAME);
}

function BNB_Transition()
{
	// for now, just go straight to next state
	BNB_GameMode = BNB_NextState;
}

function BNB_StartGame()
{
	BNB_SetTransition (BNB_GAME_MODE_MAIN_LOOP);
}

function BNB_DoMainLoop(dt)
{
	var i;

	BNB_CalcAABBs(dt);	// init aabb's for collision checks.

		// do collision tests first, to use players velocity.
	BNB_PlayerBallCollisionTests (dt);
	
	for (i = 0; i < Player.length; i++)
	{
		BNB_MovePlayer(i);
	}
	
	BNB_BrickBallCollisions(dt);

	BNB_MoveBalls(dt);
	
	BNB_ExplodeBricks();
}
	// ========================================
	//		Public Facing Routines
	// ========================================
	
function BNB_LeftPressed (player_number)
{
	Player[player_number].vx = -PLAYER_SPEED;
}

function BNB_RightPressed (player_number)
{
	Player[player_number].vx = PLAYER_SPEED;
}

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
				BNB_StartGame();
				break;
		case BNB_GAME_MODE_MAIN_LOOP:
				BNB_DoMainLoop(dt);
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

