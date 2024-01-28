/*
	Title	:	Particle Stuff

	Info	:	Version 0.0	13th June 2023

	Author	:	Nick Fleming

	Updated	:	13th June 2023

	 Notes:
	----------
		Just a generalised particle system. No collisions, only 
	velocities and colour changes (for FX)



*/

function STRUCT_PARTICLE (sx, sy, vx, vy)
{
	this.enabled = true;
	this.x = sx;
	this.y = sy;
	this.vx = vx;
	this.vy = vy;

	this.start_time = null;
	this.end_time = null;

	this.start_value = 0;
	this.value_range = 0;
	this.value = 0;
	this.end_value = 0;

	this.dx = 0;
	this.dy = 0;
}

STRUCT_PARTICLE.prototype.setDuration = function (start_time, duration)
{
	this.start_time = start_time;
	this.duration = duration;
	this.end_time = start_time + duration;
}

STRUCT_PARTICLE.prototype.setValueRange = function (start_value, end_value)
{
	this.start_value = start_value;
	this.value = start_value;
	this.end_value = end_value;

	this.value_range = this.end_value - this.start_value;
}

STRUCT_PARTICLE.prototype.setAcceleration = function (dx, dy)
{
	this.dx = dx;
	this.dy = dy;
}

STRUCT_PARTICLE.prototype.update = function(current_time)
{
	var dt;
	
	if (this.enabled == false)
	{
		return;
	}

	this.x += this.vx;
	this.y += this.vy;

	this.vx += this.dx;
	this.vy += this.dy;
	
	if (this.start_time != null)
	{
		if (current_time >= this.end_time)
		{
			this.enabled = false;
			return;
		}
			// time based change as well as velocity

		if ((current_time >= this.start_time) && (current_time <= this.end_time))
		{
			dt = this.start_time - current_time;
			this.value = this.start_value;
			if (this.duration > 0)
			{
				this.value = this.start_value + (this.value_range * (dt/this.duration));
			}
		}
	}
}

	// ===========================
	// 	  convenience functions 
	// ===========================

function ParticleExplosion (	parray, 
								cx,cy,
								start_time,
								duration_ms, 
								min_speed, max_speed, 
								min_particles, max_particles,
								val_range_min, val_range_max)
{
	var i;
	var pa;
	
	var np;

	var dx;
	var dy;
	var d;

	var v;		// size of velocity
	var vx;		// (vx,vy) = velocity components.
	var vy;
	
	var a;
	
	var start_value;
	
	np = min_particles + Math.floor (Math.random() * (max_particles - min_particles));
	
//	console.log ("np:" + np);
//	console.log (parray);
//	parray = [];
	for (i = 0; i < np; i++)
	{
			// get a random direction, convert to radians
		a = (Math.random() * 360) * Math.PI / 180;
		dx = Math.sin (a);
		dy = Math.cos (a);
		
//		console.log ("dx:" + dx + " dy:" + dy);
//		console.log ("ms:" + min_speed + " mx:" + max_speed);
		// d = 1 as sin^2(x) + cos^2(x) = 1, so dont need sqrt step... right ?

		v = min_speed + (Math.random() * (max_speed - min_speed));
		
//		console.log ("v:" + v);
		vx = v * dx;
		vy = v * dy;

		parray[i] = new STRUCT_PARTICLE (cx,cy,vx,vy);
		
//		console.log ("i:" + i + " vx:" + vx + " vy:" + vy);
//		console.log (parray[i]);
		// parray[i].setAcceleration = (?,?);	// to do 
	
//		parray[i].setDuration (start_time, duration_ms);
		
//		start_value = val_range_min + (Math.random() * (val_range_max - val_range_min));
//		parray[i].setValueRange (start_value, val_range_min);
	}
	
	console.log ("parray");
	console.log (parray);
}

function UpdateParticleArray (pa, current_time)
{
	var i;
	
	for (i = 0; i < pa.length; i++)
	{
		if (pa[i].enabled == true)
		{
			pa[i].update(current_time);
		}
	}
}




















