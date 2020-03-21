/*

	Title	:	Cookie Consent Div

	Info	:	Version 0.0	9th March 2020

	Author	:	Nick Fleming

	Updated	:	9th March 2020

	 Notes:
	--------
	Need to only ask this question once (per session ??) so if the 
accept cookie exists, this message is not displayed.






*/

var CONSENT_DIV_ID = "CONSENTDIV2020";
var CONSENT_DIV_CLASS="div_cookie_consent";

function CloseConsentDiv()
{
		// by clicking on accept, we can enable cookies.

	var item;
	
	item = document.getElementById (CONSENT_DIV_ID);
	if (item != null)
	{
		item.style.display = "none";
	}
	AllowCookies = true;	// 

	_BFP_setCookie (NAME_ALLOW_COOKIE, "true", 7);	// expires after 7 days !
}

/*
function ConsentPopup()
{
	var allow;
	var str;
	var div;
	
	allow = Cookies_getCookie(NAME_ALLOW_COOKIE);
	if (allow.length !=0)
	{
		// allow cookie found , so don't show popup
		// TO DO : set enable/disable cookies.
		return;
	}

	str = '<div class="' + CONSENT_DIV_CLASS + '" id="'+CONSENT_DIV_ID+'">';
	str += "<br>";
	str += "This site uses cookies, as set out in our <a href='cookie.html'>Cookie Policy</a>.";
	str += "<br>";
	str += "If you agree to use this site, please close this message and continue to use this site. Thank you.";
	str += "<br>";
	str += "<br>";
	str += '<div class="consentbutton" onclick="CloseConsentDiv();">Accept and Close</div>';
	str += "<br>";
	str += "</div>";
	
	div = document.createElement("DIV");
	div.innerHTML = str;
	document.body.appendChild(div); 
}
*/
