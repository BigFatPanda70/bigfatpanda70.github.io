/*
 Simple Javascript cookie Routines


	Cookies can only be stored if the user has given permission,

*/

var AllowCookies = false;	// default is false, unless user consents.

// from https://www.w3schools.com/js/js_cookies.asp

var NAME_ALLOW_COOKIE = "BFP70Cookies";

function Cookies_setCookie (cname, cvalue, exdays)
{
	if (AllowCookies != true)
	{
		return;
	}

  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function Cookies_getCookie(cname)
{
	if (AllowCookies != true)
	{
		return "";
	}

  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

	// ==== cookie control =====

function Cookies_Enable()
{
	AllowCookies = true;
	_BFP_setCookie (NAME_ALLOW_COOKIE, "true", 365*10);	// expires after 10 years !
}

function Cookies_Disable()
{
	AllowCookies = true;
	_BFP_setCookie (NAME_ALLOW_COOKIE, "false", 365*10);	// expires after 10 years !
	AllowCookies = false;
}

function Cookies_Status()
{
	// get current cookie enable/disable status.
	return AllowCookies;
}


