/*

Title	:	Basic Collision detection stuff

Info	;	Version 0.0	23rd March 2020

Author	;	Nick Fleming

Updated	:	29th March 2020


	 Notes:
	---------
	"Basic" 2D collision detection .. well.. possibly medium
	level .. not quite using calculus yet.

	 29th March 2020
	------------------
Almost done (famous last words!!)


Collision between a point and a line...
need to find the tangent of the circle in the direction of the point,
then use this as the line to calculate the reflection vector.

*/

var INFO_LINES_INTERSECT = 0;
var INFO_PARALLEL_LINES = 1;
var INFO_OVERLAPPING_LINES = 2;
var INFO_OUTSIDE_SEGMENT = 3;
var INFO_RAY_ON_LINE = 4;

var INFO_COLLISION = 4;
var INFO_NO_COLLISION = 5;

function CollisionObject()
{

	// collision result stuff.
	this.info;

	this.x;		// (x,y) = collision point 
	this.y;
	
	this.cpx;	// circle collision point
	this.cpy;

	this.u;		// for parametric stuff
	this.v;
	
	this.t1;	// for ray-casting results.
	this.t2;
	
	this.rx;	// reflection vector
	this.ry;

	this.nearest_endpoint;	// line endpoint nearest collision
	this.t;		// time of collision (could be any value)
}

CollisionObject.prototype.overlapAABB = function (left1,top1,right1,bottom1, left2,top2,right2,bottom2)
{
		// returns true if there is an overlap
		
	// IMPORTANT NOTE : ASSUMES COORDINATES ARE IN WORLD SPACE
	// *NOT* SCREEN SPACE. So TopY > BottomY. 
	
	// modified to allow both screen and world coords.
	
	var y0;
	var y1;
	var y2;
	var y3;
		
	if (right1 < left2)
	{
		return false;
	}
	if (right2 < left1)
	{
		return false;
	}

	y0 = top1;
	y1 = bottom1;
	y2 = top2;
	y3 = bottom2;
	
		// adjust so y0 > y1 is always true for each AABB
	if (y1 > y0)
	{
		y0 = bottom1;
		y1 = top1;
	}
	if (y3 > y2)
	{
		y2 = bottom2;
		y3 = top2;
	}

	if (y1 > y2)	//bottom1 < top2)
	{
		return false;
	}
	if (y3 > y0)	//bottom1 > top2)
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
	
	Ctx.beginPath();
	Ctx.rect (10,10, 10,10);
	Ctx.fill();

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

	Ctx.beginPath();
	Ctx.rect (30,10, 10,10);
	Ctx.fill();


	ua = na/denom;
	ub = nb/denom;
	
	this.u = ua;
	this.v = ub;

	this.info = INFO_OUTSIDE_SEGMENT;

	if ((0.0 <= ua) && (ua <= 1.0))
	{
		if ((0.0 <= ub) && (ub <= 1.0))
		{
				Ctx.beginPath();
				Ctx.rect (50,10, 10,10);
				Ctx.fill();

			
			// calculate intersection point.
			this.x = ax0 + (ua*(ax1-ax0));
			this.y = ay0 + (ua*(ay1-ay0));
			
//			Ctx.beginPath();
//			Ctx.rect (this.x, this.y, 10,10);
//			Ctx.fill();
			
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
	var u1;
	var u2;

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

	this.info = INFO_COLLISION;
	one_over_2_A = 1 / (2 * A);

	square_root_part = b_squared - four_a_c;
	square_root_part = Math.sqrt (square_root_part);
	
	u1 = (-B + square_root_part) * one_over_2_A;
	u2 = (-B - square_root_part) * one_over_2_A;

//	result.t1 = t1;
//	result.t2 = t2;
		// select the value of t nearest to the ray's origin.
	if (u2 < u1)
	{
		u1 = u2;
	}

	this.u = u1;
	return true;
}

var jjkkll = 0;
CollisionObject.prototype.circleLineCollision = function (cx,cy,cr, vx, vy, dt, x0,y0,x1,y1)
{
	// does a collision test between a circle (cx,cy,cr) moving
	// in direction (vx,vy) for dt seconds
	// with a stationary line (x0,y0) to (x1,y1)
	
	// assumes AABB test has already been done.

	// There are TWO circle line collision routines.
	// This one handles a collision within a line segment
	// and a circle. it does NOT handle the endpoint collision checks.
	// Done this way as collision response is different for both
	// cases.

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
	var tc;

		// first need to find collision point on circle. To do this
		// need to use point distance to line calculation.

	this.squaredDistancePointToLine (cx,cy, x0,y0,x1,y1);
	dx = this.x - cx;
	dy = this.y - cy;
	d = Math.sqrt ((dx*dx)+(dy*dy));
	if (d != 0)
	{
		dx /= d;
		dy /= d;
	}

	cpx = cx + (dx * cr); 	// (cpx,cpy) = the point on the circle
	cpy = cy + (dy * cr);	// that will collide with the line first.
	
	this.cpx = cpx;
	this.cpy = cpy;

//	Ctx.beginPath();
//	Ctx.fillStyle="#00f";
//	Ctx.rect (cpx - 3, cpy-3, 5,5);
//	Ctx.fill();

		// now need ray-cast a line from (cpx,cpy) to the line to find
		// the point of collision within dt seconds.

	x2 = cpx;
	y2 = cpy;
	x3 = cpx + (vx * dt);	// * 10);		// NOTE : *10 for testing 
	y3 = cpy + (vy * dt);	// * 10);

	Ctx.beginPath();
	Ctx.moveTo (x2,y2);
	Ctx.lineTo (x3,y3);
	Ctx.stroke();

		// now need to see where lines cross. they have to cross
		// between both end points for a collision to occur.


	this.lineIntersectionTest (x2,y2,x3,y3, x0,y0,x1,y1);
	
	if (jjkkll == 0)
	{
		console.log ("oooooo");
		console.log ("cpx:" + cpx + " cpy:" + cpy + " cx:" + cx + " cy :" + cy + " cr:" + cr);
		console.log ("x0:" + x0 + " y0:" + y0 + " x1:" + x1 + " y1:" + y1);
		console.log ("..");
		console.log ("x2:" + x2 + " y2:" + y2 + " x3:" + x3 + " y3:" + y3);
		jjkkll = 1;
	}


	if (this.info != INFO_LINES_INTERSECT)
	{
		return false;
	}
	
	if (jjkkll == 0)
	{
		console.log ("COLLIIISSSOOONNN");
		jjkkll = 1;
	}
		// lines intersect, so 
	
		// circle will collide with line between line end points
		// within dt seconds.
		
	// (this.x , this.y ) = point of collision on the line.
		
		// time of collision = this.u * dt 
	this.t = this.u * dt;			// untested ????

	this.info = INFO_COLLISION;
	return true;
}

CollisionObject.prototype.circlePointCollision = function (cx,cy,cr, vx,vy, x0,y0)
{
	// test to see if a circle and a point collide.
	// useful test for collisions with line end points.
	// returns true if a collision can occur, and this.t1 is
	// set to the time of collision.

	var r;

	r = this.rayCircleIntersection (cx,cy,cr, x0,y0,-vx,-vy);

	return r;
}

CollisionObject.prototype.circleLineEndCollision = function (cx,cy,cr, vx,vy, dt, x0,y0, x1,y1)
{
		// returns false if no collision is possible, 
		// otherwise returns true and sets t1 to be the collision time
		// and nearest_endpoint to which endpoint is being collided with.
		
		// x,y = line end point of collision.

	var r0;
	var t0;

	var u0;
	var u1;
	
	var dx;
	var dy;

	var m;
	var p;
	
	var x;
	var y;
	
	var uc;	// u at collsion 
	
	r0 = this.circlePointCollision (cx,cy,cr, vx,vy, x0,y0);
	u0 = this.u;
	r1 = this.circlePointCollision (cx,cy,cr, vx,vy, x1,y1);
	u1 = this.u;

	if ((r0 == false) && (r1 == false))
	{
		this.nearest_endpoint = -1;
		return false; 	// no collision possible.
	}

	if ((r0 == true) && (r1 == false))
	{
		x = x0;
		y = y0;
		this.nearest_endpoint = 0;
		uc = u0;
	}

	if ((r0 == false) && (r1 == true))
	{
		x = x1;
		y = y1;
		this.nearest_endpoint = 1;
		uc = u1;
	}

	if ((r0 == true) && (r1 == true))
	{
		x = x0;
		y = y0;
		this.nearest_endpoint = 0;
		uc = u0;
		if (u1 < u0)
		{
			x = x1;
			y = y1;
			this.nearest_endpoint = 1;
			uc = u1;
		}
	}
	
	this.cpx = x + (-vx * uc);
	this.cpy = y + (-vy * uc);
	this.x = x;
	this.y = y;
	this.u = uc;

	if (uc < 0)
	{
		return false;
	}

	// one last check, to see if collision will occur in dt seconds.
	// if a collision occurs, then the distance from line to circle point
	// will be less than or greater than u * V.

	// e.g. distance from line to circle collision point:
	
	// (dt*vx)^2 + (dt*vy)^2
	
	// distance amount u
	// (u*vx)^2 + (u*vy)^2
	
	// so if u < dt, collision will occur.

	if (this.u > dt)
	{
		return false;
	}

	return true;
}


/*
	// ** TO DO **
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
	t1 = this.t1;
	r2 = this.rayCircleIntersection (cx,cy,cr, x1,y1,-vx,-vy);
	t2 = this.t1;
	
	if (jjkkll == 0)
	{
		console.log ("r1:" + r1 + " r2:" + r2 + " t1:" + t1 + " t2:" + t2);
		jjkkll = 1;
	}

		// 4 condition pairs to test.
	if ((r1 == false) && (r2 == false))
	{
		return; 	// no collision possible.
	}
	if ((r1 == true) && (r2 == false))
	{
		tc = t1;
	}
	if ((r1 == false) && (r2 == true))
	{
		tc = t2;
	}
	if ((r1 == true) && (r2 == true))
	{
		tc = t1;
		if (t2 < t1)
		{
			tc = t2;
		}
	}
	
	
	Ctx.beginPath();
	Ctx.rect (x1 - 3 + (tc * -vx), y1 - 3+ (tc * -vy), 5,5);
	Ctx.rect (x1 , y1 , 3,3);
	Ctx.fill();
	
	Ctx.beginPath();
	Ctx.rect (cx-3,cy-3,6,6);
	Ctx.fill();
	
	Ctx.beginPath();
	Ctx.moveTo (x0,y0);
	Ctx.lineTo (x0-vx, y0-vy);
	Ctx.stroke();

	Ctx.beginPath();
	Ctx.moveTo (x1,y1);
	Ctx.lineTo (x1-(vx*150), y1-(vy*150));
	Ctx.stroke();
	
	// for now return false
	return false;
}
*/

CollisionObject.prototype.rayReflection = function (px,py, vx,vy, x0,y0,x1,y1)
{
	// vector reflection - calculates the result of a ray from
	// point (px,py) in the direction (vx,vy),
	// colliding with a line (x0,y0)->(x1,y1)
	
	// returns true if successful, false otherwise.
	
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
	
//	console.log ("oeoeoeoe");
	
//	r = new Geom_Result();

		// calculate n and normalise it.
//	Geom_DistancePointToLine (px,py, x0,y0,x1,y1, r);

	Ctx.beginPath();
	Ctx.rect (30,30, 50,50);
	Ctx.fill();

	this.squaredDistancePointToLine (px,py, x0,y0,x1,y1);

	Ctx.beginPath();
	Ctx.rect (this.x, this.y, 5,5);
	Ctx.fill();

	nx = this.x - px;
	ny = this.y - py;
	
	Ctx.beginPath();
	Ctx.strokeStyle="#0f0";
	Ctx.moveTo (this.x, this.y);
	Ctx.lineTo (this.x + (nx*50), this.y + (ny*50));
	Ctx.stroke;
	Ctx.strokeStyle="#000";

	d = Math.sqrt ((nx*nx)+(ny*ny));
	if (d == 0)
	{
		// ray is on line.. can't reflect 
		this.info = INFO_RAY_ON_LINE;
		return false;
	}
	nx /= d;
	ny /= d;

	this.u = nx;
	this.v = ny;

		// r = d-2(d.n)n
	d_dot_n = (vx * nx) + (vy * ny);
	this.rx = vx - (2 * d_dot_n * nx);
	this.ry = vy - (2 * d_dot_n * ny);
	
	return true;
}
