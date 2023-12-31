/*
	Title	:	Text Token Scanner
	
	Info	:	Javascript version 2.1 7 3rd June 2021

	Author	:	Nick Fleming

	Updated	:	8th June 2022

	 Notes:
	--------
		Token scanner. splits input file to tokens and performs some
	basic lexical analysis.

		Extracted from the original tiny basic code &
	cleaned up a little. (a LOT)
 
 
		*********************************
		*********************************
		*********************************
		*** 	                      ***
		*** 	UNDER CONSTRUCTION    ***
		*** 	                      ***
		*********************************
		*********************************
		*********************************


	 8th March 2021
	-----------------
	Restructuring scanner code to be more object-orientated, no real
	reason, just easier to group everything together.

	 9th March 2021
	----------------
		Last Character bug : 
		after calling readCh() this.idx points to the next character 
		available. so this.idx reaches the end of the file before 
		this.ch is processed.

		Adding GetToken function so that identifiers can be tokenised
	as the input is parsed.







	 11th March 2021
	------------------

	changed TOKEN_TYPE_SINGLECH and TOKEN_TYPE_OPERATOR to 
	a single type : TOKEN_TYPE_SYMBOL . This is to aid the expression
	parser in processing operator tokens.




	 14th March 2021
	-----------------
		Modified skip space to include single line comments.

	 30th March 2021
	------------------
		Added TOKEN_UNKNOWN as a defined constant, so this code
	is a little less coupled to other files.

	 3rd June 2021
	----------------
		Code added to return CC_LINEFEED as a token (for statements
	that are terminated by a line )

	 8th June 2022
	---------------
		fixed bug where skip space would incorrectly skip over single
	line comments without returning.
 */

var SCANNER_MAX_STRING_LENGTH = 256;

var TOKEN_UNKNOWN = -99;

var TOKEN_TYPE_UNKNOWN		= 0;
var TOKEN_TYPE_NUMBER		= 1;
var TOKEN_TYPE_IDENTIFIER	= 2;
var TOKEN_TYPE_STRING		= 3;
var TOKEN_TYPE_SYMBOL		= 4;
var TOKEN_TYPE_EOL			= 5;

var TOKEN_TYPE_KEYWORD = 6;			// (not yet used.. )
var TOKEN_TYPE_OPERATOR = 7;		// not used

//var TOKEN_TYPE_SINGLECH		= 4;
//var TOKEN_TYPE_OPERATOR		= 5;		// for 2 character operators.

var CONST_END = -999;

var CC_LINEFEED = 0x0A;						// for newline detection.
	// ascii codes for single char tokens.
var CC_SPACE 		= 32;
var CC_EXCLAIM		= 33;		// !
var CC_DBLQUOTE 	= 34;		// "
var CC_HASH			= 35;
var CC_DOLLAR		= 36;
var CC_PERCENT		= 37;
var CC_AND			= 38;				// &
var CC_QUOTE 		= 39;		// '
var CC_LBRACKET		= 40;	// (
var CC_RBRACKET		= 41;	// )
var CC_ASTERISK		= 42;	// *
var CC_PLUS			= 43;
var CC_COMMA		= 44;
var CC_MINUS		= 45;
var CC_PERIOD 		= 46;		// .  (fullstop)
var CC_DIVIDE		= 47;		// /
var CC_ZERO 		= 48;		// 0
var CC_NINE 		= 57;		// 9
var CC_COLON 		= 58;	// :
var CC_SEMICOLON 	= 59;	// ;
var CC_LTHAN		= 60;	// <
var CC_EQUAL		= 61;	// =
var CC_GTHAN		= 62;	// >
var CC_QUESTION		= 63;	// ?
var CC_AT			= 64;		// @
var CC_LC_A			= 97;		// a
var CC_LC_F 		= 102;	// f
var CC_LC_X 		= 120;	// x
var CC_LC_Z			= 122;	// z
var CC_UC_A			= 65;		// A
var CC_UC_F 		= 70;		// F
var CC_UC_X 		= 88;		// X
var CC_UC_Z			= 90;		// Z
var CC_LSB			= 91;			// [
var CC_BACKSLASH	= 92;	// \
var CCODE_RSB=93;			// ]
var CC_XOR			= 94;			// ^
var CC_UNDERSCORE 	= 95;	//'_';
var CC_BACKQUOTE	= 96;	// `
var CC_LBRACE		= 123;	// {
var CC_OR			= 124;		// |
var CC_RBRACE		= 125;	// }
var CC_TILDE		= 126;		// ~

	// double character 'codes'.
var CC_SHIFT_LEFT	= 1000;		// <<
var CC_SHIFT_RIGHT	= 2000;	// >>
var CC_NOT_EQUAL	= 3000;		// !=
var CC_LOGICAL_AND	= 4000;	// &&
var CC_LOGICAL_OR	= 5000;		// ||


	// ***********************************************************

	//					---- Text String scanner/parser ----
	//		Converts a string into tokens which are numbers,
	//		identifiers, strings or single characters.

	// ***********************************************************


	// ------------------------------------------
	//		----	Scanner Constructor ----
	// ------------------------------------------

function StrScanner (text, token_list)
{
	this.single_ch_token_list = "$!\"%^&*(){}[]:;@'#~<>,./\?|-=+";

	this.src = text;
	this.idx = 0;
	
	this.nextch = 0;
	this.ch = null;
	this.last_ch = null;
	
	this.token_list = token_list;
	
	this.token_buffer = "";
	this.token_type = TOKEN_TYPE_UNKNOWN;
	this.token_value = 0;
	this.token_id = TOKEN_UNKNOWN;		// set when an identifier is scanned.
	
	this.return_eol_ch = false;
	
	this.line_number = 0;
}

	// -----------------------------------------
	//		----- string to token id -------
	// -----------------------------------------

StrScanner.prototype.strToTokenId  = function (token_string)
{
		// returns TOKEN_UNKNOWN if unable to convert token,
		// or if token list is unavailable.

	var ch;
	var tok;
	var i;

	if (this.token_list == null)
	{
		return TOKEN_UNKNOWN;
	}

		// if token is a number, return TOKEN_NUMBER	
	ch = token_string.charCodeAt (0);
	if ((ch >= CC_ZERO) && (ch <= CC_NINE))	return TOKEN_NUMBER;

		// all token strings are lowercase.
	tok = token_string.toLowerCase();	

		// look for match in token list.
	i = 0;
	while (i < this.token_list.length)		//[i+1] != TOKEN_INVALID)
	{
		if (tok == this.token_list[i])
		{
//			console.log ("tok:"+tok + " " + this.token_list[i+1]);
			return this.token_list[i+1];
		}
		i += 2;
	}
	
	return TOKEN_UNKNOWN;		// unable to identify token in reserved word list.
	
}


	// ------------------------
	// useful IsA_x_ functions.
	// ------------------------

StrScanner.prototype.isADigit = function (ch)
{
	if ((ch >= CC_ZERO) && (ch <= CC_NINE))	return true;
	return false;
}


StrScanner.prototype.isAlpha = function (ch)
{
	//	 '_' is considered to be an alphabet character
	// as it is used as part of identifiers.

	if ((ch >= CC_LC_A) && (ch <= CC_LC_Z)) return true;
	if ((ch >= CC_UC_A) && (ch <= CC_UC_Z)) return true;
	if (ch == CC_UNDERSCORE)				 return true;

	return false;
}

StrScanner.prototype.isSingleCharToken = function (ch_code)
{
		// using a javascript built in function to do this "at speed".

	var i;
	
	i = this.single_ch_token_list.indexOf(String.fromCharCode (ch_code));
	if (i != -1)	return true;
	return false;
}

StrScanner.prototype.isAlphaNumeric = function (ch)
{
	if (this.isADigit(ch) == true)	return true;
	if (this.isAlpha(ch) == true)	return true;

	return false;
}

StrScanner.prototype.isHexDigit = function(ch)
{
	var tmp;

	if (this.isADigit(ch) == true)	return true;
	
	if ((ch >= CC_LC_A) && (ch <= CC_LC_F)) return true;
	if ((ch >= CC_UC_A) && (ch <= CC_UC_F)) return true;

	return false;
}

	// --------------------------------------
	
StrScanner.prototype.done = function()
{
	if (this.ch == CONST_END)
	{
		return true;
	}
	return false;
}

StrScanner.prototype.readCh = function ()
{
	// returns the character CODE in the input array to be
	// processed. returns CONST_END if no more text to be processed.

	var ch;
	
	this.ch = CONST_END;
	this.nextch = CONST_END;

	if (this.idx < this.src.length)
	{
		this.ch = this.src.charCodeAt (this.idx);
	}

	this.idx++;

	if (this.idx < this.src.length)
	{
		this.nextch = this.src.charCodeAt (this.idx);
	}

	return this.ch;
}

StrScanner.prototype.skipSingleLineComment = function()
{
//	console.log ("scanner.js : skipSingleLineComment : TO DO : change check to single character ???");
	
	// original routine was called 'ScanToEndOfLine' and that
	// exited after reading the /next/ character to scan.
	// unsure whether to do that here..

	var ch;

	ch = this.ch;
	while ((ch != CC_LINEFEED) && (ch != CONST_END))
	{
		ch = this.readCh();
	}

//	ch = this.readCh();		// read next character to scan.

//	console.log ("skipped");
}

StrScanner.prototype.skipSpace = function()
{
		// returns true if found something to look at, otherwise returns false (end of data) 
	var ch;
	
//	console.log ("skip space");

	if (this.ch == CONST_END)
	{
//	console.log ("skip space b");
		return false;
	}
//		console.log ("skip space c");

	ch = this.ch;
	while (ch != CONST_END)
	{
//		console.log ("skip space d (" + ch + ")");
		if (ch == CC_LINEFEED)
		{
//					console.log ("skip space e");

			return true;
		}

		if (ch > CC_SPACE)
		{
//					console.log ("skip space f");

			if ((this.ch == CC_DIVIDE) && (this.nextch == CC_DIVIDE))
			{
//						console.log ("skip space g");

				this.skipSingleLineComment();
				if (this.ch == CC_LINEFEED)
				{
					return true;
				}
			}
			else
			{
//						console.log ("skip space h[" + this.token_buffer +"]");

				return true;
			}
		}
		ch = this.readCh();
//			console.log ("skip space i");

	}
//			console.log ("skip space j");

	return false;
}

StrScanner.prototype.parseString = function (end_of_string_char_code)
{
		// returns the length of the string or -1 if an error occurs.

		// note : scans past the the final quote character to remove
		// it from the input stream.

	var ch;
	var len;
	var tmpstr;

//	console.log ("scanner 367 char code :" + end_of_string_char_code);
	this.token_buffer = "";
	tmpstr = "";
	len = 0;
	ch = this.readCh();
	while (ch != end_of_string_char_code)
	{
		if (ch == CONST_END)
		{
			return -1;		// end of data reached.
		}
		if (len >= SCANNER_MAX_STRING_LENGTH)
		{
			return -1;		// string too big
		}
		tmpstr = tmpstr + String.fromCharCode(ch);
		len++;
		ch=this.readCh();	
	}

//	console.log ("---end of string code found ");

	this.readCh();		// scan past end_of_string_char_code

	this.token_buffer = tmpstr;
	this.token_type = TOKEN_TYPE_STRING;
	
	return len;
}

StrScanner.prototype.parseIdentifier = function()
{
		// call if the current character starts with a letter.

	var idstr;
	var len;
	var ch;

	idstr = "";
	len = 0;
	ch = this.ch;
	
	if (this.isAlpha(ch) == false)
	{
		return -1;
	}

	while ((this.isAlphaNumeric(ch) == true) && (len < SCANNER_MAX_STRING_LENGTH))
	{
		idstr = idstr + String.fromCharCode (ch);
		len++;
		ch=this.readCh();
	}
	
	this.token_buffer = idstr;
	this.token_type = TOKEN_TYPE_IDENTIFIER;
	this.token_value = 0;
//	this.token_id = TOKEN_UNKNOWN;

	return len; 	
}

StrScanner.prototype.parseHexNumber = function()
{
		// reads in a sequence of hex digits.
		// *working*
 
	var numstr;
	var ch;

	numstr = "";

	ch = this.readCh();	// get first character after 'x'

	while (this.isHexDigit (ch) == true)
	{
		numstr = numstr + String.fromCharCode (ch);
		ch = this.readCh();
	}

	numstr = "0x" + numstr;
	this.token_value = Number (numstr);		// use javascript function to do the donkey work. (lazy!)
	this.token_buffer = numstr;
}

StrScanner.prototype.parseNumber = function()
{
		// simple number parser - reads hex or floating point numbers.
		
	var numstr;
	var ch;

	numstr = "";

		// if ch = zero, test for hex number
	ch = this.ch;	//CurrentCh;
	if (ch == CC_ZERO)
	{
		if ((this.nextch == CC_LC_X) || (this.nextch == CC_UC_X))
		{
			ch = this.readCh();
			this.parseHexNumber();
			return;
		}
	}

	while (this.isADigit(ch) == true)
	{
		numstr = numstr + String.fromCharCode (ch);
		ch = this.readCh();
	}
	if (ch != CC_PERIOD)
	{
		this.token_value = parseFloat(numstr);
		this.token_buffer= numstr;
		return;
	}
	numstr = numstr + ".";
	ch = this.readCh();		// read first character after '.'
	while (this.isADigit(ch) == true)
	{
		numstr = numstr + String.fromCharCode (ch);
		ch = this.readCh();
	}

	this.token_value = parseFloat(numstr);
	this.token_buffer = numstr;
}

StrScanner.prototype.parse_IsSpecialToken = function (current_ch, next_ch)
{
	// returns RETCODE_TRUE if it is a special token:
	// (i.e. its a crappy 'C' style operator)
	// 	!= <= << >= >> == || &&
	//		+= *= -= /= %= 
	//	++ -- **

	// returns RETCODE_FALSE if it isnt.

	// also returns with scanner looking at the
	// next character along.

	switch (current_ch)
	{
		case CC_EXCLAIM:
		case CC_LTHAN:
		case CC_GTHAN:
		case CC_EQUAL:
		case CC_PLUS:
		case CC_ASTERISK:
		case CC_AND:			// &
		case CC_OR:				// |
		case CC_MINUS:
		case CC_DIVIDE:
			break;

		default:
			return false;
	}

	switch (current_ch)
	{
		case CC_EXCLAIM:
		case CC_DIVIDE:
		case CC_PERCENT:
		case CC_ASTERISK:
		case CC_PLUS:
		case CC_MINUS:
			if (next_ch == '=')
			{
				return true;
			}
			break;
		default: break;
	}

	if (current_ch == CC_LTHAN) 
	{
		switch (next_ch)
		{
			case CC_LTHAN: return true;
			case CC_EQUAL: return true;
			default: 	return false;
		}
	}

	if (current_ch == CC_GTHAN) 
	{
		switch (next_ch)
		{
			case CC_GTHAN: return true;
			case CC_EQUAL: return true;
			default:		return false;
		}
	}

	switch (current_ch)
	{
		case CC_EQUAL:
		case CC_AND:
		case CC_OR:
		case CC_PLUS:
		case CC_MINUS:
		case CC_ASTERISK:
			if (next_ch == current_ch)	return true;

		default: break;
	}
	return false;
}

StrScanner.prototype.getToken = function()
{
		// parses the source code and returns the next available token.
		// The token is stored in TokenBuffer. 
		
		// single character tokens, double character tokens and
		// identifiers all set the token_id .

	var retval;
	var ch;
	
	this.token_type = TOKEN_TYPE_UNKNOWN;
	this.token_id = TOKEN_TYPE_UNKNOWN;
	this.token_buffer = "";
	this.token_value = 0;

	retval = this.skipSpace();
	if (retval == false)
	{
		console.log ("eof reached");
		return;
	}
	
	if (this.ch == CC_LINEFEED)
	{
			this.token_type = TOKEN_TYPE_EOL;
			this.token_value = 0;
			ch = this.readCh();		// required to ensure scanner keeps scanning.
			this.line_number++;
//			console.log ("LINE !!");
			return;
	}


	if ((this.ch == CC_QUOTE) || (this.ch == CC_DBLQUOTE))
	{
		// looking at a string.
//		console.log (" SCANNER : Looking at a string");
		retval = this.parseString(this.ch);
//		console.log (" SCANNER : --->>>>====-----" + this.ch);
		this.token_type = TOKEN_TYPE_STRING;
		return;
	}

			// single and double character 'symbols' 
	if (this.isSingleCharToken (this.ch) == true)
	{
			// single character token found, look at nextch to
			// determine if it is a 2 character pair.
		if (this.parse_IsSpecialToken (this.ch, this.nextch) == true)
		{
			
//			console.log ("SPECIAL OP ++++++++++++++++++++++++");
			
			
			this.token_buffer = "" + String.fromCharCode(this.ch) + String.fromCharCode(this.nextch);
			
//			this.token_id = TokenID = GetTokenID (TokenBuffer);
			this.token_id = this.strToTokenId (this.token_buffer);
			this.token_type = TOKEN_TYPE_SYMBOL;
			this.token_value = 0;
			ch = this.readCh();				// not sure if this is required ???
			ch = this.readCh();				// skip over nextch as it's part of special char.
			return;
		}
		this.token_buffer = "" + String.fromCharCode(this.ch);
		
			// NEED TO GET TOKEN ID HERE ???
//		thTokenID = GetTokenID (TokenBuffer);

		this.token_id = this.strToTokenId (this.token_buffer);
		this.token_type = TOKEN_TYPE_SYMBOL;

//		console.log ("SINGLE CH ---------:" + this.token_buffer + ":token_id:" + this.token_id);

		ch = this.readCh();				// not sure if this is required ???
		return;
	}

	if (this.isADigit (this.ch) == true)
	{
		// looking at a number.
		retval = this.parseNumber ();
		this.token_type = TOKEN_TYPE_NUMBER;
		return;
	}
	
	if (this.isAlpha (this.ch) == false)
	{
		console.log ("expecting an alpha char");
		return;
	}

	this.parseIdentifier();
	this.token_id = this.strToTokenId (this.token_buffer);	
}

StrScanner.prototype.returnEOL = function (true_or_false)
{
	this.return_eol_ch = true_or_false;
}
