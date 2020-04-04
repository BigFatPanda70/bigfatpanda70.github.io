/*

Title	:	Hiscore Routines

Info	:	Version 0.0	4th April 2020

Author	:	Nick Fleming

Updated:	4th April 2020

	 Notes:
	---------
		General purpose hiscore routines.
	Note hiscore[0] is the lowest score in the hiscore table.

	 To Use:
	------------
	calll HiscoresInit() to set things up.

	call HiscoresUpdate (score, name) to add/update the hiscore table.

	if cookies are available.. use .HiscoreLoad and HiscoreSave to
	save/restore hiscores.

*/

var HISCORE_NUM_SCORES = 5;
var HISCORE_MAX_NAME_SIZE = 3;

var HISCORE_COOKIE_NAME = "bnbhiscore";

function HISCORE_STRUCT()
{
	this.score = 0;
	this.name="";
}

var Hiscores = [];

function HiscoreIsValidChar(chCode)
{
	if ( (chCode >= "A".charCodeAt(0)) && (chCode <= "Z".charCodeAt(0)) )
	{
		return true;
	}
	if ( (chCode >= "a".charCodeAt(0)) && (chCode <= "z".charCodeAt(0)) )
	{
		return true;
	}
	if (chCode == "_".charCodeAt(0))
	{
		return true;
	}
	if (chCode == " ".charCodeAt(0))
	{
		return true;
	}
	if (chCode == "+".charCodeAt(0))
	{
		return true;
	}

	if (chCode > 127)
	{
		return true;	// generally, anything above 127 should be ok.
	}

	return false;
}
	

function HiscoreSanitiseName(namestr)
{
	// only allow letters, space and numbers.
	// the length is truncated if it exceeds the maximum size expected.
	var i;
	var str;
	var ch;
	
	str = "";
	for (i = 0; i < namestr.length; i++)
	{
		ch = namestr.charCodeAt (i);
		if (HiscoreIsValidChar(ch) == false)
		{
			ch = " ".charCodeAt(0);
		}
		str = str + String.fromCharCode (ch);
	}
	
	if (str.length > HISCORE_MAX_NAME_SIZE)
	{
		str = str.substr(0,HISCORE_MAX_NAME_SIZE);
	}

	return str;
}

function HiscoresInit()
{
		// should probably pass number of hiscores required as a 
		// parameter.. ??

	var i;
	
	for (i = 0; i < HISCORE_NUM_SCORES; i++)
	{
		if (i == Hiscores.length)
		{
			Hiscores[i] = new HISCORE_STRUCT();
			Hiscores[i].score = 5 + (i * (10*i));
		}
	}
}

function HiscoresIsAHiscore (score)
{
	 // quick test to see if players score can be added to the
	 // hiscore table.

	if (Hiscores[0].score > score)
	{
		return false;
	}
	return true;
}

function HiscoresUpdate (score, name)
{
	var r;
	var i;
	var idx;

	r = HiscoresIsAHiscore(score);
	if (r == false)
	{
		return;
	}
	
		// not the best loop, but it's simple and it works :-P
	if (Hiscores[0].score < score)
	{
		Hiscores[0].score = score;
		Hiscores[0].name = HiscoreSanitiseName(name);
		if (Hiscores.length == 1)
		{
			return;	// single length = special case
		}
	}

	idx = 0;
	for (i = 1; i < Hiscores.length; i++)
	{
		if (Hiscores[i].score < score)
		{
				// move it down.
			Hiscores[i-1].score = Hiscores[i].score;
			Hiscores[i-1].name = Hiscores[i].name;
			idx = i;
		}
	}
	Hiscores[idx].score = score;
	Hiscores[idx].name = HiscoreSanitiseName (name);

}

function HiscoresLoad()
{
	var i;
	var str;
	var tmp = [];
	
	str = Cookies_getCookie(HISCORE_COOKIE_NAME);
	tmp = str.split(",");
	for (i = 0; i < Hiscores.length; i++)
	{
		Hiscores[i].name = HiscoreSanitiseName (tmp[i*2]);
		Hiscores[i].score =ParseInt (tmp[(i*2)+1]);
	}
}

function HiscoresSave()
{
	var i;
	var str;
	
	str = "";
	for (i = 0; i < Hiscores.length;i++)
	{
		str = str + name +"," + score;
	}

	Cookies_setCookie (HISCORE_COOKIE_NAME, str, 365);	// set cookie for a year.
}
