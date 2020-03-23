/*

Title	:	Basic Collision detection stuff

Info	;	Version 0.0	23rd March 2020

Author	;	Nick Fleming

Updated	:	23rd March 2020


	 Notes:
	---------
	"Basic" 2D collision detection .. well.. possibly medium
	level .. not quite using calculus yet.

*/

var INFO_LINES_INTERSECT = 0;
var INFO_PARALLEL_LINES = 1;
var INFO_OVERLAPPING_LINES = 2;
var INFO_OUTSIDE_SEGMENT = 3;

var INFO_COLLISION = 4;
var INFO_NO_COLLISION = 5;

function Result()
{
	this.info;

	this.x;		// (x,y) = collision point
	this.y;

	this.u;		// for parametric stuff
	this.v;
}

function overlapAABB (left1,right1,top1,bottom1, left2,rigth2,top2,bottom2)
{
		// returns true if there is an overlap
	if (right1 < left2)
	{
		return false;
	}
	if (right2 < left1)
	{
		return false;
	}
	if (top1 > bottom2)
	{
		return false;
	}
	if (top2 > bottom1)
	{
		return false;
	}
	return true;
}

function LineIntersectionTest (ax0,ay0,ax1,ay1, bx0,by0,bx1,by1, result)
{
	// 2D line intersection test.
	// http://www-cs.ccny.cuny.edu/~wolberg/capstone/intersection/Intersection%20point%20of%20two%20lines.html
	
	// returns result structure indicating the values where on the line the points cross

	var ua;
	var ub;

	var denom;
	var na;
	var nb;

			//		denom = (y4-y3)(x2-x1)-(x4-x3)(y2-y1)
	denom = ((by1-by0)*(ax1-ax0)) - ((bx1-bx0)*(ay1-ay0));

	if (denom == 0.0)
	{
			// lines are parallel, return 'infinity' value ??
		result.info = INFO_PARALLEL_LINES;
		return;
	}

		//	na = (x4-x3)(y1-y3)-(y4-y3)(x1-x3)
	na = ((bx1-bx0)*(ay0-by0)) - ((by1-by0)*(ax0-bx0));
		
		// nb = (x2-x1)(y1-y3)-(y2-y1)(x1-x3) 
	nb = ((ax1-ax0)*(ay0-by0)) - ((ay1-ay0)*(ax0-bx0));
		
	if ((na == 0.0) && (nb == 0.0))
	{
			// lines overlap ??? .. coincident ???
		result.info = INFO_OVERLAPPING_LINES;
		return;
	}

	ua = na/denom;
	ub = nb/denom;
	
	result.u = ua;
	result.v = ub;

	result.info = INFO_OUTSIDE_SEGMENT;

	if ((0.0 <= ua) && (ua <= 1.0))
	{
		if ((0.0 <= ub) && (ub <= 1.0))
		{
			// calculate intersection point.
			result.x = ax0 + (ua*(ax1-ax0));
			result.y = ay0 + (ua*(ay1-ay0));
			result.info = INFO_LINES_INTERSECT;
		}
	}
}

function SquaredDistancePointToLine (px,py, x0,y0,x1,y1, result)
{
		// need to work out the line intersection point / line distance in all cases.
		// http://paulbourke.net/geometry/pointlineplane/

		// result(x,y) is the point on the line.
	var u;
	var dx;
	var dy;
	var dist_squared;

	dx = x1-x0;
	dy = y1-y0;

	dist_squared = (dx*dx)+(dy*dy);
	u = 1.0;
	if (dist_squared != 0.0)
	{
		u = ( ((px-x0)*(x1-x0)) + ((py-y0)*(y1-y0)) ) / dist_squared;
	}

	result.u = u;

    result.x = x0 + (u*(x1-x0));
	result.y = y0 + (u*(y1-y0));

	dx = result.x - px;
	dy = result.y - py;

	dist_squared = (dx*dx)+(dy*dy);
	
	return dist_squared;

//	return Math.sqrt(dist_squared);
}

function RayCircleIntersection (cx,cy,cr, x0,y0,dx,dy)
{
	// calculates the nearest intersection point of a circle
	// and a ray.
	
	// http://paulbourke.net/geometry/circlesphere/
	
	var a;
	var b;
	var c;
	
	// a = (x2 - x1)2 + (y2 - y1)2 + (z2 - z1)2
	// b = 2[ (x2 - x1) (x1 - x3) + (y2 - y1) (y1 - y3) + (z2 - z1) (z1 - z3) ] 
	// c = x32 + y32 + z32 + x12 + y12 + z12 - 2[x3 x1 + y3 y1 + z3 z1] - r2
	
	
}

function CircleLineCollision (cx,cy,cr, vx, vy, dt, x0,y0,x1,y1, result)
{
	// does a collision test between a circle (cx,cy,cr) moving
	// in direction vx,vy for dt seconds
	// with a stationary line x0,y0,x1,y1.
	
	// assumes AABB test has already been done.

	// first need to find collision point on circle. To do this
	// need to use point distance to line calculation.
	
	var result = new Result();
	var dx;
	var dy;
	var d;
	var cpx;
	var cpy;
	
	var x2;
	var y2;
	var x3;
	var y3;

	SquaredDistancePointToLine (cx,cy, x0,y0,x1,y1, result);
	dx = result.x - cx;
	dy = result.y - cy;
	d = Math.sqrt ((dx*dx)+(dy*dy));
	if (d != 0)
	{
		dx /= d;
		dy /= d;
	}

	cpx = cx + (dx * r); 	// (cpx,cpy) = the point on the circle
	cpy = cy + (dy * r);	// that will collide with the line first.
	
		// now need ray-cast a line from (cpx,cpy) to the line to find
		// the point of collision within dt seconds.

	x2 = cpx;
	y2 = cpy;
	x3 = cpx + (vx * dt);
	x4 = cpy + (vy * dt);
	
		// now need to see where lines cross. they have to cross
		// between both end points for a collision to occur.

	LineIntersectionTest (x0,y0,x1,y1, x2,y2,x3,y3, result);
	
	if (result.info == INFO_LINES_INTERSECT)
	{
		// circle will collide with line between line end points
		// within dt seconds.
		
	}

	// ---
	// the circle could still collide the line end points,
	// so this needs to be tested for separately.
	// ---
	// need to ray-cast in a reverse direction to that 
	// of the circle from each line endpoint to see if it
	// passes through the circle.

}
