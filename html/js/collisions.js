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

function CollisionObject()
{

	// collision result stuff.
	this.info;

	this.x;		// (x,y) = collision point
	this.y;

	this.u;		// for parametric stuff
	this.v;
	
	this.t1;	// for ray-casting results.
	this.t2;
}

CollisionObject.prototype.overlapAABB = function (left1,right1,top1,bottom1, left2,rigth2,top2,bottom2)
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

CollisionObject.prototype.lineIntersectionTest = function (ax0,ay0,ax1,ay1, bx0,by0,bx1,by1)
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
		this.info = INFO_PARALLEL_LINES;
		return;
	}

		//	na = (x4-x3)(y1-y3)-(y4-y3)(x1-x3)
	na = ((bx1-bx0)*(ay0-by0)) - ((by1-by0)*(ax0-bx0));
		
		// nb = (x2-x1)(y1-y3)-(y2-y1)(x1-x3) 
	nb = ((ax1-ax0)*(ay0-by0)) - ((ay1-ay0)*(ax0-bx0));
		
	if ((na == 0.0) && (nb == 0.0))
	{
			// lines overlap ??? .. coincident ???
		this.info = INFO_OVERLAPPING_LINES;
		return;
	}

	ua = na/denom;
	ub = nb/denom;
	
	this.u = ua;
	this.v = ub;

	this.info = INFO_OUTSIDE_SEGMENT;

	if ((0.0 <= ua) && (ua <= 1.0))
	{
		if ((0.0 <= ub) && (ub <= 1.0))
		{
			// calculate intersection point.
			this.x = ax0 + (ua*(ax1-ax0));
			this.y = ay0 + (ua*(ay1-ay0));
			this.info = INFO_LINES_INTERSECT;
		}
	}
}

CollisionObject.prototype.squaredDistancePointToLine = function (px,py, x0,y0,x1,y1)
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

	this.u = u;

    this.x = x0 + (u*(x1-x0));
	this.y = y0 + (u*(y1-y0));

	dx = this.x - px;
	dy = this.y - py;

	dist_squared = (dx*dx)+(dy*dy);
	
	return dist_squared;

//	return Math.sqrt(dist_squared);
}

CollisionObject.prototype.rayCircleIntersection = function (cx,cy,r, x0,y0,dx,dy)
{
	// calculates the nearest point starting at (x0,y0)
	// in the direction (dx,dy) to the circle (cx,cy,cr)

	// calculates the nearest intersection point of a circle
	// and a ray.
	
	// http://paulbourke.net/geometry/circlesphere/
	
	// this version copied from my old ray tracing code.
	

//	function RayCast (ox,oy, dx,dy, cx,cy,r)
//{
		// does ray cast from point to a circle (2D)

	var ray_origin_x;
	var ray_origin_y;
	var dx;
	var dy;
	var x_minus_cx;
	var y_minus_cy;
	var radius_squared;
	var A;
	var B;
	var C;
	var b_squared;
	var four_a_c;
	var one_over_2_A;
	var square_root_part;
	var t1;
	var t2;

	ray_origin_x = x0;	//(float)point_x;
	ray_origin_y = y0;	//(float)point_y;

//	dx = (float)-c->distance_to_move_x;
//	dy = (float)-c->distance_to_move_y;

	x_minus_cx = ray_origin_x - cx;
	y_minus_cy = ray_origin_y - cy;

	radius_squared = (r * r);

	A = (dx*dx) + (dy*dy);	// + (dz * dz);

	if ((2 * A) == 0)
	{
		// collision not possible
		this.info = INFO_NO_COLLISION;
		return false;
	}

	B = 2 * ((dx * (x_minus_cx)) + (dy * (y_minus_cy)));	// + (dz * (z_minus_cz));

	C = (x_minus_cx * x_minus_cx) +
		(y_minus_cy * y_minus_cy) +
		- radius_squared;

	b_squared = (B * B);
	four_a_c = 4 * A * C;
	if (b_squared < four_a_c)
	{
		// no collision as no solutions to quadratic.
		this.info = INFO_NO_COLLISION;
		return false;
	}

	one_over_2_A = 1 / (2 * A);

	square_root_part = b_squared - four_a_c;
	square_root_part = Math.sqrt (square_root_part);
	
	t1 = (-B + square_root_part) * one_over_2_A;
	t2 = (-B - square_root_part) * one_over_2_A;

//	result.t1 = t1;
//	result.t2 = t2;
		// select the value of t nearest to the ray's origin.
	if (t2 < t1)
	{
		t1 = t2;
	}

	this.t1 = t1;
	return true;
}

CollisionObject.prototype.circleLineCollision = function (cx,cy,cr, vx, vy, dt, x0,y0,x1,y1)
{
	// does a collision test between a circle (cx,cy,cr) moving
	// in direction (vx,vy) for dt seconds
	// with a stationary line (x0,y0) to (x1,y1)
	
	// assumes AABB test has already been done.

	// first need to find collision point on circle. To do this
	// need to use point distance to line calculation.
	
	var dx;
	var dy;
	var d;
	var cpx;
	var cpy;
	
	var x2;
	var y2;
	var x3;
	var y3;
	
	var t1;
	var t2;
	var r1;
	var r2;

	this.squaredDistancePointToLine (cx,cy, x0,y0,x1,y1);
	dx = this.x - cx;
	dy = this.y - cy;
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

	this.lineIntersectionTest (x0,y0,x1,y1, x2,y2,x3,y3)
	
	if (this.info == INFO_LINES_INTERSECT)
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
	
	// note the velocity vector is reversed as from end point towards
	// the circle 
	r1 = this.rayCircleIntersection (cx,cy,cr, x0,y0,-vx,-vy);
	r2 = this.rayCircleIntersection (cx,cy,cr, x1,y1,-vx,-vy);

}


function Geom_RayReflection (px,py, vx,vy, x0,y0,x1,y1, result)
{
	// vector reflection - calculates the result of a ray from
	// point (px,py) in the direction (vx,vy),
	// colliding with a line (x0,y0)->(x1,y1)
	
	// https://www.fabrizioduroni.it/2017/08/25/how-to-calculate-reflection-vector.html
	// https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
	
	//  d\   ^   /r
	//    \  n  /
	//     \ | /
	//      \|/
	// -------------->

	// r = d - 2(d.n)n						-2 (n.v)n-v)
	
	// need to find distance, point to line 
	
	var r;
	var nx;
	var ny;
	var d;
	var d_dot_n;
	
	r = new Geom_Result();

		// calculate n and normalise it.
	Geom_DistancePointToLine (px,py, x0,y0,x1,y1, r);

	console.log (r);
	nx = r.x - px;
	ny = r.y - py;

	d = Math.sqrt ((nx*nx)+(ny*ny));
	if (d == 0)
	{
		// ray is on line.. can't reflect 
		result.error = GEOM_ERROR_POINT_ON_LINE;
		return;
	}
	nx /= d;
	ny /= d;
	
	result.u = nx;
	result.v = ny;
	
		// r = d-2(d.n)n
	d_dot_n = (vx * nx) + (vy * ny);
	result.x = vx - (2 * d_dot_n * nx);
	result.y = vy - (2 * d_dot_n * ny);
}
