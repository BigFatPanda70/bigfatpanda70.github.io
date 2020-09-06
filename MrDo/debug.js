//
//		Title	:	Simple Debug Routines for help fixing errors on devices without console.log support.  
// 
// 
// 
// 

var DebugDiv = null;

function Debug (debug_flags, msg)
{
	var txt;

	if (DebugDiv == null)
	{
		console.log ("Debug : DebugDiv = NULL, InitDebug not called ??");
		if (debug_flags != 0)
		{
			console.log (msg);
		}
		return;
	}
	
	if (debug_flags == 0)	return;

	txt = DebugDiv.innerHTML;
	txt = txt + "<br>" + msg;
	DebugDiv.innerHTML = txt;
//	console.log (txt);
	console.log (msg);
}

function DebugInit (div_output_name)
{
	DebugDiv = document.getElementById (div_output_name);
	console.log ("debug init " + div_output_name + " : " + DebugDiv);
}