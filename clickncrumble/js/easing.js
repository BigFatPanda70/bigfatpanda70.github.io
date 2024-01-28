/*
	Title	:	Easing Functions

	Info	:	Version 0.0	17th May 2023

	Author	:	Nick Fleming

	Updated	:	17th May 2023

	 Notes:
	---------

	Some useful easing functions for animation (because its a pain to
	work these out each time !!

*/

function fe_linear (x)
{
	return x;
}

function fe_test(x)
{
	return 0.5 - (Math.cos(x * Math.PI)/2);
}

function fe_slow_in (x)
{
//	if (x == 0)	return x;
//	return (x*x);
	return Math.sin(x * Math.PI*0.5);
}

function fe_slow_in_2 (x)
{
	return 1 - ((1-x) * (1-x));
}

function fe_slow_out_slow_in (x)
{
	// https://stackoverflow.com/questions/13462001/ease-in-and-ease-out-animation-formula

	if (x <= 0.5)
	{
		return 2 * (x*x);
	}

	x -= 0.5;
	return 2 * x * (1-x) + 0.5;
}

function fe_slow_out (x)
{
//	return x * x * x;			// x*x or x*x*x works.. 
	return x * x;
}

function fe_ease_in_out (x)
{
		// slightly steeper curve than slow_in_slow_out
	if (x <= 0.5)
	{
		return 4 * x * x * x;
	}
	return 4 * (x-1)*(x-1)*(x-1) + 1;
}

function fe_ease_in_out_2 (x)
{
		// slightly steeper curve than slow_in_slow_out
	if (x <= 0.5)
	{
		return 2 * x * x;
	}
	return -2 * (x-1)*(x-1) + 1;
}


function fe_bezier_blend (x)
{
	// https://stackoverflow.com/questions/13462001/ease-in-and-ease-out-animation-formula
	return x * x * (3 - 2 * x);
}

function fe_parametric_blend(x)
{
// https://math.stackexchange.com/questions/121720/ease-in-out-function/121755#121755
// https://stackoverflow.com/questions/13462001/ease-in-and-ease-out-animation-formula

	var sqr_t;
	
	sqr_t = x * x;
	return sqr_t / (2 * (sqr_t - x) + 1.0);
}

function fe_slow_in_cubic (x)
{
	// https://easings.net/

	return 1 - Math.pow(1 - x, 3);
}

function fe_slow_in_3 (x)
{
	return Math.sqrt(1 - Math.pow(x - 1, 2));
}

