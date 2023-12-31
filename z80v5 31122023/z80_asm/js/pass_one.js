/* ------------------------------------------------------------------

	Title	:	Z80 Assembler Pass One

	Info	:	Javascript version 0.0	8th September 2023

	Author	:	Nick Fleming.

	Updated	:	14th September 2023

	 Notes:
	--------
		Javascript version based on C Version 1.0	28th December 2001.

	Parses any file passed in, generates the label (symbol)
	table and does syntax checks on the source file

	contains code to implement a full scale, industrial
	strength expression parser and evaluator.

	 Note the use of a stack to allow the
	'include' processing directive to be easily used.

	 This is a HORRIBLE thing to get right !!

	 Expression Parsing Notes:
	---------------------------

	There are various ways to define the grammar for
	an expression. In the code below I've used the
	following simple grammar (as found in most good 
	compiler tutorials):

	expression 	= expression bin_op term | term
	term		= term mul_op factor | factor
	factor	= identifier | number | (expression)

	Expanding the grammar fully (removing all the
	left recursion + ambiguities) gives the following:

	expression 	= unary_op term exp' | term exp'
	exp' 		= bin_op term exp'| #
			
	term	= factor term'
	term'	= mul_op factor term'| #
	
	factor	= identifier | number | ( expression )

	identifier = letter alphanum

	alphanum	= letter alphanum'
			| digit alphanum'

	alphanum'	= alphanum | #

	number	= digit number'
	number'	= number | #

	unary_op= - | sin | cos | tan | ln | sqrt | abs
	bin_op	= + | -
	mul_op	= * | /
	letter 	= a | ... | z | A | ... | Z
	digit	= 0 | .... | 9

	# = the set of ALL tokens that are not in any of
	the other parts of a grammar rule. For most statements,
	this means terminating characters  such as ';', newline
	and ')'. but also means ANY unexpected tokens.


	The above grammar is based on the classic
	solution to the expression parsing problem, and
	it also has the nice property in that it enforces
	precedence rules too :-) . .. If you think that
	its complicated, have a look at the one for C
	or C++ sometime. !!

	 Removing Left Recursion From Expression Grammars.
	---------------------------------------------------
	If the above grammar looks a little odd its because
	I've attempted to remove all the left recursion that
	usually results in an infinte loop when coding a grammar
	using top down (recursive decent) parsing.

	e.g.
		A = Ab | c

	(where you can do A->A->A.. forever without getting b or c)

		becomes

		A = c A'
		A' = bA' | #

	This is the formal way to remove left recursion (as
	found in most compiler tutorials).



	 How To Evaluate Expressions
	------------------------------
		"Traditional" expression evaluation uses an algorithm
	to convert an infix expression (i.e. what you're used to) to
	postfix notation (aka. Reverse Polish Notation) which has
	no ambiguities and can easily be evaluated by a compiler using
	a stack.

		Is it possible to convert the infix notation to postfix
	using the expression grammar ? .. yup !

			expression 	= expression bin_op term output("+")| term
			term		= term mul_op factor output("*")| factor
			factor	= identifier output(ident) | number  outut(number)| (expression)

	each time a factor is found, it is output to the rpn calculator which
	pushes it onto the stack. at the points specified (output "op") the
	appropriate operator is output to the rpn calculator, which then pops
	the required number of numbers from the stack, does the operation and
	then pushes the result back onto the stack.

	Using this "simple" method, it is possible to evaluate and parse an
	expression in one pass, providing all the identifiers values are known.

	Extending the grammar to include the logical operators '^' '&' '!' '|' and the
	shift operators '<<' and '>>' gives the following grammar :

		expression = logical_or_expr | logical_or_expr

		logical_or_expr	= logical_or_expr OR logical_and_expr | logical_and_expr

		logical_and_expr	= logical_and_expr AND bitwise_or_expr | bitwise_or_expr

		bitwise_or_expr	= bitwise_or_expr "|" bitwise_xor_expr | bitwise_xor_expr

		bitwise_xor_expr	= bitwise_xor_expr "^" and_expr | bitwise_and_expr

		bitwise_and_expr	= bitwise_and_expr "&" shift_expr | equal_expr

		equal_expr	= equal_expr equal_op rel_expr | rel_expr

		rel_expr	= rel_expr rel_op shift_expr | shift_expr

		shift_expr	= shift_expr shift_op add_expr | add_expr

		add_expr	= add_expr add_op term | term
		term		= term mul_op unary_expr | unary_expr
		unary_expr	= unary_op factor | factor
		factor	= indentifier | number | "(" expression  ")"

		unary_op	= '+' | '-' | '~' | '!'
		mul_op	= "*" | "/" | "%"
		add_op	= "+" | "-"
		shift_op	= "<<" | ">>"
		rel_op	= '<' | '>' | '<=' | '>='
		equal_op	= '==' | '!='

	(note that the higher the precedence, the further 'down' the grammer it
	appears.)

	The unary operator is now moved to be next to the factor operator, which
	is where it rightly belongs (as far as this grammar is concerned).

	 Operator Precedence Table
	----------------------------
	(same precedence order as C, javascript and similar languages)

	Highest Precedence: 	+-----------------------+-----------------------------+
					|unary operators		|	-	unary minus		|
					|				|	!	logical compliment|
					|				|	~	bitwise compliment|
					+-----------------------+-----------------------------+
					|multiplication		|	*	multiply		|
					|operators			|	/	divide		|
					|				|	%	remainder		|
					+-----------------------+-----------------------------+
					|additive			|	+	addition		|
					|operators			|	-	subtraction		|
					+-----------------------+-----------------------------+
					|shift			|	<<	shift left		|
					|operators			|	>>	shift right		|
					+-----------------------+-----------------------------+
					|relational			|	<	less than		|
					|operators			|	<=	less than or equal|
					|				|	>	greater than	|
					|				|	>=	greater or equal	|
					+-----------------------+-----------------------------+
					|test equality		|	==	equals		|
					|				|	!=	not equals		|
					+-----------------------+-----------------------------+
					|bitwise AND		|	&	bitwise and		|
					+-----------------------+-----------------------------+
					|bitwise XOR		|	^	bitwise xor		|
					+-----------------------+-----------------------------+
					|bitwise OR			|	|	bitwise or		|
					+-----------------------+-----------------------------+
					|logical AND		|	&&,AND logical and	|
					+-----------------------+-----------------------------+
					|logical OR			|	||,OR	logical or		|
					+-----------------------+-----------------------------+
					|				|					|
					+-----------------------+-----------------------------+



	Lowest Precedence:


	TO DO : FIGURE OUT HOW TO PROCESS THE FOLLOWING 

		a1:	; label 1
		a2:	equ 100 ; label 2
		a3:	// label 3
		a4:	// label 4

	
	 Z80 Statement grammar (ish):
	------------------------------
	Statement 	= label 
			| label equ expression
			| directive
			| instruction

	directive = include "filename" 
		| defb byte_list | defw word_list | defl longword_list
		| defm expression | defs string_list | org expression

	label	= identifier :

	instruction	= simple_instruction
			| single_word_one_byte_instruction
			| single_word_two_byte_instruction
			| instruction opcode, opcode


	single_word_one_byte_instruction =	
				ccf | cpl | daa | di | ei | exx
				| halt | nop | rla | rlca 
				| rra | rrca | scf
	
	single_word_two_byte_instruction =
				cpd | cpdr | cpi | cpir | ind
				| indr | ini | inir | ldd | lddr
				| ldi | ldir | neg | otdr | otir
				| outd | outi | reti | retn
				| rld | rrd

	** UNDER CONSTRUCTION ** : 

	single_opcode_instruction = AND s
				| CP s
				| or s
				| sub s
				| xor s

				| DEC m
				| djnz e
				| im 0 | im 1 | im 2
				| inc r
				| jp (hl) | jp (ix) | jp (iy) | jp 
				| jr e
				| pop qq
				| push qq
				| ret cc
				| rl m
				| rlc r
				| rr m
				| rrc m
				| rst p
				| sla m
				| sra m
				| srl m

	instruction

	s = a | b | c | d | e | h | l | expression | (hl) | (ix + d) | (iy + d)
	m = a | b | c | d | e | h | l | bc | de | hl | ix | iy | (hl) | (ix+d) | (iy+d)
	r = a | b | c | d | e | h | l | bc | de | hl | ix | iy | (hl) | (ix+d) | (iy+d)
	qq = af | bc | de | hl | ix | iy | sp
	p

	ss = hl | bc | de | sp
	pp = af | bc | de | hl

	cc = nz | z | nc | c | po | pe | p | 'm'

	b = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

	e = -128 <= number <= 127

	op_code = 	reserved_word arguments

	arguments = arg1 | arg1,arg2

	arg1	= (z80 argument set) | #
	arg2	= (z80 argument set)


 28th Jan 2002:
-----------------
	Removed Recursion from term and factor routines.
	Added code to evaluate an expression as it is parsed.
	- Started extension of expression parser to include
	logical, relational, unary and booleen operators.

 31st Jan 2002:
----------------
	Patched in code for postfix (Reverse Polish Notation -RPN)
calculator to evaluate constant expressions.

 2nd February 2002:
--------------------
	Added code generation routines, parsing and evaluation of
	defb, defw and ORG. improved scanner to read data in faster
	output byte codes for single byte instructions, range checking
	for defb and defw added.

 3rd February 2002:
--------------------
	Various expression code cleanups to increase compilation
	speed (changed debug code to optional output)

	Added code to allow address constants to be filled in
	after code has been generated.

 14th March 2002:
------------------
	Tested simple call instructions.
	Added code to support RET instructions.

	Started implementing LD statement parsing.


	 LD statements:
	---------------

	All LD statements have two operands.

	dd = BC, DE, HL
	r = A, B, C, D, E, H, L, (HL)

	others = IX,IY,SP,I,R, (ix+d), (iy+d), nn, (nn)

			prefix code	byte	word
	ld dd,(nn)	ED	4B	-	nn
`	ld dd,nn	-	01	-	nn
	ld ix,nn	DD	21	-	nn
	ld iy,nn	FD	21	-	nn
	ld a,(nn)	-	3A	-	nn

	ld hl,(nn)	-	2A	-	nn
	ld ix,(nn)	DD	2A	-	nn
	ld iy,(nn)	DD	2A	-	nn

	ld (nn),a	-

	ld (nn),dd
	ld (nn),hl
	ld (nn),ix
	ld (nn),iy


	ld r,n
	ld r,r
	ld r,(ix+d)
	ld r,(iy+d)
	ld r,(hl)


	ld (bc),a
	ld (de),a

	ld (hl),n
	ld (ix+d),n
	ld (iy+d),n

	ld a,(bc)
	ld a,(de)
	ld a,i
	ld a,R

	ld (hl),r
	ld (ix+d),r
	ld (iy+d),r

	ld i,a

	ld R,a

	ld sp,hl
	ld sp,ix
	ld sp,iy

 	 25th March 2002
	-----------------
	Added code for table based assembly of a large number
	of instructions.

	 26th March 2002
	-----------------
	Added code for IM, SET, RES, BIT instructions

	 27th March 2002
	-----------------
	Added code for relative jumps. Required modifying
	constant table to distinguish between branch constants and
	address constants.

	Also added some LD instruction support.

	 28th March 2002
	-----------------
	Added rudimentary support for conditional assembly
	using 'if' and 'end' directives. Also added DEFS
	to allow space to be allocated within the code.

	 29th March 2002
	-----------------
	  Renamed DEFS to DEFM and re-wrote defs to be compatible
	with previous versions of assembler. Added DEFS to allow
	ascii strings to be defined in the code.
	Corrected GetOperand to allow forward referenced labels to
	be used.

	 31st March 2002
	-----------------
		Added untested support for the following undocumented
	op-codes:

OPCODE       INSTRUCTION        OPCODE        INSTRUCTION 
  -----------  -----------------  ------------  ------------
  #DD #24      INC  IXH           #FD #24       INC  IYH
  #DD #25      DEC  IXH           #FD #25       DEC  IYH
  #DD #26 nn   LD   IXH,nn        #FD #26 nn    LD   IYH,nn
  #DD #2C      INC  IXL           #FD #2C       INC  IYL
  #DD #2D      DEC  IXL           #FD #2D       DEC  IYL
  #DD #2E nn   LD   IXL,nn        #FD #2E nn    LD   IYL,nn
  #DD #44      LD   B,IXH         #FD #44       LD   B,IYH
  #DD #45      LD   B,IXL         #FD #45       LD   B,IYL
  #DD #4C      LD   C,IXH         #FD #4C       LD   C,IYH
  #DD #4D      LD   C,IXL         #FD #4D       LD   C,IYL
  #DD #54      LD   D,IXH         #FD #54       LD   D,IYH
  #DD #55      LD   D,IXL         #FD #55       LD   D,IYL
  #DD #5C      LD   E,IXH         #FD #5C       LD   E,IYH
  #DD #5D      LD   E,IXL         #FD #5D       LD   E,IYL
  #DD #60      LD   IXH,B         #FD #60       LD   IYH,B
  #DD #61      LD   IXH,C         #FD #61       LD   IYH,C
  #DD #62      LD   IXH,D         #FD #62       LD   IYH,D
  #DD #63      LD   IXH,E         #FD #63       LD   IYH,E
  #DD #64      LD   IXH,IXH       #FD #64       LD   IYH,IYH
  #DD #65      LD   IXH,IXL       #FD #65       LD   IYH,IYL
  #DD #67      LD   IXH,A         #FD #67       LD   IYH,A
  #DD #68      LD   IXL,B         #FD #68       LD   IYL,B
  #DD #69      LD   IXL,C         #FD #69       LD   IYL,C
  #DD #6A      LD   IXL,D         #FD #6A       LD   IYL,D
  #DD #6B      LD   IXL,E         #FD #6B       LD   IYL,E
  #DD #6C      LD   IXL,IXH       #FD #6C       LD   IYL,IYH
  #DD #6D      LD   IXL,IXL       #FD #6D       LD   IYL,IYL
  #DD #6F      LD   IXL,A         #FD #6F       LD   IYL,A
  #DD #7C      LD   A,IXH         #FD #7C       LD   A,IYH
  #DD #7D      LD   A,IXL         #FD #7D       LD   A,IYL
  #DD #84      ADD  A,IXH         #FD #84       ADD  A,IYH
  #DD #85      ADD  A,IXL         #FD #85       ADD  A,IYL
  #DD #8C      ADC  A,IXH         #FD #8C       ADC  A,IYH
  #DD #8D      ADC  A,IXL         #FD #8D       ADC  A,IYL
  #DD #94      SUB  IXH           #FD #94       SUB  IYH
  #DD #95      SUB  IXL           #FD #95       SUB  IYL
  #DD #9C      SBC  A,IXH         #FD #9C       SBC  A,IYH
  #DD #9D      SBC  A,IXL         #FD #9D       SBC  A,IYL
  #DD #A4      AND  IXH           #FD #A4       AND  IYH
  #DD #A5      AND  IXL           #FD #A5       AND  IYL
  #DD #AC      XOR  IXH           #FD #AC       XOR  IYH
  #DD #AD      XOR  IXL           #FD #AD       XOR  IYL
  #DD #B4      OR   IXH           #FD #B4       OR   IYH
  #DD #B5      OR   IXL           #FD #B5       OR   IYL
  #DD #BC      CP   IXH           #FD #BC       CP   IYH
  #DD #BD      CP   IXL           #FD #BD       CP   IYL

	(as described at : http://www.geocities.com/SiliconValley/Peaks/3938/z80undoc.htm )


	 15th April 2002:
	------------------
	Extended incbin to enable people to load files in at any address.
	No checks are to be done for overlaps with existing code.
	New syntax is :
		incbin "filename" , load_address

	 22nd April 2002:
	------------------
		Fixed output bugs with add iy, rr (outputs dd, instead of fd).

	 23rd April 2002:
	-----------------
		Fixed incbin bug where it would fail if you tried to load
	into the very top byte of z80 ram.

	 8th March 2004
	----------------
		Added dbin keyword for binary string stuff.

	 TO DO:
	--------
		Undocumented commands.
		IX + IY based commands with offset addressing (ix+d) (iy+d)
		test defs.








	To Do 10th September 2023
--------------------------------------------
	Check token_buffer is required, as the scanner now contains
	its own token buffer .


	 12th September 2023
	-----------------------
		I changed the return code for Label_LabelExists without
	updating the code that checks the return value.. so fixing that
	today.


	 14th September 2023
	---------------------
	changed the order tokens are scanned in for _pass_one_term  
	as it was reading past the divide token before processing the
	data to the right of the '/'.

	Need to test to see if add/subtract suffer the same.


----------------------------------------------------------------- */

	// -- code generation options

//#define TEST_EXPR
//#define WARN_ADDR_IN_EXPR	1

	// --- constants ---



var INVALID_TOKEN_ID = -1;

var _tk=0;
var	TOKEN_UNKNOWN = _tk++;		// not sure if this should be defined here.
var	TOKEN_DOUBLEQUOTE = _tk++;
var	TOKEN_QUOTE = _tk++;
var	TOKEN_PLUS = _tk++;
var	TOKEN_MINUS = _tk++;
var	TOKEN_ASTERISK = _tk++;
var	TOKEN_DIVIDE = _tk++;
var	TOKEN_EQUALS = _tk++;
var	TOKEN_LESSTHAN = _tk++;
var	TOKEN_GREATERTHAN = _tk++;
var	TOKEN_AMPERSAND = _tk++;
var	TOKEN_UNDERSCORE = _tk++;
var	TOKEN_PERCENT = _tk++;
var	TOKEN_LEFTBRACKET = _tk++;
var	TOKEN_RIGHTBRACKET = _tk++;
var	TOKEN_LEFTBRACE = _tk++;
var	TOKEN_RIGHTBRACE = _tk++;
var	TOKEN_LEFTSQRBRACKET = _tk++;
var	TOKEN_RIGHTSQRBRACKET = _tk++;
var	TOKEN_AT = _tk++;
var	TOKEN_COLON = _tk++;
var	TOKEN_SEMICOLON = _tk++;
var	TOKEN_BACKSLASH = _tk++;
var	TOKEN_COMMA = _tk++;
var	TOKEN_FULLSTOP = _tk++;
var	TOKEN_HASH = _tk++;
var	TOKEN_TILDE = _tk++;
var	TOKEN_QUESTIONMARK = _tk++;
var	TOKEN_EXCLAMATIONMARK = _tk++;
var	TOKEN_DOLLARSIGN = _tk++;
var	TOKEN_POUNDSIGN = _tk++;
var	TOKEN_VERTICALLINE = _tk++;
var	TOKEN_CIRCUMFLEX = _tk++;

var	TOKEN_A = _tk++;
var	TOKEN_B = _tk++;
var	TOKEN_C = _tk++;
var	TOKEN_D = _tk++;
var	TOKEN_E = _tk++;
var	TOKEN_H = _tk++;
var	TOKEN_L = _tk++;
var	TOKEN_I = _tk++;
var	TOKEN_R = _tk++;
var	TOKEN_AF = _tk++;
var	TOKEN_BC = _tk++;
var	TOKEN_DE = _tk++;
var	TOKEN_HL = _tk++;
var	TOKEN_SP = _tk++;
var	TOKEN_IX = _tk++;
var	TOKEN_IY = _tk++;
var	TOKEN_CARRY = _tk++;
var	TOKEN_NOCARRY = _tk++;
var	TOKEN_ZERO = _tk++;
var	TOKEN_NOTZERO = _tk++;
var	TOKEN_PO = _tk++;
var	TOKEN_PE = _tk++;
var	TOKEN_P = _tk++;
var	TOKEN_M = _tk++;
	
var TOKEN_ADC = _tk++;
var TOKEN_ADD = _tk++;
var TOKEN_AND = _tk++;
var TOKEN_BIT = _tk++;
var TOKEN_CALL = _tk++;
var TOKEN_CCF = _tk++;
var TOKEN_CP = _tk++;
var TOKEN_CPD = _tk++;
var TOKEN_CPDR = _tk++;
var TOKEN_CPI = _tk++;
var TOKEN_CPIR = _tk++;
var TOKEN_CPL = _tk++;
var TOKEN_DAA = _tk++;
var TOKEN_DEC = _tk++;
var TOKEN_DI = _tk++;
var TOKEN_DJNZ = _tk++;
var TOKEN_EI = _tk++;
var TOKEN_EX = _tk++;
var TOKEN_EXX = _tk++;
var TOKEN_HALT = _tk++;
var TOKEN_IM = _tk++;
var TOKEN_IN = _tk++;
var TOKEN_INC = _tk++;
var TOKEN_IND = _tk++;
var TOKEN_INDR = _tk++;
var TOKEN_INI = _tk++;
var TOKEN_INIR = _tk++;
var TOKEN_JP = _tk++;
var TOKEN_JR = _tk++;
var TOKEN_LD = _tk++;
var TOKEN_LDD = _tk++;
var TOKEN_LDDR = _tk++;
var TOKEN_LDI = _tk++;
var TOKEN_LDIR = _tk++;
var TOKEN_NEG = _tk++;
var TOKEN_NOP = _tk++;
var TOKEN_OR = _tk++;
var TOKEN_OTDR = _tk++;
var TOKEN_OTIR = _tk++;
var TOKEN_OUT = _tk++;
var TOKEN_OUTD = _tk++;
var TOKEN_OUTI = _tk++;
var TOKEN_POP = _tk++;
var TOKEN_PUSH = _tk++;
var TOKEN_RES = _tk++;
var TOKEN_RET = _tk++;
var TOKEN_RETI = _tk++;
var TOKEN_RETN = _tk++;
var TOKEN_RL = _tk++;
var TOKEN_RLA = _tk++;
var TOKEN_RLC = _tk++;
var TOKEN_RLCA = _tk++;
var TOKEN_RLD = _tk++;
var TOKEN_RR = _tk++;
var TOKEN_RRA = _tk++;
var TOKEN_RRC = _tk++;
var TOKEN_RRCA = _tk++;
var TOKEN_RRD = _tk++;
var TOKEN_RST = _tk++;
var TOKEN_SBC = _tk++;
var TOKEN_SCF = _tk++;
var TOKEN_SET = _tk++;
var TOKEN_SLA = _tk++;
var TOKEN_SRA = _tk++;
var TOKEN_SRL = _tk++;
var TOKEN_SUB = _tk++;
var TOKEN_XOR = _tk++;

var TOKEN_DEFB = _tk++;
var TOKEN_DEFW = _tk++;
var TOKEN_DEFL = _tk++;
var TOKEN_DEFS = _tk++;
var TOKEN_DEFM = _tk++;
var TOKEN_ORG = _tk++;
var TOKEN_EQU = _tk++;
var TOKEN_INCLUDE = _tk++;
var TOKEN_INCBIN = _tk++;
var TOKEN_DBIN = _tk++;

		// composite tokens.
var TOKEN_GREATER_OR_EQUAL = _tk++;
var TOKEN_LESS_OR_EQUAL = _tk++;
var TOKEN_SHIFTLEFT = _tk++;
var TOKEN_SHIFTRIGHT = _tk++;
var TOKEN_NOT_EQUAL = _tk++;
var TOKEN_IS_EQUAL = _tk++;			// ==

var TOKEN_LOGICAL_AND = _tk++;
var TOKEN_LOGICAL_OR = _tk++;

var TOKEN_IF = _tk++;
var TOKEN_END = _tk++;
var TOKEN_ELSE = _tk++;

var TOKEN_IXH = _tk++;
var TOKEN_IXL = _tk++;
var TOKEN_IYH = _tk++;
var TOKEN_IYL = _tk++;

var _token_Z80_tokens =
[
	"\"",	TOKEN_DOUBLEQUOTE,	
	"'",	TOKEN_QUOTE,		
	"+",	TOKEN_PLUS,		
	"-",	TOKEN_MINUS,
	"*",	TOKEN_ASTERISK,
	"/",	TOKEN_DIVIDE,
	"=",	TOKEN_EQUALS,
	"<",	TOKEN_LESSTHAN,
	">",	TOKEN_GREATERTHAN,
	"&",	TOKEN_AMPERSAND,
	"_",	TOKEN_UNDERSCORE,
	"%",	TOKEN_PERCENT,
	"(",	TOKEN_LEFTBRACKET,
	")",	TOKEN_RIGHTBRACKET,
	"{",	TOKEN_LEFTBRACE,
	"}",	TOKEN_RIGHTBRACE,
	"[",	TOKEN_LEFTSQRBRACKET,
	"]",	TOKEN_RIGHTSQRBRACKET,
	"@",	TOKEN_AT,
	"^",	TOKEN_CIRCUMFLEX,

	":",	TOKEN_COLON,
	";",	TOKEN_SEMICOLON,	
	"\\",	TOKEN_BACKSLASH,	
	",",	TOKEN_COMMA,		
	".",	TOKEN_FULLSTOP,		
	"#",	TOKEN_HASH,		
	"~",	TOKEN_TILDE,		
	"?",	TOKEN_QUESTIONMARK,	
	"!",	TOKEN_EXCLAMATIONMARK,
	"$",	TOKEN_DOLLARSIGN,	
	"£",	TOKEN_POUNDSIGN,	
	"|",	TOKEN_VERTICALLINE,	
			
	"a",	TOKEN_A,		
	"b",	TOKEN_B,		
	"c",	TOKEN_C,		
	"d",	TOKEN_D,		
	"e",	TOKEN_E,		
	"h",	TOKEN_H,		
	"l",	TOKEN_L,		
	"i",	TOKEN_I,		
	"r",	TOKEN_R,		
	"af",	TOKEN_AF,		
	"bc",	TOKEN_BC,		
	"de",	TOKEN_DE,		
	"hl",	TOKEN_HL,		
	"sp",	TOKEN_SP,		
	"ix",	TOKEN_IX,		
	"iy",	TOKEN_IY,		

	"c",	TOKEN_CARRY,	
	"nc",	TOKEN_NOCARRY,	
	"z",	TOKEN_ZERO,	
	"nz",	TOKEN_NOTZERO,	
	"po",	TOKEN_PO,	
	"pe",	TOKEN_PE,	
	"p",	TOKEN_P,	
	"m",	TOKEN_M,	

	"adc",	TOKEN_ADC,	
	"add",	TOKEN_ADD,	
	"and",	TOKEN_AND,	
	"bit",	TOKEN_BIT,	
	"call",	TOKEN_CALL,	
	"ccf",	TOKEN_CCF,	
	"cp",	TOKEN_CP,	
	"cpd",	TOKEN_CPD,	
	"cpdr",	TOKEN_CPDR,	
	"cpi",	TOKEN_CPI,	
	"cpir",	TOKEN_CPIR,	
	"cpl",	TOKEN_CPL,	
	"daa",	TOKEN_DAA,	
	"dec",	TOKEN_DEC,	
	"di",	TOKEN_DI,	
	"djnz",	TOKEN_DJNZ,	
	"ei",	TOKEN_EI,	
	"ex",	TOKEN_EX,	
	"exx",	TOKEN_EXX,	
	"halt",	TOKEN_HALT,	
	"im",	TOKEN_IM,	
	"in",	TOKEN_IN,	
	"inc",	TOKEN_INC,	
	"ind",	TOKEN_IND,	
	"indr",	TOKEN_INDR,	
	"ini",	TOKEN_INI,	
	"inir",	TOKEN_INIR,	
	"jp",	TOKEN_JP,	
	"jr",	TOKEN_JR,	
	"ld",	TOKEN_LD,	
	"ldd",	TOKEN_LDD,	
	"lddr",	TOKEN_LDDR,	
	"ldi",	TOKEN_LDI,	
	"ldir",	TOKEN_LDIR,	
	"neg",	TOKEN_NEG,	
	"nop",	TOKEN_NOP,	
	"or",	TOKEN_OR,	
	"otdr",	TOKEN_OTDR,	
	"otir",	TOKEN_OTIR,	
	"out",	TOKEN_OUT,	
	"outd",	TOKEN_OUTD,	
	"outi",	TOKEN_OUTI,	
	"pop",	TOKEN_POP,	
	"push",	TOKEN_PUSH,	
	"res",	TOKEN_RES,	
	"ret",	TOKEN_RET,	
	"reti",	TOKEN_RETI,	
	"retn",	TOKEN_RETN,	
	"rl",	TOKEN_RL,	
	"rla",	TOKEN_RLA,	
	"rlc",	TOKEN_RLC,	
	"rlca",	TOKEN_RLCA,	
	"rld",	TOKEN_RLD,	
	"rr",	TOKEN_RR,	
	"rra",	TOKEN_RRA,	
	"rrc",	TOKEN_RRC,	
	"rrca",	TOKEN_RRCA,	
	"rrd",	TOKEN_RRD,	
	"rst",	TOKEN_RST,	
	"sbc",	TOKEN_SBC,	
	"scf",	TOKEN_SCF,	
	"set",	TOKEN_SET,	
	"sla",	TOKEN_SLA,	
	"sra",	TOKEN_SRA,	
	"srl",	TOKEN_SRL,	
	"sub",	TOKEN_SUB,	
	"xor",	TOKEN_XOR,	

	"defb",	TOKEN_DEFB,	
	"defw",	TOKEN_DEFW,	
	"defl",	TOKEN_DEFL,	
	"defs",	TOKEN_DEFS,	
	"defm",	TOKEN_DEFM,	
	"org",	TOKEN_ORG,	
	"equ",	TOKEN_EQU,	
	"include",TOKEN_INCLUDE,	
	"incbin",TOKEN_INCBIN,	
	"dbin",	TOKEN_DBIN,	

	"<<",	TOKEN_SHIFTLEFT, 	
	">>",	TOKEN_SHIFTRIGHT, 	
	">=",	TOKEN_GREATER_OR_EQUAL, 
	"<=",	TOKEN_LESS_OR_EQUAL,	
	"!=",	TOKEN_NOT_EQUAL,	
	"==",	TOKEN_IS_EQUAL,		

	"_and",	TOKEN_LOGICAL_AND,	
	"_or",	TOKEN_LOGICAL_OR,	

	"if",	TOKEN_IF,		
	"else",	TOKEN_ELSE,		
	"end",	TOKEN_END,		


		// undocumented codes
	"ixh",	TOKEN_IXH,		
	"ixl",	TOKEN_IXL,		
	"iyh",	TOKEN_IYH,		
	"iyl",	TOKEN_IYL,		


	"~123#XXX",INVALID_TOKEN_ID
];	//			};




























var TOKEN_BUFFER_SIZE = 256;
var INVALID_REGISTER_CODE = -1;
var INVALID_PREFIX_CODE	= -1;

var LABEL_TYPE_ADDRESS = 0;
var LABEL_TYPE_CONSTANT	= 1;

var ERROR_LEVEL_NO_ERROR = 	0;	// normal state.
var ERROR_LEVEL_WARNING	 =	1;	// always continue
var ERROR_LEVEL_ERROR	 =	2;	// continue if possible, starting at next line
var ERROR_LEVEL_FATAL	 =	3;	// stop processing

var INVALID_CC_CODE = -1;

	// composite tokens

var TOKEN_ADDR_BC 	=	10000;		//(BC)
var TOKEN_ADDR_DE 	=	10005;		//(DE)
var TOKEN_ADDR_HL 	=	10010;		//(HL)
var TOKEN_ADDR_IX 	=	10015;		//(IX)
var TOKEN_ADDR_IY 	=	10020;		//(IY)
var TOKEN_ADDR_SP 	=	10025;		//(SP)		for ex (sp),hl
var TOKEN_NUMBER 	=	10030;		// n or nn
var TOKEN_ADDR 		=	10035;		// (nn)
var TOKEN_LABEL 	=	10040;		// forward referenced label
var TOKEN_ADDR_LABEL= 	10045;	// (label) forward referenced label
var TOKEN_PORT_C 	=	10050;
var TOKEN_ADDR_C 	=	10055;

//#include <stdio.h>
//#include "clibs.h"

//#include "msgs.h"

//#include "const.h"
//#include "pass_one.h"
//#include "tokens.h"
//#include "labels.h"

//#include "z80.h"
//#include "exprcalc.h"

function Z80_INSTRUCTION()
{
	this.prefix_code;

	this.immediate_data;
	this.immediate_data_size;	// 1 or 2 bytes

	this.opcode_one_token_id;
	this.opcode_one_register_code;

	this.opcode_two_token_id;
	this.opcode_two_register_code;
}
/*
typedef struct
{
	int prefix_code;

	int immediate_data;
	int immediate_data_size;	// 1 or 2 bytes

	int opcode_one_token_id;
	int opcode_one_register_code;

	int opcode_two_token_id;
	int opcode_two_register_code;
} Z80_INSTRUCTION;
*/

function REGISTER_CODE()
{
	this.token_id;
	this.code;

}
/*
typedef struct
{
	int token_id;
	int code;
} REGISTER_CODE;
*/
//extern int _ProgramOrg;

	// forward declaration for recursion of expression parsing.
//int _pass_one_expression (SCANNER* scanner, char* token_buffer);

	// forward declaration for retrieving operands
//int _pass_one_GetOperand (SCANNER* scanner, char* token_buffer, int* operand);

function SIMPLE_INSTRUCTION()
{
	this.token_id;
	this.instruction_code;
}
/*
typedef struct
{
	int token_id;
	int instruction_code;
} SIMPLE_INSTRUCTION;
*/

//SIMPLE_INSTRUCTION _simple_instruction_table [] =
var _simple_instruction_table =
[
		// single word, single byte instructions

	TOKEN_CCF,	0x3f,
	TOKEN_CPL,	0x2f,
	TOKEN_DAA, 	0x27,
	TOKEN_DI,	0xf3,
	TOKEN_EI, 	0xfb,
	TOKEN_EXX, 	0xd9,
	TOKEN_HALT, 0x76,
	TOKEN_NOP,	0x00,
	TOKEN_RLA,	0x17,
	TOKEN_RLCA, 0x07,
	TOKEN_RRA, 	0x1f,
	TOKEN_RRCA,	0x0f,
	TOKEN_SCF,	0x37,

		// single word, two byte instructions

	TOKEN_CPD, 	0xEDA9,
	TOKEN_CPDR, 0xEDB9,
	TOKEN_CPI,	0xEDA1,
	TOKEN_CPIR,	0xEDB1,
	TOKEN_IND, 	0xEDAA,
	TOKEN_INDR, 0xEDBA,
	TOKEN_INI, 	0xEDA2,
	TOKEN_INIR,	0xEDB2,
	TOKEN_LDD, 	0xEDA8,
	TOKEN_LDDR, 0xEDB8,
	TOKEN_LDI, 	0xEDA0,
	TOKEN_LDIR,	0xEDB0,	// corrected 4/4/2002
	TOKEN_NEG, 	0xED44,
	TOKEN_OTDR, 0xEDBB,
	TOKEN_OTIR, 0xEDB3,
	TOKEN_OUTD, 0xEDAB,
	TOKEN_OUTI, 0xEDA3,
	TOKEN_RETI, 0xED4D,
	TOKEN_RETN, 0xED45,
	TOKEN_RLD,	0xED6F,
	TOKEN_RRD,	0xED67,

		// token list terminator.

	INVALID_TOKEN_ID, INVALID_TOKEN_ID
];

//REGISTER_CODE register_code_table [] = 
var register_code_table =
[
	TOKEN_BC, 0,
	TOKEN_DE, 1,
	TOKEN_HL, 2,
	TOKEN_IX, 2,
	TOKEN_IY, 2,
	TOKEN_SP, 3,
	TOKEN_AF, 3,
	TOKEN_B, 0,
	TOKEN_C, 1,
	TOKEN_D, 2,
	TOKEN_E, 3,
	TOKEN_H, 4,
	TOKEN_L, 5,
	TOKEN_ADDR_HL, 6,
	TOKEN_A, 7,
	TOKEN_I, 0,		// not sure about this value
	TOKEN_R, 0,		// not sure about this value
	INVALID_TOKEN_ID, 0
];

//int _pass_one_simple_opcode [] =
var _pass_one_simple_opcode =
[
	TOKEN_BC,	TOKEN_DE,	TOKEN_HL,	TOKEN_IX,
	TOKEN_IY,	TOKEN_SP,	TOKEN_AF, 

	TOKEN_A,	TOKEN_B,	TOKEN_C,	TOKEN_D,
	TOKEN_E,	TOKEN_H,	TOKEN_L,

	TOKEN_I,	TOKEN_R,
	INVALID_TOKEN_ID,
];


/* ----- HUGE table for generating instructions with ------ */

// data stored :	instruction token_id,
//			opcode1,
//			opcode2,
//			instruction size
//			instruction byte 1,
//			instruction byte 2

function OPCODE_INFO()
{
	this.instruction_token_id;
	this.number_of_opcodes;
}

/*
typedef struct
{
	int instruction_token_id;
	int number_of_opcodes;
} OPCODE_INFO;
*/

//OPCODE_INFO misc_opcode_info [] =
var misc_opcode_info =
[
	TOKEN_ADC,	2,
	TOKEN_ADD,	2,
	TOKEN_AND,	1,
	TOKEN_CP,	1,
	TOKEN_DEC,	1,
	TOKEN_EX,	2,
	TOKEN_IN,	2,
	TOKEN_INC,	1,
	TOKEN_LD,	2,
	TOKEN_OR,	1,
	TOKEN_OUT,	2,
	TOKEN_POP,	1,
	TOKEN_PUSH,	1,
	TOKEN_RL,	1,
	TOKEN_RLC,	1,
	TOKEN_RR,	1,
	TOKEN_RRC,	1,
	TOKEN_SBC,	2,
	TOKEN_SLA,	1,
	TOKEN_SRA,	1,
	TOKEN_SRL,	1,
	TOKEN_SUB,	1,
	TOKEN_XOR,	1,

	INVALID_TOKEN_ID, 0
];

function INSTRUCTION_INFO()
{
	this.instruction_token_id;
	this.opcode_one;
	this.opcode_two;
	this.size;
	this.instruction_byte_one;
	this.instruction_byte_two;
}

/*
typedef struct
{
	int instruction_token_id;
	int opcode_one;
	int opcode_two;
	int size;
	int instruction_byte_one;
	int instruction_byte_two;
} INSTRUCTION_INFO;
*/
	// This has to be the most boring table in the world
	// (but saves loads of coding time).
//INSTRUCTION_INFO misc_instructions []=
var misc_instructions =
[
		// adc a,r
	TOKEN_ADC,	TOKEN_A,	TOKEN_B,		1,	0x88,	-1,
	TOKEN_ADC,	TOKEN_A,	TOKEN_C,		1,	0x89,	-1,
	TOKEN_ADC,	TOKEN_A,	TOKEN_D,		1,	0x8A,	-1,
	TOKEN_ADC,	TOKEN_A,	TOKEN_E,		1,	0x8B,	-1,
	TOKEN_ADC,	TOKEN_A,	TOKEN_H,		1,	0x8C,	-1,
	TOKEN_ADC,	TOKEN_A,	TOKEN_L,		1,	0x8D,	-1,
	TOKEN_ADC,	TOKEN_A,	TOKEN_ADDR_HL,	1,	0x8E,	-1,
	TOKEN_ADC,	TOKEN_A,	TOKEN_A,		1,	0x8F,	-1,

		// adc a,n

	TOKEN_ADC,	TOKEN_A,	TOKEN_NUMBER,	2,	0xCE,	-1,

		// adc a,(ix+d) adc a,(iy+d)
//	TOKEN_ADC,	TOKEN_A,	TOKEN_ADDR_IX,	3,	0xDD, 0x8E,
//	TOKEN_ADC,	TOKEN_A,	TOKEN_ADDR_IY,	3,	0xFD,	0x8E,

		// adc hl,ss
	TOKEN_ADC,	TOKEN_HL,	TOKEN_BC,		2,	0xED,	0x4A,
	TOKEN_ADC,	TOKEN_HL,	TOKEN_DE,		2,	0xED, 0x5A,
	TOKEN_ADC,	TOKEN_HL,	TOKEN_HL,		2,	0xED, 0x6A,
	TOKEN_ADC,	TOKEN_HL,	TOKEN_SP,		2,	0xED, 0x7A,

		// add a,r
	TOKEN_ADD,	TOKEN_A,	TOKEN_B,		1,	0x80,	-1,
	TOKEN_ADD,	TOKEN_A,	TOKEN_C,		1,	0x81,	-1,
	TOKEN_ADD,	TOKEN_A,	TOKEN_D,		1,	0x82,	-1,
	TOKEN_ADD,	TOKEN_A,	TOKEN_E,		1,	0x83,	-1,
	TOKEN_ADD,	TOKEN_A,	TOKEN_H,		1,	0x84,	-1,
	TOKEN_ADD,	TOKEN_A,	TOKEN_L,		1,	0x85,	-1,
	TOKEN_ADD,	TOKEN_A,	TOKEN_ADDR_HL,	1,	0x86,	-1,
	TOKEN_ADD,	TOKEN_A,	TOKEN_A,		1,	0x87,	-1,

		// add a,n
	TOKEN_ADD,	TOKEN_A,	TOKEN_NUMBER,	2,	0xC6,	-1,

		// add a,(ix+d) adc a,(iy+d)
//	TOKEN_ADD,	TOKEN_A,	TOKEN_ADDR_IX,	3,	0xDD, 0x86,
//	TOKEN_ADD,	TOKEN_A,	TOKEN_ADDR_IY,	3,	0xFD,	0x86,

		// add hl,ss

	TOKEN_ADD,	TOKEN_HL,	TOKEN_BC,		1,	0x09,	-1,
	TOKEN_ADD,	TOKEN_HL,	TOKEN_DE,		1,	0x19, -1,
	TOKEN_ADD,	TOKEN_HL,	TOKEN_HL,		1,	0x29, -1,
	TOKEN_ADD,	TOKEN_HL,	TOKEN_SP,		1,	0x39, -1,

		// add ix, rr
	TOKEN_ADD,	TOKEN_IX,	TOKEN_BC,		1,	0xDD, 0x09,
	TOKEN_ADD,	TOKEN_IX,	TOKEN_DE,		1,	0xDD, 0x19,
	TOKEN_ADD,	TOKEN_IX,	TOKEN_IX,		1,	0xDD, 0x29,
	TOKEN_ADD,	TOKEN_IX,	TOKEN_SP,		1,	0xDD, 0x39,

		// add iy, rr
	TOKEN_ADD,	TOKEN_IY,	TOKEN_BC,		1,	0xFD, 0x09,
	TOKEN_ADD,	TOKEN_IY,	TOKEN_DE,		1,	0xFD, 0x19,
	TOKEN_ADD,	TOKEN_IY,	TOKEN_IX,		1,	0xFD, 0x29,
	TOKEN_ADD,	TOKEN_IY,	TOKEN_SP,		1,	0xFD, 0x39,

		// and r
	TOKEN_AND,	TOKEN_B,		-1,			1,	0xA0, -1,
	TOKEN_AND,	TOKEN_C,		-1,			1,	0xA1, -1,
	TOKEN_AND,	TOKEN_D,		-1,			1,	0xA2, -1,
	TOKEN_AND,	TOKEN_E,		-1,			1,	0xA3, -1,
	TOKEN_AND,	TOKEN_H,		-1,			1,	0xA4, -1,
	TOKEN_AND,	TOKEN_L,		-1,			1,	0xA5, -1,
	TOKEN_AND,	TOKEN_ADDR_HL,	-1,			1,	0xA6, -1,
	TOKEN_AND,	TOKEN_A,		-1,			1,	0xA7, -1,

		// and n
	TOKEN_AND,	TOKEN_NUMBER,	-1,			1,	0xE6,	-1,

		// and (ix+d)		and (iy+d)

//	TOKEN_AND,	TOKEN_ADDR_IX,	-1,			3,	0xDD,0xA6,
//	TOKEN_AND,	TOKEN_ADDR_IY,	-1,			3,	0xFD,0xA6,

		// bit - special case, not dealt with here.

		// cp r

	TOKEN_CP,	TOKEN_B,		-1,			1,	0xB8, -1,
	TOKEN_CP,	TOKEN_C,		-1,			1,	0xB9, -1,
	TOKEN_CP,	TOKEN_D,		-1,			1,	0xBA, -1,
	TOKEN_CP,	TOKEN_E,		-1,			1,	0xBB, -1,
	TOKEN_CP,	TOKEN_H,		-1,			1,	0xBC, -1,
	TOKEN_CP,	TOKEN_L,		-1,			1,	0xBD, -1,
	TOKEN_CP,	TOKEN_ADDR_HL,	-1,			1,	0xBE, -1,
	TOKEN_CP,	TOKEN_A,		-1,			1,	0xBF, -1,

		// cp n

	TOKEN_CP,	TOKEN_NUMBER,	-1,			2,	0xFE, -1,

		// cp (ix+d)	cp (iy+d)

//	TOKEN_CP,	TOKEN_ADDR_IX,	-1,			2,	0xDD, 0xBE,
//	TOKEN_CP,	TOKEN_ADDR_IY,	-1,			2,	0xFD,	0xBE,

		// dec r

	TOKEN_DEC,	TOKEN_B,		-1,			1,	0x05, -1,
	TOKEN_DEC,	TOKEN_C,		-1,			1,	0x0D, -1,
	TOKEN_DEC,	TOKEN_D,		-1,			1,	0x15, -1,
	TOKEN_DEC,	TOKEN_E,		-1,			1,	0x1D, -1,
	TOKEN_DEC,	TOKEN_H,		-1,			1,	0x25, -1,
	TOKEN_DEC,	TOKEN_L,		-1,			1,	0x2D, -1,
	TOKEN_DEC,	TOKEN_ADDR_HL,	-1,			1,	0x35, -1,
	TOKEN_DEC,	TOKEN_A,		-1,			1,	0x3D, -1,

		// dec (ix+d)		dec (iy+d)
//	TOKEN_DEC,	TOKEN_ADDR_IX,	-1,			2,	0xDD, 0x2B,
//	TOKEN_DEC,	TOKEN_ADDR_IY,	-1,			2,	0xFD, 0x2B,

		// dec rr
	TOKEN_DEC,	TOKEN_BC,		-1,			1,	0x0B,	-1,
	TOKEN_DEC,	TOKEN_DE,		-1,			1,	0x1B,	-1,
	TOKEN_DEC,	TOKEN_HL,		-1,			1,	0x2B,	-1,
	TOKEN_DEC,	TOKEN_SP,		-1,			1,	0x3B,	-1,

		// dec ix 		dec iy
	TOKEN_DEC,	TOKEN_IX,		-1,			2,	0xDD, 0x2B,
	TOKEN_DEC,	TOKEN_IY,		-1,			2,	0xFD,	0x2B,

		// ex dd,dd
	TOKEN_EX,	TOKEN_AF,		TOKEN_AF,		1,	0x08, -1,
	TOKEN_EX,	TOKEN_DE,		TOKEN_HL,		1,	0xEB, -1,
	TOKEN_EX,	TOKEN_ADDR_SP,	TOKEN_HL,		1,	0xE3, -1,
	TOKEN_EX,	TOKEN_ADDR_SP,	TOKEN_IX,		2,	0xDD,	0xE3,
	TOKEN_EX,	TOKEN_ADDR_SP,	TOKEN_IY,		2,	0xFD,	0xE3,

		// in r,(c)

	TOKEN_IN,	TOKEN_B,		TOKEN_PORT_C,	2,	0xED,	0x40,
	TOKEN_IN,	TOKEN_C,		TOKEN_PORT_C,	2,	0xED,	0x48,
	TOKEN_IN,	TOKEN_D,		TOKEN_PORT_C,	2,	0xED,	0x50,
	TOKEN_IN,	TOKEN_E,		TOKEN_PORT_C,	2,	0xED,	0x58,
	TOKEN_IN,	TOKEN_H,		TOKEN_PORT_C,	2,	0xED,	0x60,
	TOKEN_IN,	TOKEN_L,		TOKEN_PORT_C,	2,	0xED,	0x68,

//	TOKEN_IN,	TOKEN_F,		TOKEN_ADDR_C,	2,	0xED,	0x70,		// undocumented?

	TOKEN_IN,	TOKEN_A,		TOKEN_PORT_C,	2,	0xED,	0x78,

		// in a,(n)
	TOKEN_IN,	TOKEN_A,		TOKEN_ADDR,		2,	0xDB, -1,

		// inc r
	TOKEN_INC,	TOKEN_B,		-1,			1,	0x04, -1,
	TOKEN_INC,	TOKEN_C,		-1,			1,	0x0C, -1,
	TOKEN_INC,	TOKEN_D,		-1,			1,	0x14, -1,
	TOKEN_INC,	TOKEN_E,		-1,			1,	0x1C, -1,
	TOKEN_INC,	TOKEN_H,		-1,			1,	0x24, -1,
	TOKEN_INC,	TOKEN_L,		-1,			1,	0x2C, -1,
	TOKEN_INC,	TOKEN_ADDR_HL,	-1,			1,	0x34, -1,
	TOKEN_INC,	TOKEN_A,		-1,			1,	0x3C, -1,

		// inc rr

	TOKEN_INC,	TOKEN_BC,		-1,			1,	0x03, -1,
	TOKEN_INC,	TOKEN_DE,		-1,			1,	0x13, -1,
	TOKEN_INC,	TOKEN_HL,		-1,			1,	0x23, -1,
	TOKEN_INC,	TOKEN_SP,		-1,			1,	0x33, -1,
	TOKEN_INC,	TOKEN_IX,		-1,			1,	0xDD, 0x23,
	TOKEN_INC,	TOKEN_IY,		-1,			1,	0xFD, 0x23,

		// inc (ix+d)	inc (iy+d)

//	TOKEN_INC,	TOKEN_ADDR_IX,	-1,			3,	0xDD, 0x24,
//	TOKEN_INC,	TOKEN_ADDR_IY,	-1,			3,	0xDD, 0x24,

		// or r

	TOKEN_OR,	TOKEN_B,		-1,			1,	0xB0, -1,
	TOKEN_OR,	TOKEN_C,		-1,			1,	0xB1, -1,
	TOKEN_OR,	TOKEN_D,		-1,			1,	0xB2, -1,
	TOKEN_OR,	TOKEN_E,		-1,			1,	0xB3, -1,
	TOKEN_OR,	TOKEN_H,		-1,			1,	0xB4, -1,
	TOKEN_OR,	TOKEN_L,		-1,			1,	0xB5, -1,
	TOKEN_OR,	TOKEN_ADDR_HL,	-1,			1,	0xB6, -1,
	TOKEN_OR,	TOKEN_A,		-1,			1,	0xB7, -1,

		// or n

	TOKEN_OR,	TOKEN_NUMBER,	-1,			2,	0xf6, -1,

		// or (ix+d)	or (iy+d)

//	TOKEN_OR,	TOKEN_ADDR_IX,	-1,			3,	0xDD, 0xB6,
//	TOKEN_OR,	TOKEN_ADDR_IY,	-1,			3,	0xFD,	0xB6,

		// out (c),r

	TOKEN_OUT,	TOKEN_PORT_C,	TOKEN_B,		2,	0xED, 0x41,
	TOKEN_OUT,	TOKEN_PORT_C,	TOKEN_C,		2,	0xED, 0x49,
	TOKEN_OUT,	TOKEN_PORT_C,	TOKEN_D,		2,	0xED, 0x51,
	TOKEN_OUT,	TOKEN_PORT_C,	TOKEN_E,		2,	0xED, 0x59,
	TOKEN_OUT,	TOKEN_PORT_C,	TOKEN_H,		2,	0xED, 0x61,
	TOKEN_OUT,	TOKEN_PORT_C,	TOKEN_L,		2,	0xED, 0x69,
//	TOKEN_OUT,	TOKEN_PORT_C,	TOKEN_B,		2,	0xED, 0x71, ??
	TOKEN_OUT,	TOKEN_PORT_C,	TOKEN_A,		2,	0xED, 0x79,

		// out (n),a

	TOKEN_OUT,	TOKEN_ADDR,		TOKEN_A,		2,	0xD3,	-1,

		// pop qq

	TOKEN_POP,	TOKEN_BC,		-1,			1,	0xC1,	-1,
	TOKEN_POP,	TOKEN_DE,		-1,			1,	0xD1,	-1,
	TOKEN_POP,	TOKEN_HL,		-1,			1,	0xE1,	-1,
	TOKEN_POP,	TOKEN_AF,		-1,			1,	0xF1,	-1,
	TOKEN_POP,	TOKEN_IX,		-1,			2,	0xDD, 0xE1,
	TOKEN_POP,	TOKEN_IY,		-1,			2,	0xFD, 0xE1,

		// push qq

	TOKEN_PUSH,	TOKEN_BC,		-1,			1,	0xC5,	-1,
	TOKEN_PUSH,	TOKEN_DE,		-1,			1,	0xD5,	-1,
	TOKEN_PUSH,	TOKEN_HL,		-1,			1,	0xE5,	-1,
	TOKEN_PUSH,	TOKEN_AF,		-1,			1,	0xF5,	-1,
	TOKEN_PUSH,	TOKEN_IX,		-1,			2,	0xDD, 0xE5,
	TOKEN_PUSH,	TOKEN_IY,		-1,			2,	0xFD, 0xE5,

		//	rl r  **TO DO **

	TOKEN_RL,	TOKEN_B,		-1,			2,	0xCB, 0x10,
	TOKEN_RL,	TOKEN_C,		-1,			2,	0xCB, 0x11,
	TOKEN_RL,	TOKEN_D,		-1,			2,	0xCB, 0x12,
	TOKEN_RL,	TOKEN_E,		-1,			2,	0xCB, 0x13,
	TOKEN_RL,	TOKEN_H,		-1,			2,	0xCB, 0x14,
	TOKEN_RL,	TOKEN_L,		-1,			2,	0xCB, 0x15,
	TOKEN_RL,	TOKEN_ADDR_HL,	-1,			2,	0xCB, 0x16,
	TOKEN_RL,	TOKEN_A,		-1,			2,	0xCB, 0x17,

		// rl (ix+d) and rl (iy+d)	= SPECIAL CASE (TO DO)

		// rlc r
	TOKEN_RLC,	TOKEN_B,		-1,			2,	0xCB, 0x00,
	TOKEN_RLC,	TOKEN_C,		-1,			2,	0xCB, 0x01,
	TOKEN_RLC,	TOKEN_D,		-1,			2,	0xCB, 0x02,
	TOKEN_RLC,	TOKEN_E,		-1,			2,	0xCB, 0x03,
	TOKEN_RLC,	TOKEN_H,		-1,			2,	0xCB, 0x04,
	TOKEN_RLC,	TOKEN_L,		-1,			2,	0xCB, 0x05,
	TOKEN_RLC,	TOKEN_ADDR_HL,	-1,			2,	0xCB, 0x06,
	TOKEN_RLC,	TOKEN_A,		-1,			2,	0xCB, 0x07,

		// rlc(ix+d) and rlc(iy+d)	= SPECIAL CASE (TO DO)

		// rr r
	TOKEN_RR,	TOKEN_B,		-1,			2,	0xCB, 0x18,
	TOKEN_RR,	TOKEN_C,		-1,			2,	0xCB, 0x19,
	TOKEN_RR,	TOKEN_D,		-1,			2,	0xCB, 0x1A,
	TOKEN_RR,	TOKEN_E,		-1,			2,	0xCB, 0x1B,
	TOKEN_RR,	TOKEN_H,		-1,			2,	0xCB, 0x1C,
	TOKEN_RR,	TOKEN_L,		-1,			2,	0xCB, 0x1D,
	TOKEN_RR,	TOKEN_ADDR_HL,	-1,			2,	0xCB, 0x1E,
	TOKEN_RR,	TOKEN_A,		-1,			2,	0xCB, 0x1F,

		// rrc r
	TOKEN_RRC,	TOKEN_B,		-1,			2,	0xCB, 0x08,
	TOKEN_RRC,	TOKEN_C,		-1,			2,	0xCB, 0x09,
	TOKEN_RRC,	TOKEN_D,		-1,			2,	0xCB, 0x0A,
	TOKEN_RRC,	TOKEN_E,		-1,			2,	0xCB, 0x0B,
	TOKEN_RRC,	TOKEN_H,		-1,			2,	0xCB, 0x0C,
	TOKEN_RRC,	TOKEN_L,		-1,			2,	0xCB, 0x0D,
	TOKEN_RRC,	TOKEN_ADDR_HL,	-1,			2,	0xCB, 0x0E,
	TOKEN_RRC,	TOKEN_A,		-1,			2,	0xCB, 0x0F,

		// sbc a,r

	TOKEN_SBC,	TOKEN_A,		TOKEN_B,			1,	0x98, -1,
	TOKEN_SBC,	TOKEN_A,		TOKEN_C,			1,	0x99, -1,
	TOKEN_SBC,	TOKEN_A,		TOKEN_D,			1,	0x9A, -1,
	TOKEN_SBC,	TOKEN_A,		TOKEN_E,			1,	0x9B, -1,
	TOKEN_SBC,	TOKEN_A,		TOKEN_H,			1,	0x9C, -1,
	TOKEN_SBC,	TOKEN_A,		TOKEN_L,			1,	0x9D, -1,
	TOKEN_SBC,	TOKEN_A,		TOKEN_ADDR_HL,		1,	0x9E, -1,
	TOKEN_SBC,	TOKEN_A,		TOKEN_A,			1,	0x9F, -1,

		// sbc a,n

	TOKEN_SBC,	TOKEN_A,		TOKEN_NUMBER,		2,	0xDE, -1,

		// sbc A,(ix+d)	sbc A,(iy)

//	TOKEN_SBC,	TOKEN_A,		TOKEN_ADDR_IX,		3,	0xDD, 0x9E,
//	TOKEN_SBC,	TOKEN_A,		TOKEN_ADDR_IY,		3,	0xFD, 0x9E,

		// sbc hl,ss

	TOKEN_SBC,	TOKEN_HL,		TOKEN_BC,			2,	0xED, 0x42,
	TOKEN_SBC,	TOKEN_HL,		TOKEN_DE,			2,	0xED, 0x52,
	TOKEN_SBC,	TOKEN_HL,		TOKEN_HL,			2,	0xED, 0x62,
	TOKEN_SBC,	TOKEN_HL,		TOKEN_SP,			2,	0xED, 0x72,

		// sla r

	TOKEN_SLA,	TOKEN_B,		-1,				2,	0xCB,	0x20,
	TOKEN_SLA,	TOKEN_C,		-1,				2,	0xCB,	0x21,
	TOKEN_SLA,	TOKEN_D,		-1,				2,	0xCB,	0x22,
	TOKEN_SLA,	TOKEN_E,		-1,				2,	0xCB,	0x23,
	TOKEN_SLA,	TOKEN_H,		-1,				2,	0xCB,	0x24,
	TOKEN_SLA,	TOKEN_L,		-1,				2,	0xCB,	0x25,
	TOKEN_SLA,	TOKEN_ADDR_HL,	-1,				2,	0xCB,	0x26,
	TOKEN_SLA,	TOKEN_A,		-1,				2,	0xCB,	0x27,

		// sra r
	TOKEN_SRA,	TOKEN_B,		-1,				2,	0xCB,	0x28,
	TOKEN_SRA,	TOKEN_C,		-1,				2,	0xCB,	0x29,
	TOKEN_SRA,	TOKEN_D,		-1,				2,	0xCB,	0x2A,
	TOKEN_SRA,	TOKEN_E,		-1,				2,	0xCB,	0x2B,
	TOKEN_SRA,	TOKEN_H,		-1,				2,	0xCB,	0x2C,
	TOKEN_SRA,	TOKEN_L,		-1,				2,	0xCB,	0x2D,
	TOKEN_SRA,	TOKEN_ADDR_HL,	-1,				2,	0xCB,	0x2E,
	TOKEN_SRA,	TOKEN_A,		-1,				2,	0xCB,	0x2F,

		// srl r
	TOKEN_SRL,	TOKEN_B,		-1,				2,	0xCB,	0x38,
	TOKEN_SRL,	TOKEN_C,		-1,				2,	0xCB,	0x39,
	TOKEN_SRL,	TOKEN_D,		-1,				2,	0xCB,	0x3A,
	TOKEN_SRL,	TOKEN_E,		-1,				2,	0xCB,	0x3B,
	TOKEN_SRL,	TOKEN_H,		-1,				2,	0xCB,	0x3C,
	TOKEN_SRL,	TOKEN_L,		-1,				2,	0xCB,	0x3D,
	TOKEN_SRL,	TOKEN_ADDR_HL,	-1,				2,	0xCB,	0x3E,
	TOKEN_SRL,	TOKEN_A,		-1,				2,	0xCB,	0x3F,

		// sub r
	TOKEN_SUB,	TOKEN_B,		-1,				1,	0x90,	-1,
	TOKEN_SUB,	TOKEN_C,		-1,				1,	0x91,	-1,
	TOKEN_SUB,	TOKEN_D,		-1,				1,	0x92,	-1,
	TOKEN_SUB,	TOKEN_E,		-1,				1,	0x93,	-1,
	TOKEN_SUB,	TOKEN_H,		-1,				1,	0x94,	-1,
	TOKEN_SUB,	TOKEN_L,		-1,				1,	0x95,	-1,
	TOKEN_SUB,	TOKEN_ADDR_HL,	-1,				1,	0x96,	-1,
	TOKEN_SUB,	TOKEN_A,		-1,				1,	0x97,	-1,

		// sub n

	TOKEN_SUB,	TOKEN_NUMBER,	-1,				2,	0xD6, -1,

		// sub (ix+d) (iy+d)

//	TOKEN_SUB,	TOKEN_ADDR_IX,	-1,				2,	0xDD, 0x96,
//	TOKEN_SUB,	TOKEN_ADDR_IY,	-1,				2,	0xFD,	0x96,

		// xor r
	TOKEN_XOR,	TOKEN_B,		-1,				1,	0xA8,	-1,
	TOKEN_XOR,	TOKEN_C,		-1,				1,	0xA9,	-1,
	TOKEN_XOR,	TOKEN_D,		-1,				1,	0xAA,	-1,
	TOKEN_XOR,	TOKEN_E,		-1,				1,	0xAB,	-1,
	TOKEN_XOR,	TOKEN_H,		-1,				1,	0xAC,	-1,
	TOKEN_XOR,	TOKEN_L,		-1,				1,	0xAD,	-1,
	TOKEN_XOR,	TOKEN_ADDR_HL,	-1,				1,	0xAE,	-1,
	TOKEN_XOR,	TOKEN_A,		-1,				1,	0xAF,	-1,

		// xor n

	TOKEN_XOR,	TOKEN_NUMBER,	-1,				2,	0xEE, -1,

		// xor (ix+d) (iy+d)

//	TOKEN_XOR,	TOKEN_ADDR_IX,	-1,				2,	0xDD, 0xAE,
//	TOKEN_XOR,	TOKEN_ADDR_IY,	-1,				2,	0xFD, 0xAE,

		// ld dd,nn
	TOKEN_LD,	TOKEN_BC, 		TOKEN_NUMBER,	3, 0x01, -1,
	TOKEN_LD,	TOKEN_DE,		TOKEN_NUMBER,	3, 0x11, -1,
	TOKEN_LD,	TOKEN_HL,		TOKEN_NUMBER,	3, 0x21, -1,
	TOKEN_LD,	TOKEN_SP, 		TOKEN_NUMBER,	3, 0x31, -1,

		// ld r, n

	TOKEN_LD,	TOKEN_A, 		TOKEN_NUMBER, 	2, 0x3E, -1,
	TOKEN_LD,	TOKEN_B, 		TOKEN_NUMBER,	2, 0x06, -1,
	TOKEN_LD,	TOKEN_C, 		TOKEN_NUMBER,	2, 0x0E, -1,
	TOKEN_LD,	TOKEN_D, 		TOKEN_NUMBER,	2, 0x16, -1,
	TOKEN_LD,	TOKEN_E, 		TOKEN_NUMBER,	2, 0x1E, -1,
	TOKEN_LD,	TOKEN_H, 		TOKEN_NUMBER,	2, 0x26, -1,
	TOKEN_LD,	TOKEN_L, 		TOKEN_NUMBER,	2, 0x2E, -1,
	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_NUMBER, 	2, 0x36, -1,

		// ld r,r

	TOKEN_LD,	TOKEN_B,		TOKEN_B,		1, 0x40, -1,
	TOKEN_LD,	TOKEN_B,		TOKEN_C,		1, 0x41, -1,
	TOKEN_LD,	TOKEN_B,		TOKEN_D,		1, 0x42, -1,
	TOKEN_LD,	TOKEN_B,		TOKEN_E,		1, 0x43, -1,
	TOKEN_LD,	TOKEN_B,		TOKEN_H,		1, 0x44, -1,
	TOKEN_LD,	TOKEN_B,		TOKEN_L,		1, 0x45, -1,
	TOKEN_LD,	TOKEN_B,		TOKEN_ADDR_HL,	1, 0x46, -1,
	TOKEN_LD,	TOKEN_B,		TOKEN_A,		1, 0x47, -1,

	TOKEN_LD,	TOKEN_C,		TOKEN_B,		1, 0x48, -1,
	TOKEN_LD,	TOKEN_C,		TOKEN_C,		1, 0x49, -1,
	TOKEN_LD,	TOKEN_C,		TOKEN_D,		1, 0x4A, -1,
	TOKEN_LD,	TOKEN_C,		TOKEN_E,		1, 0x4B, -1,
	TOKEN_LD,	TOKEN_C,		TOKEN_H,		1, 0x4C, -1,
	TOKEN_LD,	TOKEN_C,		TOKEN_L,		1, 0x4D, -1,
	TOKEN_LD,	TOKEN_C,		TOKEN_ADDR_HL,	1, 0x4E, -1,
	TOKEN_LD,	TOKEN_C,		TOKEN_A,		1, 0x4F, -1,

	TOKEN_LD,	TOKEN_D,		TOKEN_B,		1, 0x50, -1,
	TOKEN_LD,	TOKEN_D,		TOKEN_C,		1, 0x51, -1,
	TOKEN_LD,	TOKEN_D,		TOKEN_D,		1, 0x52, -1,
	TOKEN_LD,	TOKEN_D,		TOKEN_E,		1, 0x53, -1,
	TOKEN_LD,	TOKEN_D,		TOKEN_H,		1, 0x54, -1,
	TOKEN_LD,	TOKEN_D,		TOKEN_L,		1, 0x55, -1,
	TOKEN_LD,	TOKEN_D,		TOKEN_ADDR_HL,	1, 0x56, -1,
	TOKEN_LD,	TOKEN_D,		TOKEN_A,		1, 0x57, -1,

	TOKEN_LD,	TOKEN_E,		TOKEN_B,		1, 0x58, -1,
	TOKEN_LD,	TOKEN_E,		TOKEN_C,		1, 0x59, -1,
	TOKEN_LD,	TOKEN_E,		TOKEN_D,		1, 0x5A, -1,
	TOKEN_LD,	TOKEN_E,		TOKEN_E,		1, 0x5B, -1,
	TOKEN_LD,	TOKEN_E,		TOKEN_H,		1, 0x5C, -1,
	TOKEN_LD,	TOKEN_E,		TOKEN_L,		1, 0x5D, -1,
	TOKEN_LD,	TOKEN_E,		TOKEN_ADDR_HL,	1, 0x5E, -1,
	TOKEN_LD,	TOKEN_E,		TOKEN_A,		1, 0x5F, -1,

	TOKEN_LD,	TOKEN_H,		TOKEN_B,		1, 0x60, -1,
	TOKEN_LD,	TOKEN_H,		TOKEN_C,		1, 0x61, -1,
	TOKEN_LD,	TOKEN_H,		TOKEN_D,		1, 0x62, -1,
	TOKEN_LD,	TOKEN_H,		TOKEN_E,		1, 0x63, -1,
	TOKEN_LD,	TOKEN_H,		TOKEN_H,		1, 0x64, -1,
	TOKEN_LD,	TOKEN_H,		TOKEN_L,		1, 0x65, -1,
	TOKEN_LD,	TOKEN_H,		TOKEN_ADDR_HL,	1, 0x66, -1,
	TOKEN_LD,	TOKEN_H,		TOKEN_A,		1, 0x67, -1,

	TOKEN_LD,	TOKEN_L,		TOKEN_B,		1, 0x68, -1,
	TOKEN_LD,	TOKEN_L,		TOKEN_C,		1, 0x69, -1,
	TOKEN_LD,	TOKEN_L,		TOKEN_D,		1, 0x6A, -1,
	TOKEN_LD,	TOKEN_L,		TOKEN_E,		1, 0x6B, -1,
	TOKEN_LD,	TOKEN_L,		TOKEN_H,		1, 0x6C, -1,
	TOKEN_LD,	TOKEN_L,		TOKEN_L,		1, 0x6D, -1,
	TOKEN_LD,	TOKEN_L,		TOKEN_ADDR_HL,	1, 0x6E, -1,
	TOKEN_LD,	TOKEN_L,		TOKEN_A,		1, 0x6F, -1,

	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_B,		1, 0x70, -1,
	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_C,		1, 0x71, -1,
	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_D,		1, 0x72, -1,
	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_E,		1, 0x73, -1,
	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_H,		1, 0x74, -1,
	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_L,		1, 0x75, -1,
//	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_ADDR_HL,	1, 0x76, -1,	// not a valid command
	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_A,		1, 0x77, -1,

	TOKEN_LD,	TOKEN_A,		TOKEN_B,		1, 0x78, -1,
	TOKEN_LD,	TOKEN_A,		TOKEN_C,		1, 0x79, -1,
	TOKEN_LD,	TOKEN_A,		TOKEN_D,		1, 0x7A, -1,
	TOKEN_LD,	TOKEN_A,		TOKEN_E,		1, 0x7B, -1,
	TOKEN_LD,	TOKEN_A,		TOKEN_H,		1, 0x7C, -1,
	TOKEN_LD,	TOKEN_A,		TOKEN_L,		1, 0x7D, -1,
	TOKEN_LD,	TOKEN_A,		TOKEN_ADDR_HL,	1, 0x7E, -1,
	TOKEN_LD,	TOKEN_A,		TOKEN_A,		1, 0x7F, -1,

		// ld (bc),a	ld (de),a

	TOKEN_LD,	TOKEN_ADDR_BC,	TOKEN_A,		1, 0x02, -1,
	TOKEN_LD,	TOKEN_ADDR_DE,	TOKEN_A,		1, 0x12, -1,

		// ld (hl),n

	TOKEN_LD,	TOKEN_ADDR_HL,	TOKEN_NUMBER,	2, 0x36, -1,

		// ld a, (nn)

	TOKEN_LD,	TOKEN_A,		TOKEN_ADDR,		3, 0x3A, -1,

		// ld (nn),a

	TOKEN_LD,	TOKEN_ADDR,		TOKEN_A,		3, 0x32,	-1,

		// ld (nn),dd

	TOKEN_LD,	TOKEN_ADDR,		TOKEN_BC,		4, 0xED, 0x43,
	TOKEN_LD,	TOKEN_ADDR,		TOKEN_DE,		4, 0xED, 0x53,
	TOKEN_LD,	TOKEN_ADDR,		TOKEN_SP,		4, 0xED, 0x73,

		// ld a,(bc)	ld a,(de)

	TOKEN_LD,	TOKEN_A,	TOKEN_ADDR_BC,		1, 0x0A, -1,
	TOKEN_LD,	TOKEN_A, 	TOKEN_ADDR_DE,		1, 0x1A, -1,

		// ld a,i 	ld i,a	ld a,R	ld R,a

	TOKEN_LD,	TOKEN_A, 	TOKEN_I,			2, 0xED, 0x57,
	TOKEN_LD,	TOKEN_I, 	TOKEN_A,			2, 0xED, 0x47,
	TOKEN_LD,	TOKEN_A,	TOKEN_R,		 	2, 0xED, 0x5F,
	TOKEN_LD,	TOKEN_R,	TOKEN_A,			2, 0xED, 0x4F,

		// ld sp,hl		ld sp,ix		ld sp,iy

	TOKEN_LD,	TOKEN_SP,	TOKEN_HL,			1, 0xF9, -1,
	TOKEN_LD,	TOKEN_SP,	TOKEN_IX,			2, 0xDD, 0xF9,
	TOKEN_LD,	TOKEN_SP,	TOKEN_IY,			2, 0xFD, 0xF9,

		// id ix, n		ld iy,n
	TOKEN_LD,	TOKEN_IX,	TOKEN_NUMBER ,		4, 0xDD, 0x21,
	TOKEN_LD,	TOKEN_IY,	TOKEN_NUMBER,		4, 0xFD, 0x21,

		// ld dd, (nn)
		// note : ld hl,(nn) treated separately from this block

	TOKEN_LD,	TOKEN_BC, 		TOKEN_ADDR,		4, 0xED, 0x4B,
	TOKEN_LD,	TOKEN_DE,		TOKEN_ADDR,		4, 0xED, 0x5B,
	TOKEN_LD,	TOKEN_SP,		TOKEN_ADDR,		4, 0xED, 0x7B,

		// ld (nn),hl	ld (nn), ix	ld (nn),iy

	TOKEN_LD,	TOKEN_ADDR,		TOKEN_HL,		3, 0x22, -1,
	TOKEN_LD,	TOKEN_ADDR,		TOKEN_IX,		4, 0xDD, 0x22,
	TOKEN_LD,	TOKEN_ADDR,		TOKEN_IY,		4, 0xFD, 0x22,

	TOKEN_LD,	TOKEN_HL,	TOKEN_ADDR, 		3, 0x2a,	-1,
	TOKEN_LD,	TOKEN_IX,	TOKEN_ADDR,			4, 0xDD, 0x2A,
	TOKEN_LD,	TOKEN_IY,	TOKEN_ADDR,			4, 0xFD, 0x2A,


		// -----------------------------------------
		// 		(some) undocumented codes.
		// -----------------------------------------

	TOKEN_INC,	TOKEN_IXH,		-1,		2,	0xDD,	0x24,
	TOKEN_INC,	TOKEN_IXL,		-1,		2,	0xDD, 0x2C,
	TOKEN_INC,	TOKEN_IYH,		-1,		2,	0xFD,	0x24,
	TOKEN_INC,	TOKEN_IYL,		-1,		2,	0xFD,	0x2C,

	TOKEN_DEC,	TOKEN_IXH,		-1,		2,	0xDD, 0x25,
	TOKEN_DEC,	TOKEN_IXL,		-1,		2,	0xDD, 0x2D,
	TOKEN_DEC,	TOKEN_IYH,		-1,		2,	0xFD,	0x25,
	TOKEN_DEC,	TOKEN_IYL,		-1,		2,	0xFD,	0x2D,

	TOKEN_LD,	TOKEN_B,		TOKEN_IXH,		2,	0xDD, 0x44,
	TOKEN_LD,	TOKEN_C,		TOKEN_IXH,		2,	0xDD, 0x4C,
	TOKEN_LD,	TOKEN_D,		TOKEN_IXH,		2,	0xDD, 0x54,
	TOKEN_LD,	TOKEN_E,		TOKEN_IXH,		2,	0xDD, 0x5C,
	TOKEN_LD,	TOKEN_A,		TOKEN_IXH,		2,	0xDD, 0x7C,

	TOKEN_LD,	TOKEN_B,		TOKEN_IXL,		2,	0xDD, 0x45,
	TOKEN_LD,	TOKEN_C,		TOKEN_IXL,		2,	0xDD, 0x4D,
	TOKEN_LD,	TOKEN_D,		TOKEN_IXL,		2,	0xDD, 0x55,
	TOKEN_LD,	TOKEN_E,		TOKEN_IXL,		2,	0xDD, 0x5D,
	TOKEN_LD,	TOKEN_A,		TOKEN_IXL,		2,	0xDD, 0x7D,

	TOKEN_LD,	TOKEN_B,		TOKEN_IYH,		2,	0xFD, 0x44,
	TOKEN_LD,	TOKEN_C,		TOKEN_IYH,		2,	0xFD, 0x4C,
	TOKEN_LD,	TOKEN_D,		TOKEN_IYH,		2,	0xFD, 0x54,
	TOKEN_LD,	TOKEN_E,		TOKEN_IYH,		2,	0xFD, 0x5C,
	TOKEN_LD,	TOKEN_A,		TOKEN_IYH,		2,	0xFD, 0x7C,

	TOKEN_LD,	TOKEN_B,		TOKEN_IYL,		2,	0xFD, 0x45,
	TOKEN_LD,	TOKEN_C,		TOKEN_IYL,		2,	0xFD, 0x4D,
	TOKEN_LD,	TOKEN_D,		TOKEN_IYL,		2,	0xFD, 0x55,
	TOKEN_LD,	TOKEN_E,		TOKEN_IYL,		2,	0xFD, 0x5D,
	TOKEN_LD,	TOKEN_A,		TOKEN_IYL,		2,	0xFD, 0x7D,

	TOKEN_LD,	TOKEN_IXH,		TOKEN_B,		2,	0xDD, 0x60,
	TOKEN_LD,	TOKEN_IXH,		TOKEN_C,		2,	0xDD, 0x61,
	TOKEN_LD,	TOKEN_IXH,		TOKEN_D,		2,	0xDD, 0x62,
	TOKEN_LD,	TOKEN_IXH,		TOKEN_E,		2,	0xDD, 0x63,
	TOKEN_LD,	TOKEN_IXH,		TOKEN_A,		2,	0xDD, 0x67,

	TOKEN_LD,	TOKEN_IYH,		TOKEN_B,		2,	0xFD, 0x60,
	TOKEN_LD,	TOKEN_IYH,		TOKEN_C,		2,	0xFD, 0x61,
	TOKEN_LD,	TOKEN_IYH,		TOKEN_D,		2,	0xFD, 0x62,
	TOKEN_LD,	TOKEN_IYH,		TOKEN_E,		2,	0xFD, 0x63,
	TOKEN_LD,	TOKEN_IYH,		TOKEN_A,		2,	0xFD, 0x67,

	TOKEN_LD,	TOKEN_IXH,		TOKEN_IXL,		2,	0xDD,	0x65,
	TOKEN_LD,	TOKEN_IYH,		TOKEN_IYL,		2,	0xFD, 0x65,

	TOKEN_LD,	TOKEN_IXL,		TOKEN_B,		2,	0xDD, 0x68,
	TOKEN_LD,	TOKEN_IXL,		TOKEN_C,		2,	0xDD, 0x69,
	TOKEN_LD,	TOKEN_IXL,		TOKEN_D,		2,	0xDD, 0x6A,
	TOKEN_LD,	TOKEN_IXL,		TOKEN_E,		2,	0xDD, 0x6B,
	TOKEN_LD,	TOKEN_IXL,		TOKEN_A,		2,	0xDD, 0x6F,

	TOKEN_LD,	TOKEN_IYL,		TOKEN_B,		2,	0xFD, 0x68,
	TOKEN_LD,	TOKEN_IYL,		TOKEN_C,		2,	0xFD, 0x69,
	TOKEN_LD,	TOKEN_IYL,		TOKEN_D,		2,	0xFD, 0x6A,
	TOKEN_LD,	TOKEN_IYL,		TOKEN_E,		2,	0xFD, 0x6B,
	TOKEN_LD,	TOKEN_IYL,		TOKEN_A,		2,	0xFD, 0x6F,

	TOKEN_LD,	TOKEN_IXL,		TOKEN_IXH,		2,	0xDD,	0x6C,
	TOKEN_LD,	TOKEN_IYL,		TOKEN_IYH,		2,	0xFD,	0x6C,

	TOKEN_ADD,	TOKEN_A,		TOKEN_IXH,		2,	0xDD, 0x84,
	TOKEN_ADD,	TOKEN_A,		TOKEN_IXL,		2,	0xDD,	0x85,
	TOKEN_ADC,	TOKEN_A,		TOKEN_IXH,		2,	0xDD, 0x8C,
	TOKEN_ADC,	TOKEN_A,		TOKEN_IXL,		2,	0xDD,	0x8D,

	TOKEN_SUB,	TOKEN_IXH,		-1,			2,	0xDD,	0x94,
	TOKEN_SUB,	TOKEN_IXL,		-1,			2,	0xDD,	0x95,

	TOKEN_SBC,	TOKEN_IXH,		-1,			2,	0xDD, 0x9C,
	TOKEN_SBC,	TOKEN_IXL,		-1,			2,	0xDD, 0x9D,

	TOKEN_AND,	TOKEN_IXH,		-1,			2,	0xDD, 0xA4,
	TOKEN_AND,	TOKEN_IXL,		-1,			2,	0xDD, 0xA5,
	TOKEN_XOR,	TOKEN_IXH,		-1,			2,	0xDD, 0xAC,
	TOKEN_XOR,	TOKEN_IXL,		-1,			2,	0xDD, 0xAD,

	TOKEN_OR,	TOKEN_IXH,		-1,			2,	0xDD, 0xB4,
	TOKEN_OR,	TOKEN_IXL,		-1,			2,	0xDD, 0xB5,

	TOKEN_CP,	TOKEN_IXH,		-1,			2,	0xDD,	0xBC,
	TOKEN_CP,	TOKEN_IXL,		-1,			2,	0xDD, 0xBD,


	TOKEN_ADD,	TOKEN_A,		TOKEN_IYH,		2,	0xFD, 0x84,
	TOKEN_ADD,	TOKEN_A,		TOKEN_IYL,		2,	0xFD,	0x85,
	TOKEN_ADC,	TOKEN_A,		TOKEN_IYH,		2,	0xFD, 0x8C,
	TOKEN_ADC,	TOKEN_A,		TOKEN_IYL,		2,	0xFD,	0x8D,

	TOKEN_SUB,	TOKEN_IYH,		-1,			2,	0xFD,	0x94,
	TOKEN_SUB,	TOKEN_IYL,		-1,			2,	0xFD,	0x95,

	TOKEN_SBC,	TOKEN_IYH,		-1,			2,	0xFD, 0x9C,
	TOKEN_SBC,	TOKEN_IYL,		-1,			2,	0xFD, 0x9D,

	TOKEN_AND,	TOKEN_IYH,		-1,			2,	0xFD, 0xA4,
	TOKEN_AND,	TOKEN_IYL,		-1,			2,	0xFD, 0xA5,
	TOKEN_XOR,	TOKEN_IYH,		-1,			2,	0xFD, 0xAC,
	TOKEN_XOR,	TOKEN_IYL,		-1,			2,	0xFD, 0xAD,

	TOKEN_OR,	TOKEN_IYH,		-1,			2,	0xFD, 0xB4,
	TOKEN_OR,	TOKEN_IYL,		-1,			2,	0xFD, 0xB5,

	TOKEN_CP,	TOKEN_IYH,		-1,			2,	0xFD,	0xBC,
	TOKEN_CP,	TOKEN_IYL,		-1,			2,	0xFD, 0xBD,


	// to do :
	//	OPCODE       INSTRUCTION        OPCODE        INSTRUCTION 
	//  -----------  -----------------  ------------  ------------
	//  #DD #26 nn   LD   IXH,nn        #FD #26 nn    LD   IYH,nn
	//  #DD #2E nn   LD   IXL,nn        #FD #2E nn    LD   IYL,nn



	
	INVALID_TOKEN_ID, 0,		0, 				0, -1,-1
];

/*
int ld_instructions [] = 
{

		// ld r,(iy+d)

	TOKEN_LD,	TOKEN_B,		TOKEN_ADDR_IY,	3, 0xFD, 0x46,
	TOKEN_LD,	TOKEN_C,		TOKEN_ADDR_IY,	3, 0xFD, 0x4E,
	TOKEN_LD,	TOKEN_D,		TOKEN_ADDR_IY,	3, 0xFD, 0x56,
	TOKEN_LD,	TOKEN_E,		TOKEN_ADDR_IY,	3, 0xFD, 0x5E,
	TOKEN_LD,	TOKEN_H,		TOKEN_ADDR_IY,	3, 0xFD, 0x66,
	TOKEN_LD,	TOKEN_L,		TOKEN_ADDR_IY,	3, 0xFD, 0x6E,
	TOKEN_LD,	TOKEN_A,		TOKEN_ADDR_IY,	3, 0xFD, 0x7E,

		// ld (ix),n
	TOKEN_LD,	TOKEN_ADDR_IX, 	TOKEN_NUMBER,	4, 0xDD, 0x36,

		// ld (iy),n
	TOKEN_LD,	TOKEN_ADDR_IY,	TOKEN_NUMBER,	4, 0xFD, 0x36,

		// ld (ix),r

	TOKEN_LD,	TOKEN_ADDR_IX,	TOKEN_B,		3, 0xDD, 0x70,
	TOKEN_LD,	TOKEN_ADDR_IX,	TOKEN_C,		3, 0xDD, 0x71,
	TOKEN_LD,	TOKEN_ADDR_IX,	TOKEN_D,		3, 0xDD, 0x72,
	TOKEN_LD,	TOKEN_ADDR_IX,	TOKEN_E,		3, 0xDD, 0x73,
	TOKEN_LD,	TOKEN_ADDR_IX,	TOKEN_H,		3, 0xDD, 0x74,
	TOKEN_LD,	TOKEN_ADDR_IX,	TOKEN_L,		3, 0xDD, 0x75,
	TOKEN_LD,	TOKEN_ADDR_IX,	TOKEN_A,		3, 0xDD, 0x77,

		// ld (iy),r

	TOKEN_LD,	TOKEN_ADDR_IY,	TOKEN_B,		3, 0xFD, 0x70,
	TOKEN_LD,	TOKEN_ADDR_IY,	TOKEN_C,		3, 0xFD, 0x71,
	TOKEN_LD,	TOKEN_ADDR_IY,	TOKEN_D,		3, 0xFD, 0x72,
	TOKEN_LD,	TOKEN_ADDR_IY,	TOKEN_E,		3, 0xFD, 0x73,
	TOKEN_LD,	TOKEN_ADDR_IY,	TOKEN_H,		3, 0xFD, 0x74,
	TOKEN_LD,	TOKEN_ADDR_IY,	TOKEN_L,		3, 0xFD, 0x75,
	TOKEN_LD,	TOKEN_ADDR_IY,	TOKEN_A,		3, 0xFD, 0x77,

	INVALID_TOKEN_ID, 0,	0, 				0, -1,-1
};
*/

function INDEXED_ADDRESSING_INSTRUCTIONS()
{
	this.command;
	this.op1;
	this.op2;
	this.size;			// not currently used
	this.code1;
	this.code2;
	this.code3;
	this.code4;
}

/*
typedef struct
{
	int command;
	int op1;
	int op2;
	int size;			// not currently used
	int code1;
	int code2;
	int code3;
	int code4;
} INDEXED_ADDRESSING_INSTRUCTIONS;
*/

var DATA_d = -2;	//#define DATA_d	-2
//INDEXED_ADDRESSING_INSTRUCTIONS Indexed_Instruction_Table[]=
Indexed_Instruction_Table = 
[
	TOKEN_ADC,	TOKEN_A,	TOKEN_ADDR_IX,	3,	0xDD, 0x8E, DATA_d, -1,
	TOKEN_ADD,	TOKEN_A,	TOKEN_ADDR_IX,	3,	0xDD, 0x86, DATA_d, -1,
	TOKEN_AND,	TOKEN_ADDR_IX,	-1,		3,	0xDD, 0xA6, DATA_d, -1,
	TOKEN_CP,	TOKEN_ADDR_IX,	-1,		3,	0xDD, 0xBE, DATA_d, -1,
	TOKEN_DEC,	TOKEN_ADDR_IX,	-1,		3,	0xDD, 0x35, DATA_d, -1,
	TOKEN_INC,	TOKEN_ADDR_IX,	-1,		3,	0xDD, 0x34, DATA_d, -1,

	TOKEN_LD,	TOKEN_B,	TOKEN_ADDR_IX,	3,	0xDD, 0x46, DATA_d, -1,
	TOKEN_LD,	TOKEN_C,	TOKEN_ADDR_IX,	3,	0xDD, 0x4E, DATA_d, -1,
	TOKEN_LD,	TOKEN_D,	TOKEN_ADDR_IX,	3,	0xDD, 0x56, DATA_d, -1,
	TOKEN_LD,	TOKEN_E,	TOKEN_ADDR_IX,	3,	0xDD, 0x5E, DATA_d, -1,
	TOKEN_LD,	TOKEN_H,	TOKEN_ADDR_IX,	3,	0xDD, 0x66, DATA_d, -1,
	TOKEN_LD,	TOKEN_L,	TOKEN_ADDR_IX,	3,	0xDD, 0x6E, DATA_d, -1,
	TOKEN_LD,	TOKEN_A,	TOKEN_ADDR_IX,	3,	0xDD, 0x7E, DATA_d, -1,

	TOKEN_LD,	TOKEN_ADDR_IX,	TOKEN_NUMBER,	4,	0xDD, 0x36, DATA_d, -1,

	TOKEN_LD,	TOKEN_ADDR_IX, TOKEN_B,		3,	0xDD, 0x70, DATA_d, -1,
	TOKEN_LD,	TOKEN_ADDR_IX, TOKEN_C,		3,	0xDD, 0x71, DATA_d, -1,
	TOKEN_LD,	TOKEN_ADDR_IX, TOKEN_D,		3,	0xDD, 0x72, DATA_d, -1,
	TOKEN_LD,	TOKEN_ADDR_IX, TOKEN_E,		3,	0xDD, 0x73, DATA_d, -1,
	TOKEN_LD,	TOKEN_ADDR_IX, TOKEN_H,		3,	0xDD, 0x74, DATA_d, -1,
	TOKEN_LD,	TOKEN_ADDR_IX, TOKEN_L,		3,	0xDD, 0x75, DATA_d, -1,
	TOKEN_LD,	TOKEN_ADDR_IX, TOKEN_A,		3,	0xDD, 0x77, DATA_d, -1,

	TOKEN_OR,	TOKEN_ADDR_IX,	-1,		3,	0xDD, 0xB6, DATA_d, -1,

	TOKEN_RL,	TOKEN_ADDR_IX,	-1,		4,	0xDD, 0xCB, DATA_d, 0x16,
	TOKEN_RLC,	TOKEN_ADDR_IX,	-1,		4,	0xDD, 0xCB, DATA_d, 0x06,
	TOKEN_RR,	TOKEN_ADDR_IX,	-1,		4,	0xDD, 0xCB, DATA_d, 0x1E,
	TOKEN_RRC,	TOKEN_ADDR_IX,	-1,		4,	0xDD, 0xCB,	DATA_d, 0x0E,

	TOKEN_SBC,	TOKEN_A, 	TOKEN_ADDR_IX,	3,	0xDD, 0x9E, DATA_d, -1,
	TOKEN_SLA,	TOKEN_ADDR_IX,	-1,		4,	0xDD, 0xCB, DATA_d, 0x26,
	TOKEN_SRA,	TOKEN_ADDR_IX,	-1,		4,	0xDD, 0xCB, DATA_d, 0x2E,
	TOKEN_SRL,	TOKEN_ADDR_IX,	-1,		4,	0xDD, 0xCB, DATA_d, 0x3E,

	TOKEN_SUB,	TOKEN_ADDR_IX,	-1,		3,	0xDD, 0x96, DATA_d, -1,
	TOKEN_XOR,	TOKEN_ADDR_IX,	-1,		3,	0xDD, 0xAE, DATA_d, -1,

	INVALID_TOKEN_ID, 0,		0, 		0,	0,	0,	0, 0
];

	// ---------------------------------------------
	//		Global Variables
	// ---------------------------------------------

var _calc;					//POSTFIX_CALC _calc;
var _pass_one_FileStack;	//STACK_STRUCT _pass_one_FileStack;

var _pass_one_ProgramCounter = ORG_UNDEFINED;	//int _pass_one_ProgramCounter = ORG_UNDEFINED;
var _pass_one_error_level;					//int _pass_one_error_level;

var operand_label;				//STRING operand_label;		// label for forward-referenced operand labels.

var pass_one_immediate_data;		//int _pass_one_immediate_data;


	// ---------------------------------------------
	//		Private Routines
	// ---------------------------------------------
	
function GetTokenType (scanner)
{
	// var TOKEN_TYPE_UNKNOWN		= 0;
	// var TOKEN_TYPE_NUMBER		= 1;
	// var TOKEN_TYPE_IDENTIFIER	= 2;
	// var TOKEN_TYPE_STRING		= 3;
	// var TOKEN_TYPE_SYMBOL		= 4;
	// var TOKEN_TYPE_EOL			= 5;

	return scanner.token_type;
}

function _pass_one_report_error (error_level, scanner, error_msg)
{
	// output an error message with the formatting as follows:
	// filename:line number: error message
	// this will give programmmers a chance of easily finding
	// the error as quickly as possible.
	
	// note : scanner does not have line number value ???
	console.log ("to do : report error: line#:" + scanner.line_number + " : "  + error_msg);
/*
	STRING	tmp;
	STRING	num;

	if (error_level > _pass_one_error_level)
	{
		_pass_one_error_level = error_level;
	}

	CreateString (&tmp);
	CreateString (&num);

	ConcatString (&tmp, &scanner->filename);
	ConcatRawString (&tmp, ":");

	ValueToString (&num, scanner->line_number);
	ConcatString (&tmp, &num);

	ConcatRawString (&tmp, ":");
	ConcatRawString (&tmp, error_msg);

	DebugString (DEBUG_TRACE, "pass_one.c: error msg : ", GetStringPtr (&tmp));
	Msg (GetStringPtr (&tmp));

	DestroyString (&tmp);
	DestroyString (&num);
*/
}

function OutputCodeByte (scanner, byte)
{
	if (_pass_one_ProgramCounter == ORG_UNDEFINED)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "ORG undefined");
		return RETCODE_ERROR;
	}

		// removing rom writing restriction, just reporting it as an error.
	if (_pass_one_ProgramCounter < 16384)
	{
//		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unable to write to ROM");
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "unable to write to ROM");
//		return RETCODE_ERROR;
	}

	if (_pass_one_ProgramCounter > 65535)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "Top of RAM reached");
		return RETCODE_ERROR;
	}

	_CodeBuffer [_pass_one_ProgramCounter] = byte;
	_pass_one_ProgramCounter++;

	return RETCODE_OK;
}

function OutputCodeWord (scanner, word)
{
	if (_pass_one_ProgramCounter == ORG_UNDEFINED)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "ORG undefined");
		return RETCODE_ERROR;
	}

	if (_pass_one_ProgramCounter < 16384)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unable to write to ROM");
		return RETCODE_ERROR;
	}

	if (_pass_one_ProgramCounter >= 65534)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "Top of RAM reached");
		return RETCODE_ERROR;
	}

	_CodeBuffer [_pass_one_ProgramCounter] = word & 255;
	_pass_one_ProgramCounter++;

	_CodeBuffer [_pass_one_ProgramCounter] = (word >> 8) & 255;
	_pass_one_ProgramCounter++;

	return RETCODE_OK;
}

function GetNumOperands (token_id)
{
//	this.instruction_token_id;
//	this.number_of_opcodes;

	var k;
	
	for (k = 0; k < misc_opcode_info.length; k += 2)
	{
		if (misc_opcode_info[k] == token_id)
		{
			return misc_opcode_info[k+1];
		}
	}
/*	OPCODE_INFO* ptr;

	ptr = &misc_opcode_info[0];
	while (ptr->instruction_token_id != 0)
	{
		if (token_id == ptr->instruction_token_id)
		{
			return ptr->number_of_opcodes;
		}
		ptr++;
	}
	return 0;
*/
}

function OutputIndexedInstruction (scanner, command_id, op1, op2)
{
	// handles output of indexed instructions (ix+d) and (iy+d)
	//  **** UNDER CONSTRUCTION ****

//typedef struct
//{
//0	int command;
//1	int op1;
//2	int op2;
//3	int size;			// not currently used
//4	int code1;
//5	int code2;
//6	int code3;			<<--- is this used anywhere ?????
//7	int code4;
//} INDEXED_ADDRESSING_INSTRUCTIONS;

	var ptr;				// INDEXED_ADDRESSING_INSTRUCTIONS* ptr;
	var op_one_search_id;	// int op_one_search_id;
	var op_two_search_id;	// int op_two_search_id;

	op_one_search_id = op1;
	op_two_search_id = op2;

	if (op1 == TOKEN_ADDR_IY)		// only need to search for _IX in table.?
	{
		op_one_search_id = TOKEN_ADDR_IX;
	}
	if (op2 == TOKEN_ADDR_IY)
	{
		op_two_search_id = TOKEN_ADDR_IX;
	}

	ptr = 0;			//&Indexed_Instruction_Table[0];
//	while (ptr->command != INVALID_TOKEN_ID)
	while (Indexed_Instruction_Table[ptr] != INVALID_TOKEN_ID)
	{
//		if (command_id == ptr->command)
		if (command_id == Indexed_Instruction_Table[ptr])
		{
//			if ((ptr->op1 == op_one_search_id) && 
//					(ptr->op2 == op_two_search_id))
			if ((Indexed_Instruction_Table[ptr+1] == op_one_search_id) &&
				(Indexed_Instruction_Table[ptr+2] == op_two_search_id))
			{
				// found instruction to output

				// output prefix 0xDD or 0xFD

				if ((op1 == TOKEN_ADDR_IX) || (op2 == TOKEN_ADDR_IX))
				{
					OutputCodeByte (scanner, 0xDD);
				}
				else
				{
					OutputCodeByte (scanner, 0xFD);
				}

				// output 2nd code byte.
//				OutputCodeByte (scanner, ptr->code2);
				OutputCodeByte (scanner, Indexed_Instruction_Table[ptr+5]);

				// output data byte.
				if ((_pass_one_immediate_data < -128) ||
					(_pass_one_immediate_data > 255))
				{
					_pass_one_report_error 
						(ERROR_LEVEL_FATAL, 
							scanner, "offset out of range");
					return RETCODE_ERROR;
				}
				OutputCodeByte (scanner, _pass_one_immediate_data);

				//if (ptr->code4 != -1)
				if (Indexed_Instruction_Table[ptr+7] != -1)
				{
					// output 4th byte of data.
					//OutputCodeByte (scanner, ptr->code4);
					OutputCodeByte (scanner, Indexed_Instruction_Table[ptr+7]);
				}
				return RETCODE_OK;	
			}
		}
		ptr += 8;		//		ptr++;

	}

//	Debug (DEBUG_FATAL_ERROR, "pass_one.c : outputIndexedInstruction : Not supported");
	_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "This instruction not yet supported");
	return RETCODE_ERROR;	// instruction not found
}

function OutputInstruction (scanner, command_id, op1, op2)
{
	// **** UNDER CONSTRUCTION ****

//typedef struct
//{
//0	int instruction_token_id;
//1	int opcode_one;
//2	int opcode_two;
//3	int size;
//4	int instruction_byte_one;
//5	int instruction_byte_two;
//} INSTRUCTION_INFO;

	var ptr;				//INSTRUCTION_INFO* ptr;
	var retval;				//int retval;
	var op_one_search_id;	//int op_one_search_id;
	var op_two_search_id;	//int op_two_search_id;		// the operand 2 token id to search with


	var instruction_token_id = 0;
	var opcode_one = 1;
	var opcode_two = 2;
	var size = 3;
	var instruction_byte_one = 4;
	var instruction_byte_two = 5

	op_one_search_id = op1;
	op_two_search_id = op2;

	if ((op1 == TOKEN_ADDR_IX) || (op1 == TOKEN_ADDR_IY) ||
		(op2 == TOKEN_ADDR_IX) || (op2 == TOKEN_ADDR_IY))
	{
		retval = OutputIndexedInstruction (scanner, command_id, op1, op2);
		return retval;
	}

	if (op2 == TOKEN_LABEL)
	{
		op_two_search_id = TOKEN_NUMBER;
	}

	if (op1 == TOKEN_ADDR_LABEL)
	{
		op_one_search_id = TOKEN_ADDR;
	}

	if (op2 == TOKEN_ADDR_LABEL)
	{
		op_two_search_id = TOKEN_ADDR;
	}
	
//	switch (op2)
//	{
//		case TOKEN_LABEL:	console.log ("TOKEN_LABEL"); break;
//		case TOKEN_ADDR_LABEL: console.log ("TOKEN_ADDR_LABEL"); break;
//		default:
//			console.log ("op2:" + op2);
//	}

//	console.log ("tokenbc " + TOKEN_BC);
//	console.log ("token inc : " + TOKEN_INC);

//	console.log ("outputInstruction");
//	console.log ("command id " + command_id);
//	console.log ("search 1 " + op_one_search_id);	//int op_one_search_id;
//	console.log ("search 2 " + op_two_search_id);	//int op_two_search_id;		// the operand 2 token id to search with

	//ptr = &misc_instructions[0];
	ptr = 0;
//	while (ptr->instruction_token_id != INVALID_TOKEN_ID)
	while (misc_instructions[ptr+instruction_token_id] != INVALID_TOKEN_ID)
	{
//		if (command_id == instruction_token_id[ptr+instruction_token_id])	//if (command_id == ptr->instruction_token_id)
		if (command_id == misc_instructions[ptr+instruction_token_id])	//if (command_id == ptr->instruction_token_id)
		{
//			console.log ("found it >>" + command_id + " :" + scanner.token_buffer + ":");
//			console.log (scanner.token_id);
//			if ((ptr->opcode_one == op_one_search_id) && 
//					(ptr->opcode_two == op_two_search_id))
			if ((misc_instructions[ptr+opcode_one] == op_one_search_id) &&
				(misc_instructions[ptr+opcode_two] == op_two_search_id))
			{
				// found instruction to output
				//OutputCodeByte (scanner, ptr->instruction_byte_one);
				OutputCodeByte (scanner, misc_instructions [ptr + instruction_byte_one]);

				// do checks for OUT (n) and IN a,(n) next.
				if ((command_id == TOKEN_OUT) && (op1 == TOKEN_ADDR) && (op2 == TOKEN_A))
				{
					// out (n),a = special case, only need to output
					// a single code byte after the instruction

					if ((_pass_one_immediate_data > 255) ||
						 (_pass_one_immediate_data < -128))
					{
						_pass_one_report_error (ERROR_LEVEL_FATAL,
						 scanner, "port number out of range");
						return RETCODE_ERROR;
					}
					OutputCodeByte (scanner, _pass_one_immediate_data);
					return RETCODE_OK;
				}

				if ((command_id == TOKEN_IN) && (op1 == TOKEN_A) && (op2 == TOKEN_ADDR))
				{
					// out (n),a = special case, only need to output
					// a single code byte after the instruction

					if ((_pass_one_immediate_data > 255) ||
						 (_pass_one_immediate_data < -128))
					{
						_pass_one_report_error (ERROR_LEVEL_FATAL,
						 scanner, "port number out of range");
						return RETCODE_ERROR;
					}
					OutputCodeByte (scanner, _pass_one_immediate_data);
					return RETCODE_OK;
				}

				//if (ptr->instruction_byte_two != -1)
				if (misc_instructions[ptr+instruction_byte_two] != -1)
				{
					//OutputCodeByte (scanner, ptr->instruction_byte_two);
					OutputCodeByte (scanner, misc_instructions [ptr + instruction_byte_two]);
				}

				if (op1 == TOKEN_NUMBER)
				{
					// immediate data is always 1 byte. (?)
					if ((_pass_one_immediate_data > 255) 
						|| (_pass_one_immediate_data < -128))
					{
						_pass_one_report_error 
							(ERROR_LEVEL_FATAL, 
								scanner, "number out of range");
						return RETCODE_ERROR;
					}
					OutputCodeByte (scanner, _pass_one_immediate_data);
					return RETCODE_OK;
				}
					
				if (op2 == TOKEN_NUMBER)
				{
					// need to output immediate data. Its size
					// depends on whether op1 is 8 or 16 bits
					// in size.

					switch (op1)
					{
						case TOKEN_A:
						case TOKEN_B:
						case TOKEN_C:
						case TOKEN_D:
						case TOKEN_E:
						case TOKEN_H:
						case TOKEN_L:
						case TOKEN_ADDR_HL:

							if ((_pass_one_immediate_data > 255) ||
							 (_pass_one_immediate_data < -128))
							{
								_pass_one_report_error (ERROR_LEVEL_FATAL,
								 scanner, "number out of range");
								return RETCODE_ERROR;
							}
							OutputCodeByte (scanner, _pass_one_immediate_data);
							break;

						default:
							OutputCodeWord (scanner, _pass_one_immediate_data);
							break;
					}
				}

				if ((op1 == TOKEN_ADDR_LABEL) || 
					(op2 == TOKEN_ADDR_LABEL) || (op2 == TOKEN_LABEL))
				{
//							console.log ("ADDR LABEL");
					//retval = LabelConstant_AddConstant (&operand_label, 
//							_pass_one_ProgramCounter, CONSTANT_TYPE_ADDRESS, scanner->line_number);
					retval = LabelConstant_AddConstant (operand_label, 
							_pass_one_ProgramCounter, CONSTANT_TYPE_ADDRESS, scanner.line_number);

//					DebugString (DEBUG_TRACE, "adding label constant:",GetStringPtr (&operand_label));
					OutputCodeWord (scanner, 0);
					return RETCODE_OK;
				}

				if ((op1 == TOKEN_ADDR) || (op2 == TOKEN_ADDR))
				{
					// need to output a word of data
					OutputCodeWord (scanner, _pass_one_immediate_data);
					return RETCODE_OK;
				}
				return RETCODE_OK;
			}
		}
		ptr += 6;	//ptr++;
	}

	_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "Instruction not supported");
	return RETCODE_ERROR;	// instruction not found
}

//function GenerateInstruction (scanner, token_buffer, instruction_token_id)
function GenerateInstruction (scanner, instruction_token_id)
{
	var number_of_operands;
	var opcode_1;
	var opcode_2;
	var retval;
	var token_id;

//	console.log ("####:" + scanner.token_buffer + " :" + scanner.token_id);
	number_of_operands = GetNumOperands (instruction_token_id);
	
//	console.log ("num operands:" + number_of_operands);

	if (number_of_operands > 0)
	{
		//retval = _pass_one_GetOperand (scanner, token_buffer, opcode_1);
		opcode_1 = _pass_one_GetOperand (scanner)	//, token_buffer);
		if (opcode_1 == RETCODE_ERROR)		//if (retval == RETCODE_ERROR)
		{
			console.log ("invalid op1");
//			Debug (DEBUG_TRACE, "pass_one.c : GenerateInstruction(): invalid op1");
			return RETCODE_ERROR;
		}
	}

	opcode_2 = -1;
	if (number_of_operands > 1)
	{
		// need to scan in ',' followed by the second token.
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
		if (token_id != TOKEN_COMMA)
		{
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "',' expected");
			return RETCODE_ERROR;
		}
	
		//retval = _pass_one_GetOperand (scanner, token_buffer, &opcode_2);
		opcode_2 = _pass_one_GetOperand (scanner);	//, token_buffer);
	}
	
//	console.log ("op1:" + opcode_1);
//	console.log ("op2:" + opcode_2);
	retval = OutputInstruction (scanner, instruction_token_id, opcode_1, opcode_2);

	return retval;
}


	// -------------------------------------------- //
	//	Expression Parsing Routines.		//
	// ============================================ //

	// Note : this is not an optimal expression parser..
	// but it works, so im happy.


// note : the next token is scanned when a symbol 
// is reached (i.e. an actual character, number or identifier

//	expression 	= unary_op term exp' | term exp'
//	exp' 		= bin_op term exp'| #
			
//	term	= factor term'
//	term'	= mul_op factor term'| #
	
//	factor	= identifier | number | ( expression )

var _unary_op_table = [TOKEN_MINUS, TOKEN_TILDE, TOKEN_EXCLAMATIONMARK, INVALID_TOKEN_ID];
var _mul_op_table	= [TOKEN_ASTERISK, TOKEN_DIVIDE, TOKEN_PERCENT, INVALID_TOKEN_ID];
var _add_op_table	= [TOKEN_PLUS, TOKEN_MINUS, INVALID_TOKEN_ID];
var _shift_op_table	= [TOKEN_SHIFTLEFT, TOKEN_SHIFTRIGHT, INVALID_TOKEN_ID];
var _rel_op_table	= [TOKEN_LESSTHAN, TOKEN_GREATERTHAN, TOKEN_LESS_OR_EQUAL,
						TOKEN_GREATER_OR_EQUAL, INVALID_TOKEN_ID];
var _equal_op_table	= [TOKEN_EQUALS, TOKEN_IS_EQUAL, TOKEN_NOT_EQUAL, INVALID_TOKEN_ID];
var _or_op_table	= [TOKEN_LOGICAL_OR, INVALID_TOKEN_ID];
var _and_op_table	= [TOKEN_LOGICAL_AND, INVALID_TOKEN_ID];
var _bitwise_or_op_table	= [TOKEN_VERTICALLINE, INVALID_TOKEN_ID];
var _bitwise_and_op_table	= [TOKEN_AMPERSAND, INVALID_TOKEN_ID];
//int _bitwise_xor_op_table [] = { TOKEN_XOR, INVALID_TOKEN_ID};
var _bitwise_xor_op_table	= [TOKEN_CIRCUMFLEX, INVALID_TOKEN_ID];	// circumflex = ^

//int _pass_one_is_bin_op (int* bin_op_table, char* token_buffer, int* op_token_id)
function _pass_one_is_bin_op (bin_op_table, token_id)	//, token_buffer)	//, op_token_id)
{
	// javascript version  : returns op_token_id if successful,
	// otherwise returns INVALID_TOKEN_ID

	var i;			//int i;
	//var token_id;	//int token_id;

	i = 0;
	//token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);

	while (bin_op_table[i] != INVALID_TOKEN_ID)
	{
		if (bin_op_table[i] == token_id)
		{
//#ifdef TEST_EXPR
//			DebugString (DEBUG_TRACE, "is_bin_op:yes:", token_buffer);
//			DebugNumber (DEBUG_TRACE, "binop token id=", token_id);
//#endif
//			*op_token_id = token_id;
			return token_id;
//			return RETCODE_TRUE;
		}
		i++;
	}
	//console.log (token_id + "--------------invalid token");
	return INVALID_TOKEN_ID;	//RETCODE_FALSE;
}

function _pass_one_factor (scanner)	//, token_buffer)
{
	// factor = identifier | number | ( expression )
	// need to examine the token to decide what to do next.

	var token_id;
	var retval;

	var value;

	var identifier_type;

	var tmp;	//STRING tmp;
	
//	console.log ("_pass_one_factor");

//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : _pass_one_factor()");
//#endif
		// for identifier or a number use scanner to save
		// having to parse the token.

	switch (GetTokenType (scanner))
	{
		case TOKEN_TYPE_NUMBER:	//SCANNER_TOKEN_TYPE_NUMBER:		// fall through
			value = scanner.token_value;
			_calc.PostfixCalc_Number (value);		// push the number onto the stack

//			console.log ("TOKEN_NUMBER:" + value);
//#ifdef TEST_EXPR
//Msg (token_buffer);
//#endif
			return RETCODE_OK;
			
		case TOKEN_TYPE_IDENTIFIER:	//SCANNER_TOKEN_TYPE_IDENTIFIER:
			//tmp="";				//CreateString (&tmp);
			tmp=scanner.token_buffer;	//token_buffer;		//SetString (&tmp, token_buffer);
			retval = Label_LabelExists (tmp);
			//if (retval == RETCODE_FALSE)
			if (retval == false)
			{
				//DebugString (DEBUG_TRACE, "pass_one.c : Factor(): Undefined Label ", token_buffer);
				//SetString (&tmp, "Label ");
				//ConcatRawString (&tmp, token_buffer);
				//ConcatRawString (&tmp, " undefined");
				_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, tmp);	//GetStringPtr (&tmp));
				//DestroyString (&tmp);
				return RETCODE_ERROR;
			}

			value = Label_GetLabelValue (tmp);
			_calc.PostfixCalc_Number (value);		// push the number onto the stack

//#ifdef WARN_ADDR_IN_EXPR
//			identifier_type = Label_GetLabelType (&tmp);
//			if (identifier_type == LABEL_TYPE_ADDRESS)
//			{
//				DebugString (DEBUG_TRACE, "pass_one.c : Factor(): Address Label not allowed in expressions", token_buffer);
//				SetString (&tmp, "Warning : address label ");
//				ConcatRawString (&tmp, token_buffer);
//				ConcatRawString (&tmp, " in constant expression");
//				_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, GetStringPtr (&tmp));
				// warn but continue anyway.
//			}
//#endif
//			DestroyString (&tmp);

//#ifdef TEST_EXPR
//DebugString (DEBUG_TRACE, "pass_one.c : _pass_one_factor():", token_buffer);
//Msg (token_buffer);
//#endif
			return RETCODE_OK;
		default:
			break;
	}

	token_id = scanner.token_id;		//Tokens_GetTokenId (token_buffer);
	if (token_id != TOKEN_LEFTBRACKET)
	{
//		Debug (DEBUG_TRACE, "pass_one.c : factor(): unexpected token.");
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unexpected token.");
		return RETCODE_ERROR;
	}
		// got a '(' so scan in next token + restart parsing.

	retval = scanner.getToken();	// 	//retval = GetNextToken (scanner);

	if (retval == RETCODE_ERROR)
	{
		Debug (DEBUG_TRACE, "pass_one.c : factor(): unexpected error");
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unexpected error");
		return RETCODE_ERROR;
	}

	retval = _pass_one_expression (scanner);	//, token_buffer);

	token_id = scanner.token_id;		//Tokens_GetTokenId (token_buffer);
	if (token_id != TOKEN_RIGHTBRACKET)
	{
		_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "')' expected");
	}

	return RETCODE_OK;
}

function unary_expr (scanner)	//, token_buffer)
{
	//	unary_expr	= unary_op factor | factor

	var retval;
	var token_id;
	
//	console.log ("unary_expr " + scanner.token_buffer);

	token_id = _pass_one_is_bin_op (_unary_op_table, scanner.token_id)	//, token_buffer);
//	if (_pass_one_is_bin_op (_unary_op_table, token_buffer, &token_id) == RETCODE_TRUE)
	if (token_id != INVALID_TOKEN_ID)
	{
		scanner.getToken();	//retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE, "pass_one.c : factor(): unexpected error");
			_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unexpected error");
			return RETCODE_ERROR;
		}

		retval = _pass_one_factor (scanner)	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE, "pass_one.c: unary_expr(): factor failed");
			return RETCODE_ERROR;
		}

		switch (token_id)
		{
			case TOKEN_MINUS: _calc.PostfixCalc_Operator (OP_UNARY_MINUS);
//						#ifdef TEST_EXPR
//						Msg ("-");
//						#endif
						break;
			case TOKEN_TILDE:	_calc.PostfixCalc_Operator (OP_BITWISE_NOT);
//						#ifdef TEST_EXPR
//						Msg ("~");
//						#endif
						break;
			case TOKEN_EXCLAMATIONMARK:
						_calc.PostfixCalc_Operator (OP_LOGICAL_NOT);
//						#ifdef TEST_EXPR
//						Msg ("!");
//						#endif
						break;
			default: break;
		}
		return RETCODE_OK;
	}

//	console.log ("not unary op");
	retval = _pass_one_factor (scanner)	//, token_buffer);
	return retval;
}

function _pass_one_term (scanner)	//, token_buffer)
{
	// **** UNDER CONSTRUCTION ****
	
	// note :modified from original c code because it just didn't
	// work. not sure if I was using an old version of the code or not.

	// term = term mul_op unary_expr | unary_expr

	// term	= factor term'
	// term'	= mulop unary_expr term' | #

	// term returns looking at the next token to process.

	var retval;
	var token_id;

//	console.log ("pass_one_term");
//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : _pass_one_term()");
//#endif

//	console.log (" scanner first op : " + scanner.token_buffer);

	retval = unary_expr (scanner);	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
//		Debug (DEBUG_TRACE, "pass_one. term(): factor failed");
		return RETCODE_ERROR;
	}

//	console.log ("qweqweqew:" + scanner.token_buffer);

	scanner.getToken();	// retval = GetNextToken (scanner);
	if (retval == RETCODE_ERROR)
	{
//		Debug (DEBUG_TRACE, "pass_one.c : factor(): unexpected error");
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "unexpected error");
		return RETCODE_ERROR;
	}

//	console.log (" scanner : 2nd op:" + scanner.token_buffer + ":");

//	while (_pass_one_is_bin_op (_mul_op_table, token_buffer, &token_id) == RETCODE_TRUE)
	token_id = _pass_one_is_bin_op (_mul_op_table, scanner.token_id);	// token_buffer);
	while (token_id != INVALID_TOKEN_ID)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE, "pass_one.c : factor(): unexpected error");
			_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unexpected error");
			return RETCODE_ERROR;
		}
		
//		console.log ("tok:" + scanner.token_buffer);

		retval = unary_expr (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

/*		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE, "pass_one.c : factor(): unexpected error");
			_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unexpected error");
			return RETCODE_ERROR;
		}
*/
		switch (token_id)
		{
			case TOKEN_ASTERISK:	_calc.PostfixCalc_Operator (OP_MULTIPLY);
//					#ifdef TEST_EXPR
//					Msg ("*");	// output '*'
//					#endif
					break;
			case TOKEN_DIVIDE:

					if (scanner.token_value == 0)
					{
						_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "Division by zero");
						return RETCODE_ERROR;
					}
					retval = _calc.PostfixCalc_Operator (OP_DIVIDE);
//					#ifdef TEST_EXPR
//					Msg ("/");	// output '*'
//					#endif
					break;
			case TOKEN_PERCENT:	_calc.PostfixCalc_Operator (OP_REMAINDER);
//					#ifdef TEST_EXPR
//					Msg ("%");	// output '*'
//					#endif
					break;
		}

		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE, "pass_one.c : factor(): unexpected error");
			_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unexpected error");
			return RETCODE_ERROR;
		}

		token_id = _pass_one_is_bin_op (_mul_op_table, scanner.token_id);	//token_buffer);
	}

	return RETCODE_OK;
}

function add_expr (scanner)	//, token_buffer)
{
	var retval;
	var token_id;

//	console.log ("add_expr");
//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : add_expr");
//#endif

	retval = _pass_one_term (scanner);	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	token_id = _pass_one_is_bin_op (_add_op_table, scanner.token_id);	// token_buffer);
	
//	console.log ("ADD OP");
	
	while (token_id != INVALID_TOKEN_ID)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE, "pass_one.c : expression(): unexpected error");
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "unexpected error");
			return RETCODE_ERROR;
		}

		retval = _pass_one_term (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE, "pass_one.c : expression(): add_op expected");
			return RETCODE_ERROR;
		}

		switch (token_id)
		{
			case TOKEN_ADD:
			case TOKEN_PLUS:	_calc.PostfixCalc_Operator (OP_ADD);
//#ifdef TEST_EXPR
//Msg ("+");		// output '+'
//#endif
					break;
			case TOKEN_MINUS:	_calc.PostfixCalc_Operator (OP_SUBTRACT);
//#ifdef TEST_EXPR
//Msg ("-");		// output '-'
//#endif
					break;
		}
		token_id = _pass_one_is_bin_op (_add_op_table, scanner.token_id);	//token_buffer);
	}
	return RETCODE_OK;
}

function shift_expr (scanner)	//, token_buffer)
{
	//	shift_expr	= shift_expr shift_op add_expr | add_expr

	// add expr = termp

	var retval;
	var token_id;

//	console.log ("shift_expr");
//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : shift_expr()");
//#endif

	retval = add_expr (scanner)	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	token_id = _pass_one_is_bin_op (_shift_op_table, scanner.token_id)	//token_buffer);
	while (token_id != INVALID_TOKEN_ID)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE,"pass_one.c:logical_or():token expected after shift");
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "token expected after shift");
			return RETCODE_ERROR;
		}

		retval = add_expr (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

		switch (token_id)
		{
			case TOKEN_SHIFTLEFT: _calc.PostfixCalc_Operator (OP_SHIFTLEFT);
//#ifdef TEST_EXPR
//Msg ("<<");
//#endif
				break;

			case TOKEN_SHIFTRIGHT:	_calc.PostfixCalc_Operator (OP_SHIFTRIGHT);
//#ifdef TEST_EXPR
//Msg (">>");
//#endif
				break;
		}

		token_id = _pass_one_is_bin_op (_shift_op_table, scanner.token_id);	//, token_buffer);
	}
	return RETCODE_OK;
}

function rel_expr (scanner)	//, token_buffer)
{
	//	rel_expr	= rel_expr rel_op shift_expr | shift_expr

	var retval;
	var token_id;

//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : rel_expr()");
//#endif

//	console.log ("rel_expr");

	retval = shift_expr (scanner);	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	token_id = _pass_one_is_bin_op (_rel_op_table);	//, token_buffer);
	while (token_id != INVALID_TOKEN_ID)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE,"pass_one.c:logical_or():token expected after |");
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "token expected after '|'");
			return RETCODE_ERROR;
		}

		retval = shift_expr (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

		switch (token_id)
		{
			case TOKEN_LESSTHAN:	_calc.PostfixCalc_Operator (OP_LESSTHAN);
//					#ifdef TEST_EXPR
//					Msg ("<");
//					#endif
					break;
			case TOKEN_GREATERTHAN:	_calc.PostfixCalc_Operator (OP_GREATERTHAN);
//					#ifdef TEST_EXPR
//					Msg (">");
//					#endif
					break;

			case TOKEN_LESS_OR_EQUAL:	_calc.PostfixCalc_Operator (OP_LESS_OR_EQUAL);
//					#ifdef TEST_EXPR
//					Msg ("<=");
//					#endif
					break;

			case TOKEN_GREATER_OR_EQUAL:	_calc.PostfixCalc_Operator (OP_GREATER_OR_EQUAL);
//					#ifdef TEST_EXPR
//					Msg (">=");
//					#endif
					break;
			default: break;
		}
		token_id = _pass_one_is_bin_op (_rel_op_table, scanner.token_id);	//token_buffer);
	}
	return RETCODE_OK;
}

function equal_expr (scanner)	//, token_buffer)
{
	//	equal_expr	= equal_expr equal_op rel_expr | rel_expr

	var retval;
	var token_id;

//	console.log ("equal_expr");
//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : equal_expr()");
//#endif

	retval = rel_expr (scanner);	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	token_id = _pass_one_is_bin_op (_equal_op_table, scanner.token_id);	//token_buffer);
	while (token_id != INVALID_TOKEN_ID)	// RETCODE_TRUE)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE,"pass_one.c:logical_or():token expected after |");
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "token expected after '|'");
			return RETCODE_ERROR;
		}

		retval = rel_expr (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

		switch (token_id)
		{
			case TOKEN_IS_EQUAL:
			case TOKEN_EQUALS:	_calc.PostfixCalc_Operator (OP_EQUAL);
//#ifdef TEST_EXPR
//Msg ("==");		// output 'equals ==' 
//#endif
						break;
			case TOKEN_NOT_EQUAL:
							_calc.PostfixCalc_Operator (OP_NOT_EQUAL);
							break;
//#ifdef TEST_EXPR
//Msg ("!=");		// output 'equals ==' 
//#endif
		}
		token_id = _pass_one_is_bin_op (_equal_op_table, scanner.token_id);	//token_buffer);
	}
	return RETCODE_OK;
}

function bitwise_and_expr (scanner)	//, token_buffer)
{
	// bitwise_and_expr	= bitwise_and_expr "&" shift_expr | equal_expr

	var retval;
	var token_id;

//	console.log ("bitwise_and_expr");
//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : bitwise_and_expr()");
//#endif

	retval = equal_expr (scanner);	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	token_id = _pass_one_is_bin_op (_bitwise_and_op_table, scanner.token_id);	//token_buffer);
	while (token_id != INVALID_TOKEN_ID)	//== RETCODE_TRUE)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE,"pass_one.c:logical_or():token expected after |");
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "token expected after '|'");
			return RETCODE_ERROR;
		}

		retval = equal_expr (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

		_calc.PostfixCalc_Operator (OP_BITWISE_AND);
//		#ifdef TEST_EXPR
//			Msg ("&");		// output 'and' 
//		#endif
		token_id = _pass_one_is_bin_op (_bitwise_and_op_table, scanner.token_id);	//token_buffer);
	}
	return RETCODE_OK;
}

function bitwise_xor_expr (scanner)	//, token_buffer)
{
	//	bitwise_xor_expr	= bitwise_xor_expr "^" and_expr | bitwise_and_expr

	var retval;
	var token_id;

//	console.log ("bitwise_xor_expr");
//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : bitwise_xor_expr()");
//#endif

	retval = bitwise_and_expr (scanner);	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	token_id = _pass_one_is_bin_op (_bitwise_xor_op_table, scanner.token_id)	//token_buffer);
	while (token_id != INVALID_TOKEN_ID)	//== RETCODE_TRUE)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE,"pass_one.c:logical_or():token expected after |");
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "token expected after '|'");
			return RETCODE_ERROR;
		}

		retval = bitwise_and_expr (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

		_calc.PostfixCalc_Operator (OP_BITWISE_XOR);
//#ifdef TEST_EXPR
//Msg ("^");		// output 'xor' 
//#endif
		token_id = _pass_one_is_bin_op (_bitwise_xor_op_table, scanner.token_id);	//token_buffer);
	}
	return RETCODE_OK;
}


function bitwise_or_expr (scanner)	//, token_buffer)
{
//		bitwise_or_expr	= bitwise_or_expr "|" bitwise_xor_expr | bitwise_xor_expr

	var retval;
	var token_id;

//	console.log ("bitwise_or_expr");
//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : bitwise_or_expr()");
//#endif

	retval = bitwise_xor_expr (scanner);	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	token_id = _pass_one_is_bin_op (_bitwise_or_op_table, scanner.token_id);	//token_buffer);
	while (token_id != INVALID_TOKEN_ID)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE,"pass_one.c:logical_or():token expected after |");
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "token expected after '|'");
			return RETCODE_ERROR;
		}

		retval = bitwise_xor_expr (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

		_calc.PostfixCalc_Operator (OP_BITWISE_OR);
//#ifdef TEST_EXPR
//Msg ("|");		// output '|' 
//#endif
		token_id = _pass_one_is_bin_op (_bitwise_or_op_table, scanner.token_id);	//token_buffer);
	}
	return RETCODE_OK;
}

function logical_and_expr (scanner)	//, token_buffer)
{
	// logical_and_expr = logical_and_expr AND bitwise_or_expr | bitwise_or_expr

	var retval;
	var token_id;

//	console.log ("logical_and_expr");
//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : logical_and_expr()");
//#endif

	retval = bitwise_or_expr (scanner)	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	token_id = _pass_one_is_bin_op (_and_op_table, scanner.token_id);	//token_buffer);
	while (token_id != INVALID_TOKEN_ID)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE,"pass_one.c:logical_or():token expected after |");
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "token expected after '|'");
			return RETCODE_ERROR;
		}

		retval = bitwise_or_expr (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

		_calc.PostfixCalc_Operator (OP_LOGICAL_AND);
//#ifdef TEST_EXPR
//Msg ("and");		// output '&&' (and)
//#endif
		token_id = _pass_one_is_bin_op (_and_op_table, scanner.token_id);	//token_buffer);
	}
	return RETCODE_OK;
}


function _pass_one_logical_or_expr (scanner)	//, token_buffer)
{
	// logical_or_expr = logical_or_expr OR logical_and_expr | logical_and_expr

	var retval;
	var token_id;

//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : _pass_one_logical_or_expr()");
//#endif

//	console.log ("_pass_one_logical_or_expr");

	retval = logical_and_expr (scanner);	//, token_buffer);
	if (retval == RETCODE_ERROR)
	{
		return RETCODE_ERROR;
	}

	token_id = _pass_one_is_bin_op (_or_op_table, scanner.token_id);	//token_buffer);
	while (token_id != INVALID_TOKEN_ID)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (retval == RETCODE_ERROR)
		{
//			Debug (DEBUG_TRACE,"pass_one.c:logical_or():token expected after |");
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "token expected after '|'");
			return RETCODE_ERROR;
		}

		retval = logical_and_expr (scanner);	//, token_buffer);
		if (retval == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}

		_calc.PostfixCalc_Operator (OP_LOGICAL_OR);
//#ifdef TEST_EXPR
//Msg ("or");		// output '||' (or)
//#endif
		token_id = _pass_one_is_bin_op (_or_op_table, scanner.token_id);	//token_buffer);
	}
	return RETCODE_OK;
}

function _pass_one_expression (scanner)	//, token_buffer)
{
	// expression = unary_op term exp' | term exp'
	// exp'	= bin_op term exp'| #

	// upon calling, token_buffer should hold the
	// first token in the expression to scan.

	// expression returns looking at the next token to process
	// (because exp' returns that!)

	var retval;
	
//	console.log ("_pass_one_expression");

//	int token_id;

//#ifdef TEST_EXPR
//	Debug (DEBUG_TRACE, "pass_one.c : _pass_one_expression()");
//	DebugString (DEBUG_TRACE, "expression: first token = ", token_buffer);
//#endif

		// begin expression parser proper

	retval = _pass_one_logical_or_expr (scanner);	//, token_buffer);
	
//	console.log ("_pass_one_ParseExpression retval:" + retval);
	
	return retval;
}

//int _pass_one_ParseUndefinedLabelConstant (SCANNER* scanner, char* token_buffer)
//{
//}

function _pass_one_ParseExpression (scanner)	//, token_buffer)
{
	// javascript version now returns the result

	// TO DO : CHECK THIS WORKS
	
	// NOW RETURNS RESULT 

	// returns RETCODE_OK if sucessfully parsed and stores the 
	// value of the expression in 'result', 
	// otherwise returns RETCODE_ERROR and 'result' is undefined.

	// when it returns, token buffer holds the next token to scan.

	var retval;

	var postfix_result;

//#ifdef TEST_EXPR
//	char tmp [256];
//#endif

	// get first token to scan.

//#ifdef TEST_EXPR
//Msg ("------ parsing expression --------");
//#endif

//	console.log ("_pass_one_ParseExpression");


	_calc = new POSTFIX_CALC();
	_calc.PostfixCalc_Init();
//	retval = PostfixCalc_Init (&_calc);
//	if (retval == RETCODE_ERROR)
//	{
//		Debug (DEBUG_FATAL_ERROR, "pass_one.c : _ParseExpression(): ** ERROR ** Unable to initialise calculator stack");
//		return RETCODE_ERROR;
//	}


	scanner.getToken();	// retval = GetNextToken (scanner);

		// -- parse + evaluate expression as normal.
	
	retval = _pass_one_expression (scanner);	//, token_buffer);

	if (retval == RETCODE_ERROR)
	{
//		Debug (DEBUG_TRACE, "_pass_one_ParseExpression(): Not a valid expression");
		console.log ("pass_one.js 2830 : not a valid expression");
		return null;
	}
	
//	console.log ("_pass_one_ParseExpression: calculating result");
//	else
//	{
		postfix_result = _calc.PostfixCalc_Result ();
		
//		console.log ("result:" + postfix_result);
//#ifdef TEST_EXPR
//	sprintf (tmp, "result = %d", (int)postfix_result);
//	Msg (tmp);
//#endif
	
//		*result = postfix_result;
//		Debug (DEBUG_TRACE, "_pass_one_ParseExpression(): Expression Ok.");
//	}

	_calc.PostfixCalc_Cleanup ();

	return postfix_result;
//	return result;
//	return retval;
}


	// ====================================
	// ===== End of Expression Parsing ====
	// ====================================







	// ----------------------------------------
	//		Instruction Parsing
	// ----------------------------------------
function _pass_one_Get_CC_Code (token_id)
{
	var cc_code;

	switch (token_id)
	{
		case TOKEN_NOTZERO:	cc_code = 0;	break;
		case TOKEN_ZERO	:	cc_code = 1;	break;
		case TOKEN_NOCARRY:	cc_code = 2;	break;

		case TOKEN_C	:	// fall through
		case TOKEN_CARRY	:	cc_code = 3;	break;

		case TOKEN_PO	:	cc_code = 4;	break;
		case TOKEN_PE	:	cc_code = 5;	break;
		case TOKEN_P	:	cc_code = 6;	break;
		case TOKEN_M	:	cc_code = 7;	break;
		default:	cc_code = INVALID_CC_CODE;
				break;
	}
	return cc_code;
}

function _pass_one_GetOp2 (scanner)	//, token_buffer)	//, int* operand)
{
	// javascript version : returns the operand
	// returns INVALID_TOKEN_ID if an error occurs.

	// handles (IX+d) and (IY+d) operands
	// also allows (IX) and (IY) and assumes that +d = 0
	// in these  cases.

	// assumes (IX or (IY has been scanned in already.

	var token_id;
	var retval;
	var expression_result;
	
	var operand;

	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	switch (token_id)
	{
		case TOKEN_IX:
				operand = TOKEN_ADDR_IX;
				break;
		case TOKEN_IY:
				operand = TOKEN_ADDR_IY;
				break;
		default:
//				Debug (DEBUG_FATAL_ERROR, "pass_one.c : GetOp2(): ** ERROR ** IX or IY expected");
				operand = INVALID_TOKEN_ID;
				return operand;
//				return RETCODE_ERROR;
	}

	scanner.getToken();	// retval = GetNextToken (scanner);
	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	if (token_id == TOKEN_RIGHTBRACKET)
	{
		_pass_one_immediate_data = 0;

		scanner.getToken();	// retval = GetNextToken (scanner);
		return operand;	//RETCODE_OK;
	}

	// to do.. parse '+ d) part.

	if (token_id != TOKEN_PLUS)
	{
		_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "'+' expected");
		operand = INVALID_TOKEN_ID;
		return operand;	//RETCODE_ERROR;
	}

	// d is assumed to be an expression.

	//retval = _pass_one_ParseExpression (scanner, token_buffer, &expression_result);
	expression_result = _pass_one_ParseExpression (scanner);	//, token_buffer);
	console.log ("pass_one.js:2937 : to do, process expression error");
//	if (retval == RETCODE_ERROR)
//	{
//		*operand = INVALID_TOKEN_ID;
//		return RETCODE_ERROR;
//	}

	_pass_one_immediate_data = Math.floor (expression_result);

		// check range of +d 
	if ((_pass_one_immediate_data > 255) || (	_pass_one_immediate_data < -128))
	{
		_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "offset out of range");
		operand = INVALID_TOKEN_ID;
		return operand;	// RETCODE_ERROR;
	}

	// check for final ')'

	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	if (token_id != TOKEN_RIGHTBRACKET)
	{
		_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "')' expected");
		operand = INVALID_TOKEN_ID;
		return operand;	// RETCODE_ERROR;
	}

	scanner.getToken();	// retval = GetNextToken (scanner);
	return operand;	//RETCODE_OK;
}


function _ParseExp2 (scanner, token_buffer)	//, float* result)
{
	// javascript version : returns result.

	// returns RETCODE_OK if sucessfully parsed and stores the 
	// value of the expression in 'result', 
	// otherwise returns RETCODE_ERROR and 'result' is undefined.
	// when it returns, token buffer holds the next token to scan.

	// NOTE : THIS IS FOR USE BY GetOperand and is *NOT* a general
	// expression parse routine.

	// Assumes the first token has already been read in

	var retval;
//	int token_id;
//	STRING tmp;
	var postfix_result;
	var result;

	retval = _calc.PostfixCalc_Init();
	if (retval == RETCODE_ERROR)
	{
//		Debug (DEBUG_FATAL_ERROR, "pass_one.c : _ParseExp2(): ** ERROR ** Unable to initialise calculator stack");
		return RETCODE_ERROR;
	}
	retval = _pass_one_expression (scanner);	//, token_buffer);

	if (retval == RETCODE_ERROR)
	{
//		Debug (DEBUG_TRACE, "_pass_one_ParseExp2(): Not a valid expression");
	}
	else
	{
		postfix_result = _calc.PostfixCalc_Result ();
		result = postfix_result;
	}
	_calc.PostfixCalc_Cleanup ();
	return result;	//return retval;
}


function _pass_one_GetOperand (scanner)	//, token_buffer)	//, operand)
{
	// javascript version : returns the operand as I don't think
	// you can modify numbers as passed by reference.

	// Puts the token_id of the instruction into 'operand'

	// xxxx c return info:
	// xxxx Returns RETCODE_OK if successful
	// xxxxx otherwise returns RETCODE_ERROR.

//	dd = BC, DE, HL
//	r = A, B, C, D, E, H, L, (HL)

//	others = IX,IY,SP,I,R, nn, 
//	(ix+d), (iy+d), (nn), (BC), (DE), (HL), (SP), (C)

//	nn is a problem as it could be a forward-reference
//	label and not just a simple expression.
//	
	var i;
	var token_id;
	var retval;

	var operand_token;
	var tmp;
	var expression_result;
	
	var operand;

//	console.log ("pass_one.c : GetOperand(): *---------------*");

//	Debug (DEBUG_TRACE, "pass_one.c : GetOperand(): *---------------*");
	scanner.getToken();	// retval = GetNextToken (scanner);
	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);

		// scan for simple opcode first
		// a, b, c, d, e, h, l, i, r
		// BC, DE, HL, IX, IY, SP
//womble
	i = 0; 
	while (_pass_one_simple_opcode [i] != INVALID_TOKEN_ID)
	{
		if (_pass_one_simple_opcode[i] == token_id)
		{
			operand = token_id;
			scanner.getToken();	// retval = GetNextToken (scanner);

//			if (token_id == TOKEN_DE)	console.log ("pass_one.c : GetOperand(): returning simple token 'DE'");
//			Debug (token_id == TOKEN_A, "pass_one.c : GetOperand(): returning simple token 'A'");
//			Debug (token_id == TOKEN_B, "pass_one.c : GetOperand(): returning simple token 'B'");
//			Debug (token_id == TOKEN_C, "pass_one.c : GetOperand(): returning simple token 'C'");
//			Debug (token_id == TOKEN_D, "pass_one.c : GetOperand(): returning simple token 'D'");
//			Debug (token_id == TOKEN_E, "pass_one.c : GetOperand(): returning simple token 'E'");
//			Debug (token_id == TOKEN_H, "pass_one.c : GetOperand(): returning simple token 'H'");
//			Debug (token_id == TOKEN_L, "pass_one.c : GetOperand(): returning simple token 'L'");
//			Debug (token_id == TOKEN_BC,"pass_one.c : GetOperand(): returning simple token 'BC'");
//			Debug (token_id == TOKEN_DE,"pass_one.c : GetOperand(): returning simple token 'DE'");
//			Debug (token_id == TOKEN_HL,"pass_one.c : GetOperand(): returning simple token 'HL'");
//			Debug (token_id == TOKEN_AF,"pass_one.c : GetOperand(): returning simple token 'AF'");
//			Debug (token_id == TOKEN_SP,"pass_one.c : GetOperand(): returning simple token 'SP'");
//			Debug (token_id == TOKEN_IX,"pass_one.c : GetOperand(): returning simple token 'IX'");
//			Debug (token_id == TOKEN_IY,"pass_one.c : GetOperand(): returning simple token 'IY'");

			return operand;	// RETCODE_OK;
		}
		i++;
	}

//	console.log ("AAA");

	if (token_id == TOKEN_LEFTBRACKET)
	{
//		console.log ("UUU");
		scanner.getToken();	// retval = GetNextToken (scanner);
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);

		switch (token_id)
		{
			case TOKEN_C:	operand_token = TOKEN_PORT_C;
					break;
			case TOKEN_BC:	operand_token = TOKEN_ADDR_BC;
					break;
			case TOKEN_DE:	operand_token = TOKEN_ADDR_DE;
					break;
			case TOKEN_HL:	operand_token = TOKEN_ADDR_HL;
					break;
			case TOKEN_SP:	operand_token = TOKEN_ADDR_SP;
					break;

			case TOKEN_IX:	//retval = _pass_one_GetOp2 (scanner, token_buffer, operand);
						operand = _pass_one_GetOp2 (scanner);	//, token_buffer);
					return operand;	//RETCODE_OK;

			case TOKEN_IY:	//retval = _pass_one_GetOp2 (scanner, token_buffer, operand);
						operand = _pass_one_GetOp2 (scanner);	//, token_buffer);
					return operand;	//RETCODE_OK;

			default:	operand_token = INVALID_TOKEN_ID;
					// token = (nn)
					break;
		}
//		console.log ("fff");


		if (operand_token != INVALID_TOKEN_ID)
		{
			// got the operand (C),(BC),(DE),(HL),(SP)
			// need to check for ')' to finish.

			scanner.getToken();	// retval = GetNextToken (scanner);
			token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
			if (token_id != TOKEN_RIGHTBRACKET)
			{
				_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "')' expected");
				operand = INVALID_TOKEN_ID;
				return operand;	// RETCODE_ERROR;
			}
			operand = operand_token;
			scanner.getToken();	// retval = GetNextToken (scanner);
			return operand;	// RETCODE_OK;
		}

//		console.log ("fff");
//		token = (nn) at this point.

//		console.log ("==============================1234");

		if (GetTokenType (scanner) == TOKEN_TYPE_IDENTIFIER)	//SCANNER_TOKEN_TYPE_IDENTIFIER)
		{
				// need to test for label.
				
//			console.log ("3211 : test for label ===========================");

			tmp = "";		//			CreateString (&tmp);
			tmp = scanner.token_buffer;	//			SetString (&tmp, token_buffer);
			retval = Label_LabelExists (tmp);
//			if (retval == RETCODE_FALSE)
			if (retval == false)
			{
					// undefined label, assume forward referenced.
				operand_label = tmp;		//CopyString (&tmp, &operand_label);
				
//				console.log ("}}}}}}}}}}}}}}}}}}}}}}}}>>> Operand label:" + operand_label);
				tmp = null;					//DestroyString (&tmp);
				operand = TOKEN_ADDR_LABEL;
				//DebugString (DEBUG_TRACE, "pass_one.c : GetOperand(): returning (forward address)", token_buffer);

				scanner.getToken();	// retval = GetNextToken (scanner);
				token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
				if (token_id != TOKEN_RIGHTBRACKET)
				{
					_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "')' expected");
					operand = INVALID_TOKEN_ID;
					return operand;	//RETCODE_ERROR;
				}
				scanner.getToken();	// retval = GetNextToken (scanner);
				return operand;
			}
//			DestroyString (&tmp);
		}

				//  *** PARSE (nn) ***
		//retval = _ParseExp2 (scanner, token_buffer, &expression_result);
		expression_result = _ParseExp2 (scanner);	//, token_buffer)	//, &expression_result);
//		if (retval == RETCODE_ERROR)
//		{
//			*operand = INVALID_TOKEN_ID;
//			return RETCODE_ERROR;
//		}
		_pass_one_immediate_data = Math.floor (expression_result);

		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
		if (token_id != TOKEN_RIGHTBRACKET)
		{
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "')' expected");
			operand = INVALID_TOKEN_ID;
			return operand;	// RETCODE_ERROR;
		}

		operand = TOKEN_ADDR;
//		DebugNumber (DEBUG_TRACE, "pass_one.c : GetOperand(): returning TOKEN_ADDR value=", _pass_one_immediate_data);
		scanner.getToken();	// retval = GetNextToken (scanner);
		return operand;

	}		// end of (nn) parsing code

//	console.log ("ggg");

	// token is nn at this point.
	// nn can be a simple expression,
	// a known label or (possibly)
	// a forward-referenced label.

	if (GetTokenType (scanner) == TOKEN_TYPE_IDENTIFIER)	//SCANNER_TOKEN_TYPE_IDENTIFIER)
	{
			// need to test for label.
			

								//CreateString (&tmp);
		tmp = scanner.token_buffer;	//token_buffer;		//SetString (&tmp, token_buffer);

//		console.log ("}}}}}}}}}}}}}}}}}}}}}}}}>>> Operand label:" + operand_label);

		//console.log ("identifier:" + tmp);

		retval = Label_LabelExists (tmp);
		
//		console.log ("retval:" + retval);

//		if (retval == RETCODE_FALSE)
		if (retval == false)
		{
				// undefined label, assume forward referenced.
				
//			console.log ("forward ref");
			operand_label = tmp;	// = scanner.token_buffer;			//CopyString (&tmp, &operand_label);
										//DestroyString (&tmp);
			operand = TOKEN_LABEL;
//			DebugString (DEBUG_TRACE, 	"pass_one.c : GetOperand(): returning forward address", token_buffer);
			scanner.getToken();	// retval = GetNextToken (scanner);
			return operand;
		}
//		DestroyString (&tmp);
	}

	// treat defined labels & numbers as expressions.

	//retval = _ParseExp2 (scanner, token_buffer, &expression_result);
	expression_result = _ParseExp2 (scanner);	//, token_buffer);	//, &expression_result);
//	if (retval == RETCODE_ERROR)
//	{
//		*operand = INVALID_TOKEN_ID;
//		return RETCODE_ERROR;
//	}
	_pass_one_immediate_data = Math.floor (expression_result);
	operand = TOKEN_NUMBER;

//	DebugNumber (DEBUG_TRACE, "pass_one.c : GetOperand(): returning TOKEN_NUMBER value=", _pass_one_immediate_data);

	return operand;
}

		// ----- simple one word instructions -----

function _pass_one_IsSimpleInstruction (token_id)
{
	// checks for single word, no operand instructions
	// returns RETCODE_TRUE if found, otherwise returns RETCODE_FALSE.

	// table data is stored token_id, op_code
	// for this test, the op codes are skipped over

//typedef struct
//{
//	int token_id;
//	int instruction_code;
//} SIMPLE_INSTRUCTION;

	var i;

	i = 0;
	//while (_simple_instruction_table [i].token_id != INVALID_TOKEN_ID)
	while (_simple_instruction_table [i] != INVALID_TOKEN_ID)
	{
//		if (_simple_instruction_table [i].token_id == token_id)
		if (_simple_instruction_table [i] == token_id)
		{
			return RETCODE_TRUE;
		}
		i += 2;	//i++;
	}
	return RETCODE_FALSE;
}

function _pass_one_OutputSimpleInstruction (scanner, token_id)
{
	// returns RETCODE_OK if successful, otherwise returns RETCODE_ERROR

	var i;
	var instruction_code;
	var retval;

	i = 0;
//	while (_simple_instruction_table [i].token_id != INVALID_TOKEN_ID)
	while (_simple_instruction_table [i] != INVALID_TOKEN_ID)
	{
//		if (_simple_instruction_table [i].token_id == token_id)
		if (_simple_instruction_table [i] == token_id)
		{
//			instruction_code = _simple_instruction_table [i].instruction_code;
			instruction_code = _simple_instruction_table [i+1];
			if (instruction_code < 256)
			{
				retval = OutputCodeByte (scanner, instruction_code);
			}
			else
			{
				retval = (instruction_code >> 8) & 255;
				retval = OutputCodeByte (scanner, retval);
				retval = instruction_code & 255;
				retval = OutputCodeByte (scanner, retval);

//				retval = OutputCodeWord (scanner, instruction_code);
			}
			return retval;
		}
		i += 2;	//i++;
	}
	return RETCODE_ERROR;
}


function _pass_one_ParseRET (scanner)	//, token_buffer)
{
	// this is an awkward one need to look ahead
	// to the next token to determine if its a
	// plain ret or a ret cc. if its a plain ret
	// then the scanner has to parse the token
	// read in and not accidentally skip it
	// (thats the tricky bit)

	var retval;
	var token_id;

	var cc_code;

	var instruction_code;

	scanner.getToken();	// retval = GetNextToken (scanner);
	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);

	cc_code = _pass_one_Get_CC_Code (token_id);
	if (cc_code == INVALID_CC_CODE)
	{
		// assume its a plain vanilla ret
		// statement.
		OutputCodeByte (scanner, 0xC9);
		return RETCODE_OK;
	}

	instruction_code = 0xC0 + (cc_code << 3);
	OutputCodeByte (scanner, instruction_code);

	scanner.getToken();	// retval = GetNextToken (scanner);
	return RETCODE_OK;
}

//function _pass_one_ParseBranch (scanner, token_buffer, branch_id)
function _pass_one_ParseBranch (scanner, branch_id)
{
		// handles instruction parsing and code generation
		// for JP and CALL instructions.

	var retval;
	var token_id;

	var cc_code;
	var instruction_code;

	var branch_address;

	var tmp;

//	Msg ("** PARSING BRANCH **");

	scanner.getToken();	// retval = GetNextToken (scanner);
	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);

	if (token_id == TOKEN_LEFTBRACKET)
	{
			// deal with special 'JP' cases: jp (hl), jp (ix), jp (iy)

		if (branch_id != TOKEN_JP)
		{
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "unexpected '('");
			return RETCODE_ERROR;
		}

		scanner.getToken();	// retval = GetNextToken (scanner);
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
		switch (token_id)
		{
			case TOKEN_HL:	break;
			case TOKEN_IX:	OutputCodeByte (scanner, 0xDD);	break;
			case TOKEN_IY:	OutputCodeByte (scanner, 0xFD);	break;
			default:
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "unexpected token");
			return RETCODE_ERROR;
		}
		OutputCodeByte (scanner, 0xE9);
		scanner.getToken();	// retval = GetNextToken (scanner);
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
		if (token_id != TOKEN_RIGHTBRACKET)
		{
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "')' expected");
			return RETCODE_ERROR;
		}
		return RETCODE_OK;
	}

	switch (token_id)
	{
		case TOKEN_NOTZERO:	cc_code = 0;	break;
		case TOKEN_ZERO	:	cc_code = 1;	break;
		case TOKEN_NOCARRY:	cc_code = 2;	break;

		case TOKEN_C	:	// fall through
		case TOKEN_CARRY	:	cc_code = 3;	break;
		case TOKEN_PO	:	cc_code = 4;	break;
		case TOKEN_PE	:	cc_code = 5;	break;
		case TOKEN_P	:	cc_code = 6;	break;
		case TOKEN_M	:	cc_code = 7;	break;
		default:	cc_code = -1;
				break;
	}

	if (cc_code != -1)
	{
			// conditional branch instruction.
			// call cc,pq or jp cc,pq

		scanner.getToken();	// retval = GetNextToken (scanner);
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
		if (token_id != TOKEN_COMMA)
		{
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "',' expected");
			return RETCODE_ERROR;
		}

		if (branch_id == TOKEN_JP)
		{
			instruction_code = 0xC2 | (cc_code << 3);
		}
		else
		{
			instruction_code = 0xC4 | (cc_code << 3);	// call instruction
		}
		scanner.getToken();	// retval = GetNextToken (scanner);		// label or constant.
	}
	else
	{
		// simple branch instruction.
		if (branch_id == TOKEN_JP)
		{
			instruction_code = 0xC3;
		}
		else
		{
			instruction_code = 0xCD;	// code for call pq
		}
	}
	OutputCodeByte (scanner, instruction_code);

	// token_buffer holds the label or constant value at this
	// point. Need to get and output this value

	retval = GetTokenType (scanner);
	switch (retval)
	{
		case TOKEN_TYPE_NUMBER:		//SCANNER_TOKEN_TYPE_NUMBER:
			branch_address = scanner.token_value;
			break;
		case TOKEN_TYPE_IDENTIFIER:		//SCANNER_TOKEN_TYPE_IDENTIFIER:
			//CreateString (&tmp);
			//SetString (&tmp, token_buffer);
			tmp = scanner.token_buffer;
			retval = Label_LabelExists (tmp);
//			if (retval == RETCODE_FALSE)
			if (retval == false)
			{
				// Add to undefined label list.
				retval = LabelConstant_AddConstant (tmp, _pass_one_ProgramCounter, CONSTANT_TYPE_ADDRESS, scanner.line_number);
				branch_address = 0;
			}
			else
			{
				branch_address = Label_GetLabelValue (tmp);
			}
//			DestroyString (&tmp);
			break;
		default:
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "unexpected token type");
			return RETCODE_ERROR;
		
	}
	OutputCodeWord (scanner, branch_address);

	scanner.getToken();	// retval = GetNextToken (scanner);
	return RETCODE_OK;
}

//function _pass_one_ParseRelativeBranch (scanner, token_buffer, instruction_token_id)
function _pass_one_ParseRelativeBranch (scanner, instruction_token_id)
{
		// handles JR cc,e	JR e 	and DJNZ e

	var retval;
	var token_id;
	var instruction_code;
	var branch_offset;
	var tmp;
	var label_type;

	scanner.getToken();	// retval = GetNextToken (scanner);
	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);

	instruction_code = 0;
	switch (token_id)
	{
		case TOKEN_NOTZERO:	instruction_code = 0x20;
					break;
		case TOKEN_ZERO:	instruction_code = 0x28;
					break;
		case TOKEN_NOCARRY:	instruction_code = 0x30;
					break;
		case TOKEN_C:	
		case TOKEN_CARRY:
					instruction_code = 0x38;
					break;
		default:
				break;
	}
	
//	console.log ("instruction_code:" + instruction_code);

	if (instruction_code != 0)
	{
			// conditional relative jump.
		if (instruction_token_id != TOKEN_JR)
		{
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "unexpected token");
		}

		scanner.getToken();	// retval = GetNextToken (scanner);
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
		if (token_id != TOKEN_COMMA)
		{
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "',' expected");
			return RETCODE_ERROR;
		}
		scanner.getToken();	// retval = GetNextToken (scanner);		// label or constant.
	}
	else
	{
		// simple relative jump

		switch (instruction_token_id)
		{
			case TOKEN_JR:	instruction_code = 0x18;
						break;
			case TOKEN_DJNZ:	instruction_code = 0x10;
						break;
			default:
				// should never get here.
				_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "unexpected token");
				return RETCODE_ERROR;
		}
	}
	OutputCodeByte (scanner, instruction_code);

	// token_buffer holds the label or constant value at this
	// point. Need to get and output this value

	retval = GetTokenType (scanner);
	switch (retval)
	{
		case TOKEN_TYPE_NUMBER:		//SCANNER_TOKEN_TYPE_NUMBER:
			branch_offset = scanner.token_value;
			break;

		case TOKEN_TYPE_IDENTIFIER:	//SCANNER_TOKEN_TYPE_IDENTIFIER:
			//CreateString (&tmp);
			//SetString (&tmp, token_buffer);
			tmp = scanner.token_buffer;
			retval = Label_LabelExists (tmp);
//			if (retval == RETCODE_FALSE)
			if (retval == false)
			{
				// TO DO : Add to undefined label list.
//				DebugString (DEBUG_TRACE, "Adding forward branch:", token_buffer);
				retval = LabelConstant_AddConstant (tmp, _pass_one_ProgramCounter, CONSTANT_TYPE_BRANCH, scanner.line_number);
				branch_offset = 0;
			}
			else
			{
				// if the identifier is an address label,
				// calculate the branch offset. 

				branch_offset = Label_GetLabelValue (tmp);
				
//				console.log ("label :" + tmp + " offset: " + branch_offset);

				label_type = Label_GetLabelType (tmp);
				if (label_type == LABEL_TYPE_ADDRESS)
				{
					branch_offset = branch_offset - (_pass_one_ProgramCounter + 1);
				}
			}
//			DestroyString (&tmp);
			break;
		default:
			_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "unexpected token type");
			return RETCODE_ERROR;
	}
	OutputCodeByte (scanner, branch_offset);

	if ((branch_offset < -128) || (branch_offset > 127))
	{
		_pass_one_report_error (ERROR_LEVEL_ERROR, scanner, "relative branch out of range : " + branch_offset);
		return RETCODE_ERROR;
	}

	scanner.getToken();	// retval = GetNextToken (scanner);
	return RETCODE_OK;
}

function _pass_one_DEFB (scanner)	//, token_buffer)
{
	var retval;
	var token_id;
	var result;

//	Debug (DEBUG_TRACE, "pass_one.c: _DEFB()");
//	DebugNumber (DEBUG_TRACE, "pass_one.c : DEFB(): pc= ", _pass_one_ProgramCounter);

	//retval = _pass_one_ParseExpression (scanner, token_buffer, &result);
	result = _pass_one_ParseExpression (scanner);	//, token_buffer);

//	console.log ("pass_one.js 3672 : to do , check for possible expression error");

//	if (retval == RETCODE_ERROR)
//	{
//		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "invalid expression.");
//		return RETCODE_ERROR;
//	}

	retval = Math.floor (result);
	if ((retval < -128) || (retval > 255))
	{
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "number out of range");
		return RETCODE_ERROR;
	}
	retval &= 255;
	OutputCodeByte (scanner, retval);

	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	if (token_id != TOKEN_COMMA)
	{
		return RETCODE_OK;	// not a comma, assume end of defb statement.
	}

	while (token_id == TOKEN_COMMA)
	{
			// no need to scan for next token as ParseExpression
			// does it all for you :-)
//		retval = _pass_one_ParseExpression (scanner, token_buffer, &result);
		result = _pass_one_ParseExpression (scanner);	//, token_buffer);
		//if (retval == RETCODE_ERROR)
		//{
//			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "invalid expression.");
//			return RETCODE_ERROR;
//		}
		retval = Math.floor (result);
		if ((retval < -128) || (retval > 255))
		{
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "number out of range");
			return RETCODE_ERROR;
		}
		retval &= 255;
		OutputCodeByte (scanner, retval);

		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	}
	return RETCODE_OK;	// finished parsing defb
}

function _pass_one_DEFW (scanner)	//, token_buffer)
{
	var retval;
	var token_id;
	var result;
	var tmp;

	scanner.getToken();	// retval = GetNextToken (scanner);
	if (GetTokenType (scanner) == TOKEN_TYPE_IDENTIFIER)	//SCANNER_TOKEN_TYPE_IDENTIFIER)
	{
		//CreateString (&tmp);
		tmp = scanner.token_buffer;		//SetString (&tmp, token_buffer);
		retval = Label_LabelExists (tmp);
//		if (retval == RETCODE_FALSE)
		if (retval == false)
		{
			// assume forward referenced label
			retval = LabelConstant_AddConstant (tmp, _pass_one_ProgramCounter, CONSTANT_TYPE_ADDRESS, scanner.line_number);
//			DebugString (DEBUG_TRACE, "defw:adding label constant:", GetStringPtr (&tmp));
			OutputCodeWord (scanner, 0);
//			DestroyString (&tmp);
			scanner.getToken();	// retval = GetNextToken (scanner);
			return RETCODE_OK;
		}
//		DestroyString (&tmp);
	}

		// not a forward reference, parse as normal expression

	//retval = _ParseExp2 (scanner, token_buffer, &result);
	result = _ParseExp2 (scanner);	//, token_buffer);	//, &result);

	if (retval == RETCODE_ERROR)
	{
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "invalid expression.");
		return RETCODE_ERROR;
	}

	retval = Math.floor (result);
	if ((retval < -32768) || (retval > 65535))
	{
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "number out of range");
		return RETCODE_ERROR;
	}
	retval &= 65535;
	OutputCodeWord (scanner, retval);

	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	if (token_id != TOKEN_COMMA)
	{
		return RETCODE_OK;	// not a comma, assume end of defw statement.
	}

	while (token_id == TOKEN_COMMA)
	{
			// no need to scan for next token as ParseExpression
			// does it all for you :-)

															//		retval = _pass_one_ParseExpression (scanner, token_buffer, &result);

		scanner.getToken();	// retval = GetNextToken (scanner);
		if (GetTokenType (scanner) == TOKEN_TYPE_IDENTIFIER)	//SCANNER_TOKEN_TYPE_IDENTIFIER)
		{
//			CreateString (&tmp);
//			SetString (&tmp, token_buffer);
			tmp = scanner.token_buffer;
			retval = Label_LabelExists (tmp);
//			if (retval == RETCODE_FALSE)
			if (retval == false)
			{
				// assume forward referenced label
				retval = LabelConstant_AddConstant (tmp, _pass_one_ProgramCounter, CONSTANT_TYPE_ADDRESS, scanner.line_number);
//				DebugString (DEBUG_TRACE, "defw:adding label constant:", GetStringPtr (&tmp));
				OutputCodeWord (scanner, 0);
//				DestroyString (&tmp);
				scanner.getToken();	// retval = GetNextToken (scanner);
				return RETCODE_OK;
			}
//			DestroyString (&tmp);
		}

		//retval = _ParseExp2 (scanner, token_buffer, &result);
		result = _ParseExp2 (scanner);	//, token_buffer);	//, &result);

		if (retval == RETCODE_ERROR)
		{
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "invalid expression.");
			return RETCODE_ERROR;
		}
		retval = Math.floor (result);
		if ((retval < -32768) || (retval > 65535))
		{
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "number out of range");
			return RETCODE_ERROR;
		}
		retval &= 65535;
		OutputCodeWord (scanner, retval);

		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	}

	return RETCODE_OK;	// finished parsing defb
}

function _pass_one_DEFL (scanner)	//, token_buffer)
{
		// define ..LONG ??? 
	_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "DEFL not currently supported");
	return RETCODE_ERROR;
}

function _pass_one_DEFM (scanner)	//, token_buffer)
{
	var retval;
	var result;

	//retval = _pass_one_ParseExpression (scanner, token_buffer, &result);
	result = _pass_one_ParseExpression (scanner);	//, token_buffer);
//	if (retval == RETCODE_ERROR)
	//{
//		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "invalid expression.");
//		return RETCODE_ERROR;
//	}

	retval = Math.floor (result);
	if ((retval < 1) || (retval > 65536))
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "number out of range");
		return RETCODE_ERROR;
	}

	while (retval > 0)
	{
		_CodeBuffer [_pass_one_ProgramCounter] = 0;
		_pass_one_ProgramCounter++;

		if (_pass_one_ProgramCounter > 65535)
		{
			_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "Top of RAM reached");
			return RETCODE_ERROR;
		}
		retval--;
	}
	return RETCODE_OK;
}

function _pass_one_dbin_GetBinNumber (string)	//, result)
{
	// javascript version returns result 
	var number;
//	var ptr;
	
	var k;
	var ch;

	number = 0;
	for (k = 0; k < string.length; k++)
	{
		number = number << 1;
		ch = string.charAt(k);
		if (ch == "1")
		{
			number |= 1;
		}
	}
	
	return number;	

//	ptr = string;
//	number = 0;
//	while (*ptr != '\0')
//	{
//		number = number << 1;
//		if (*ptr == '1')
//		{
//			number |= 1;
//		}
//		ptr++;
//	}

//	DebugString (1, "dbin string :", string);
//	DebugNumber (1, "result = ", number);
//	*result = number;
//	return RETCODE_OK;
}

function _pass_one_DBIN (scanner, token_buffer)
{
		// **** UNDER CONSTRUCTION ****

	var retval;
	var token_id;
	var result;

	scanner.getToken();	// retval = GetNextToken (scanner);
	if (GetTokenType (scanner) != TOKEN_TYPE_NUMBER)		//SCANNER_TOKEN_TYPE_NUMBER)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "number expected");
		return RETCODE_ERROR;
	}

	//retval = _pass_one_dbin_GetBinNumber (token_buffer, &result);
	result = _pass_one_dbin_GetBinNumber (token_buffer);	// &result);
	retval = Math.floor (result);
	if ((retval < 0) || (retval > 255))
	{
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "binary number out of range");
		return RETCODE_ERROR;
	}
	retval &= 255;
	OutputCodeByte (scanner, retval);

	scanner.getToken();	// retval = GetNextToken (scanner);
	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	if (token_id != TOKEN_COMMA)
	{
		return RETCODE_OK;	// not a comma, assume end of defb statement.
	}

	while (token_id == TOKEN_COMMA)
	{
			// no need to scan for next token as ParseExpression
			// does it all for you :-)
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (GetTokenType (scanner) != TOKEN_TYPE_NUMBER)	//SCANNER_TOKEN_TYPE_NUMBER)
		{
			_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "number expected");
			return RETCODE_ERROR;
		}

		//retval = _pass_one_dbin_GetBinNumber (token_buffer, &result);
		result = _pass_one_dbin_GetBinNumber (token_buffer);	//, &result);
		retval = Math.floor (result);
		if ((retval < 0) || (retval > 255))
		{
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "binary number out of range");
			return RETCODE_ERROR;
		}
		retval &= 255;
		OutputCodeByte (scanner, retval);

		scanner.getToken();	// retval = GetNextToken (scanner);
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	}
	return RETCODE_OK;	// finished parsing defb
}

function _StoreString (scanner, string)
{
	// stores a string of ascii characters to the output stream
	// does *not* output a terminating zero character.

	var ch;
	var k;
	
	for (k = 0; k < string.length; k++)
	{
		ch = string.charCodeAt(k);
		if (OutputCodeByte (scanner, ch) == RETCODE_ERROR)
		{
			return RETCODE_ERROR;
		}
	}
	return RETCODE_OK;

//	char* ptr;

//	ptr = string;
//	while (*ptr != '\0')
//	{
//		if (OutputCodeByte (scanner, *ptr) == RETCODE_ERROR)
//		{
//			return RETCODE_ERROR;
//		}
//		ptr++;
//	}

//	return RETCODE_OK;
}

function _pass_one_DEFS (scanner, token_buffer)
{
	// allows ascii text strings to be converted to bytes
	// and stored.

	var retval;
	var token_id;

	scanner.getToken();	// retval = GetNextToken (scanner);
	if (GetTokenType (scanner) != TOKEN_TYPE_STRING)	//SCANNER_TOKEN_TYPE_STRING)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "string expected");
		return RETCODE_ERROR;
	}
	retval = _StoreString (scanner, scanner.token_buffer);

	scanner.getToken();	// retval = GetNextToken (scanner);
	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	if (token_id != TOKEN_COMMA)
	{
		return RETCODE_OK;	// not a comma, assume end of defs statement.
	}

	while (token_id == TOKEN_COMMA)
	{
		scanner.getToken();	// retval = GetNextToken (scanner);
		if (GetTokenType (scanner) != TOKEN_TYPE_STRING)	//SCANNER_TOKEN_TYPE_STRING)
		{
			_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "string expected");
			return RETCODE_ERROR;
		}
		retval = _StoreString (scanner, token_buffer);

		scanner.getToken();	// retval = GetNextToken (scanner);
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	}

	return RETCODE_OK;	// finished parsing defs
}

function _pass_one_ORG (scanner, token_buffer)
{
	var retval;
	var result;
	
	console.log ("token : ORG");

//	Debug (DEBUG_TRACE, "pass_one.c : _pass_one_ORG()");

	if (_pass_one_ProgramCounter != ORG_UNDEFINED)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "ORG already defined");
		return RETCODE_ERROR;
	}

	//retval = _pass_one_ParseExpression (scanner, token_buffer, &result);
	result = _pass_one_ParseExpression (scanner);	//, token_buffer);

//	console.log ("ORG expression result:" + result);

//	if (retval == RETCODE_ERROR)
//	{
//		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "invalid ORG.");
//		return RETCODE_ERROR;
//	}

	if ((result < 0) || (result > 0xffff))
	{
		console.log ("ORG address out of range");
		return RETCODE_ERROR;
	}

	_pass_one_ProgramCounter = Math.floor(result);
	_ProgramOrg = _pass_one_ProgramCounter;

	console.log ("org:" + _pass_one_ProgramCounter);
//	DebugNumber (DEBUG_TRACE, "pass_one.c : _ORG(): pc= ", _pass_one_ProgramCounter);


	return RETCODE_OK;
}

function _pass_one_EQU (scanner)	//, token_buffer)
{
	// TO DO : CHECK THIS RETURN!!
	// sets the LAST label 
	var retval;
	var result;
	
//	console.log ("_pass_one_EQU");

//	Debug (DEBUG_TRACE, "pass_one.c : _pass_one_EQU()");

//	retval = _pass_one_ParseExpression (scanner, token_buffer, result);
	result = _pass_one_ParseExpression (scanner);	//, token_buffer);
	
//	console.log ("result:" + result);
//	return retval;
	return result;
}

function _pass_one_INCBIN (scanner, token_buffer)
{
	// javascript version : Currently unavailable.
	
	console.log ("INCBIN not currently supported");
	return RETCODE_ERROR;

		// syntax : INCBIN "filename" , load_address
		// load address is optional + should be a valid
		// expression.
/*
	int retval;
	int scanner_status;
	FILE* fp;
	int file_size;
	int token_id;
	int load_address;
	float result;

	scanner_status = GetNextToken (scanner);
	if (scanner_status == RETCODE_ERROR)
	{
		_pass_one_report_error(ERROR_LEVEL_ERROR, scanner, "filename expected");
		return RETCODE_ERROR;
	}

	if (GetTokenType (scanner) != SCANNER_TOKEN_TYPE_STRING)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "filename expected");
		return RETCODE_ERROR;
	}

	retval = FileSize (token_buffer, &file_size);
	if (retval == RETCODE_ERROR)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "file not found");
		return RETCODE_ERROR;
	}

	load_address = _pass_one_ProgramCounter;		// default load address

		// open file before scanning next token, otherwise
		// lose filename.. *NOTE* remember to close file if an 
		// error occurs.
	fp = FileOpen (token_buffer, "rb");
	if (fp == NULL)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unable to open file");
		return RETCODE_ERROR;
	}

	scanner_status = GetNextToken (scanner);
	token_id = Tokens_GetTokenId (token_buffer);
	if (token_id == TOKEN_COMMA)
	{
		// expecting expression
		//retval = _pass_one_ParseExpression (scanner, token_buffer, &result);
		result = _pass_one_ParseExpression (scanner, token_buffer);
//		if (retval == RETCODE_ERROR)
//		{
//			_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "invalid load address");
//			CloseFile (fp);
//			return RETCODE_ERROR;
-//		}
		load_address = Math.floor (result);
	}

	if ((load_address < 16384) || (load_address > 65535))
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "invalid load address");
		CloseFile (fp);
		return RETCODE_ERROR;
	}

	if ((load_address + file_size) > 65536)
	{
		// note the check for > 65536, 
		// NOT 65535 - look what happens if 
		// load address is 65535 and file length = 1 :-)

		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "top of Z80 RAM reached");
		CloseFile (fp);
		return RETCODE_ERROR;
	}

//	fp = FileOpen (token_buffer, "rb");
//	if (fp == NULL)
//	{
//		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unable to open file");
//		CloseFile (fp);
//		return RETCODE_ERROR;
//	}

	fread (&_CodeBuffer[load_address], file_size, 1, fp);
	CloseFile (fp);

	if (load_address == _pass_one_ProgramCounter)
	{
		// only update the program counter if the
		// load address is the default. otherwise
		// just ignore it.
		_pass_one_ProgramCounter += file_size;
	}

	// no need to scan- already done :-)
//	scanner_status = GetNextToken (scanner);
	return RETCODE_OK;
*/
}

function _pass_one_ParseLabel (scanner)	//, token_buffer)
{
	var label;
	var retval;
	var token_id;
	var result;
	var token_buffer;

	// do "quick" check to see if the label is already defined

	//CreateString (&label);
	//SetString (&label, token_buffer);
//	label = token_buffer;
	label = scanner.token_buffer;

	retval = Label_LabelExists (label);
//	if (retval == RETCODE_TRUE)
	if (retval == true)
	{
//		SetString (&label, "Label ");
//		ConcatRawString (&label, token_buffer);
//		ConcatRawString (&label, " already defined");
		label = "Label " + token_buffer + " already defined";
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, label);	//GetStringPtr (&label));
//		DestroyString (&label);
		return RETCODE_ERROR;
	}

		// add label to label list

	retval = Label_AddLabel (label);
	if (retval == RETCODE_ERROR)
	{
		_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "internal error : unable to store label");
//		DestroyString (&label);
		return RETCODE_ERROR;
	}

		// default value for label = current program counter.

	Label_SetLabelValue (label, _pass_one_ProgramCounter);

		// default label type = address.
	Label_SetLabelType (label, LABEL_TYPE_ADDRESS);

	// assume its a label, need to scan for ':' to be sure.
	// if any other token, then its an error.

	scanner.getToken();	// retval = GetNextToken (scanner);
	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	if (token_id != TOKEN_COLON)
	{
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "':' expected");
//		DestroyString (&label);
		return RETCODE_ERROR;
	}

	// scan next token, if its 'equ', need to
	// modify the label value and type to 'constant'
	// if possible.

	scanner.getToken();	// retval = GetNextToken (scanner);
	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);

	if (token_id == TOKEN_EQU)
	{
		//retval = _pass_one_EQU (scanner, token_buffer, &result);
		result = _pass_one_EQU (scanner);	//, token_buffer);
//		if (retval == RETCODE_ERROR)
//		{
//			Debug (DEBUG_TRACE, "pass_one.c : ParseLabel(): ** invalid expression");
//			DestroyString (&label);
//			return RETCODE_ERROR;
//		}

		Label_SetLabelValue (label, Math.floor (result));
		Label_SetLabelType (label, LABEL_TYPE_CONSTANT);
	}

//	DestroyString (&label);

	return RETCODE_OK;
}

function _pass_one_ParseBitSetRes (scanner, instruction_token_id)
{
		// handles instructions of the format:
		//		 instruction bit_number,r

		// bit = 0x40 + (bit << 3) + r
		// res = 0x80 + (bit << 3) + r
		// set = 0xC0 + (bit << 3) + r

	var token_id;
	var retval;
	var result;
	var opcode_2;
	var register_code;
	var bit_code;
	var instruction_code;

//	console.log ("ParseBitSetRes");

	// after 'bit' need to scan in a number.. allow for simple expressions

	//retval = _pass_one_ParseExpression (scanner, token_buffer, &result);
	result = _pass_one_ParseExpression (scanner);	//, token_buffer);	//, &result);
	if ((result < 0) || (result > 7))
	{
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "number out of range");
		return RETCODE_ERROR;
	}
	bit_code = Math.floor (result);

	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
	if (token_id != TOKEN_COMMA)
	{
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "',' expected");
		return RETCODE_ERROR;
	}

//	console.log ("after ,");
	//retval = _pass_one_GetOperand (scanner, token_buffer, &opcode_2);
	opcode_2 = _pass_one_GetOperand (scanner);	//, token_buffer);	//, &opcode_2);
//	if (retval == RETCODE_ERROR)
//	{
//		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "invalid operand");
//		return RETCODE_ERROR;
//	}

	switch (opcode_2)
	{
		case TOKEN_A:		register_code = 7;
						break;
		case TOKEN_B:		register_code = 0;	//console.log ("token_b");
						break;
		case TOKEN_C:		register_code = 1;
						break;
		case TOKEN_D:		register_code = 2;
						break;
		case TOKEN_E:		register_code = 3;
						break;
		case TOKEN_H:		register_code = 4;
						break;
		case TOKEN_L:		register_code = 5;
						break;
		case TOKEN_ADDR_HL:	register_code = 6;
					break;
				break;
		default:
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "invalid 2nd operand");
			return RETCODE_ERROR;
	}

	OutputCodeByte (scanner, 0xCB);

	switch (instruction_token_id)
	{
		case TOKEN_BIT:
			instruction_code = 0x40 + (bit_code << 3) + register_code;
			break;
		case TOKEN_SET:
			instruction_code = 0xC0 + (bit_code << 3) + register_code;
			break;
		case TOKEN_RES:
			instruction_code = 0x80 + (bit_code << 3) + register_code;
			break;
		default:
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "internal error : Bit/Res/Set expected");
			return RETCODE_ERROR;
	}
	OutputCodeByte (scanner, instruction_code);
	
	return RETCODE_OK;
}

function _pass_one_ParseIM (scanner)	//, token_buffer)
{
	var retval;
	var result;

	//retval = _pass_one_ParseExpression (scanner, token_buffer, &result);
	result = _pass_one_ParseExpression (scanner);	//, token_buffer);	//, &result);
	if ((result < 0) || (result > 2))
	{
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "number out of range");
		return RETCODE_ERROR;
	}

	OutputCodeByte (scanner, 0xED);
	retval = Math.floor (result);
	switch (retval)
	{
		case 0:
			OutputCodeByte (scanner, 0x46);
			break;
		case 1:
			OutputCodeByte (scanner, 0x56);
			break;
		case 2:
			OutputCodeByte (scanner, 0x5E);
			break;
		default:
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "invalid number");
			return RETCODE_ERROR;
	}

	return RETCODE_OK;
}

function _pass_one_ParseRST (scanner)	//, token_buffer)
{
	var retval;
	var result;

	//retval = _pass_one_ParseExpression (scanner, token_buffer, &result);
	result = _pass_one_ParseExpression (scanner);	//, token_buffer);	//, &result);

	retval = Math.floor (result);
	switch (retval)
	{
		case 0x00:
			OutputCodeByte (scanner, 0xC7);
			break;
		case 0x08:
			OutputCodeByte (scanner, 0xCF);
			break;
		case 0x10:
			OutputCodeByte (scanner, 0xD7);
			break;
		case 0x18:
			OutputCodeByte (scanner, 0xDF);
			break;
		case 0x20:
			OutputCodeByte (scanner, 0xE7);
			break;
		case 0x28:
			OutputCodeByte (scanner, 0xEF);
			break;
		case 0x30:
			OutputCodeByte (scanner, 0xF7);
			break;
		case 0x38:
			OutputCodeByte (scanner, 0xFF);
			break;
		default:
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "invalid RST number");
			return RETCODE_ERROR;
	}
	return RETCODE_OK;
}

function _pass_one_ParseIF (scanner)	//, token_buffer)
{
	var retval;
	var result;
	var token_id;

	//retval = _pass_one_ParseExpression (scanner, token_buffer, &result);
	result = _pass_one_ParseExpression (scanner);	//, token_buffer);		//, &result);
	
	// TO DO : REPORT EXPRESSION ERROR FOR IF DIRECTIVES
/*	if (retval == RETCODE_ERROR)
	{
		Debug (DEBUG_TRACE, "pass_one.c : _ParseIF(): invalid expression");
		_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "invalid expression.");
		return RETCODE_ERROR;
	}
*/
	retval = Math.floor (result);
	if (retval == 0)
	{
		// need to skip over every token until either an 'else' or
		// and 'end' is found.
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
		while ((token_id != TOKEN_END) && (token_id != TOKEN_ELSE))
		{
			if (token_id == TOKEN_SEMICOLON)
			{
				// comment found, so skip entire line.

				scanner.skipSingleLineComment();	//ScanToEndOfLine (scanner);
			}
			else
			{
				scanner.getToken();	// retval = GetNextToken (scanner);
				token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
			}

		//	if (IsScannerDone (scanner) == RETCODE_TRUE)
			if (scanner.done() == true)
			{
				_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, 
					"unexpected end of file while processing IF");
				return RETCODE_ERROR;
			}
		}
		scanner.getToken();	// retval = GetNextToken (scanner);
		return RETCODE_OK;
	}
	return RETCODE_OK;
}

function _pass_one_ParseStatement (scanner)	//, token_buffer)
{
	var scanner_status;
	var token_id;
	var retval;

	var tmp;

//	console.log ("pass_one.c: _pass_one_ParseStatement()");
	
//	DebugString (1, "token = ", token_buffer);
//	DebugNumber (1, "token type = ", GetTokenType (scanner));
	switch (GetTokenType (scanner))
	{
		case TOKEN_TYPE_EOL:		//SCANNER_TOKEN_TYPE_RETURN:
//		console.log ("EOL found");
			scanner.getToken();	// scanner_status = GetNextToken (scanner);
			return RETCODE_OK;
//		case SCANNER_TOKEN_TYPE_IDENTIFIER:
//			break;

		case TOKEN_TYPE_NUMBER:		//SCANNER_TOKEN_TYPE_NUMBER:
			//CreateString (&tmp);
			//SetString (&tmp, "'");
			//ConcatRawString (&tmp, token_buffer);
			//ConcatRawString (&tmp, "' unexpected token");
			tmp = "'" + scanner.token_buffer + "' unexpected token";
			_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, tmp);
			//DestroyString (&tmp);
			return RETCODE_ERROR;

		default:
			break;
	}

	token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);

	if (token_id == TOKEN_SEMICOLON)
	{
		// comment found, so skip entire line.

//		console.log ("skipping assembler style comment");
//		Debug (DEBUG_TRACE, "pass_one.c: ParseStatement(): skipping assembler style comment");
		scanner.skipSingleLineComment();	//ScanToEndOfLine (scanner);
		scanner.getToken();
		return RETCODE_OK;
	}
	
//	console.log ("***");
//	console.log (scanner);
//	console.log ("token id:" + token_id);
//	console.log ("INVALID_TOKEN_ID:" + INVALID_TOKEN_ID);
	

	//if (token_id == INVALID_TOKEN_ID)
	if ((scanner.token_id == TOKEN_UNKNOWN) && (scanner.token_type == TOKEN_TYPE_IDENTIFIER))
	{
//		console.log ("pass_one: possible label found");
//		Debug (DEBUG_TRACE, "pass_one.c : ParseStatement(): possible label found");

		retval = _pass_one_ParseLabel (scanner);	//, token_buffer);
		return retval;
	}

//	return RETCODE_ERROR;

	// optional label part of statement processed at this point.
	// need to check for assembler directives (defw, defb, org,...)

	switch (token_id)
	{
		case TOKEN_DEFB: return _pass_one_DEFB (scanner);	//, token_buffer);
		case TOKEN_DEFW: return _pass_one_DEFW (scanner);	//, token_buffer);
		case TOKEN_ORG:	 return _pass_one_ORG (scanner);	//, token_buffer);

		case TOKEN_DEFL: return _pass_one_DEFL (scanner);	//, token_buffer);
		case TOKEN_DEFS: return _pass_one_DEFS (scanner);	//, token_buffer);
		case TOKEN_DEFM: return _pass_one_DEFM (scanner);	//, token_buffer);
		case TOKEN_INCLUDE:
				_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "unexpected include directive");
				return RETCODE_ERROR;
		case TOKEN_INCBIN: return _pass_one_INCBIN (scanner);	//, token_buffer);

		case TOKEN_DBIN:	return _pass_one_DBIN (scanner);	//, token_buffer);
		default:
				break;
	}
		// do simple instruction checks.

	retval = _pass_one_IsSimpleInstruction (token_id);
	if (retval == RETCODE_TRUE)
	{
		retval = _pass_one_OutputSimpleInstruction (scanner, token_id);
		if (retval == RETCODE_ERROR)
		{
			scanner.getToken();	// scanner_status = GetNextToken (scanner);
			return retval;
		}

		// scan next token and return. 
		scanner.getToken();	// scanner_status = GetNextToken (scanner);
		return RETCODE_OK;
	}

	switch (token_id)
	{
		case TOKEN_INC:
//				console.log ("INC");
				
		case TOKEN_ADC:
		case TOKEN_ADD:
		case TOKEN_AND:
		case TOKEN_CP:
		case TOKEN_DEC:
		case TOKEN_EX:
//		case TOKEN_INC:
		case TOKEN_IN:
		case TOKEN_OR:
		case TOKEN_OUT:
		case TOKEN_POP:
		case TOKEN_PUSH:
		case TOKEN_RL:
		case TOKEN_RLC:
		case TOKEN_RR:
		case TOKEN_RRC:
		case TOKEN_SBC:
		case TOKEN_SLA:
		case TOKEN_SRA:
		case TOKEN_SRL:
		case TOKEN_SUB:
		case TOKEN_XOR:
		case TOKEN_LD:
			retval = GenerateInstruction (scanner, scanner.token_id);	//, token_id);
			return retval;

		case TOKEN_BIT:
		case TOKEN_SET:
		case TOKEN_RES:
			retval = _pass_one_ParseBitSetRes (scanner, token_id);
			return retval;

		case TOKEN_IM:
			retval = _pass_one_ParseIM (scanner);	//, token_buffer);
			return retval;

//		case TOKEN_LD:
//			retval = _pass_one_ParseLD (scanner, token_buffer);
//			return retval;

		case TOKEN_JP:
		case TOKEN_CALL:
			retval = _pass_one_ParseBranch (scanner, token_id);
			return retval;

		case TOKEN_JR:
		case TOKEN_DJNZ:
			retval = _pass_one_ParseRelativeBranch (scanner, token_id);
			return retval;

		case TOKEN_RET:
			retval = _pass_one_ParseRET (scanner);
			return retval;

		case TOKEN_RST:
			retval = _pass_one_ParseRST (scanner);
			return retval;

		case TOKEN_IF:
			retval = _pass_one_ParseIF (scanner);	//, token_buffer);
			return retval;

		case TOKEN_END:
				// scan next token and return. 
			scanner.getToken();	// scanner_status = GetNextToken (scanner);
			return RETCODE_OK;
		default:
			break;
	}

	_pass_one_report_error (ERROR_LEVEL_WARNING, scanner, "unexpected token");
	return RETCODE_ERROR;
}

function _pass_one_ParseFile (scanner)	//, token_buffer)
{
	// for now, INCLUDE is not supported and the code is just
	// commented out.
	
	// Parses a source file. If an include statement is found
	// then processing of the source file is suspended and
	// the included file is parsed.

	// returns RETCODE_OK if successful, otherwise returns RETCODE_ERROR

	// if an error is found, the scanner moves ahead to the end of the line
	// and starts re-scanning at the next token. In this (crude) way,
	// 

//	FILE* fp;

	var scanner_status;
	var token_id;

	var retval;
	
	var parse_check;

//	console.log ("_pass_one_ParseFile");
		// get first token in the file to process.

	scanner.getToken();	// scanner_status = GetNextToken (scanner);
	
	console.log ("first token:" + scanner.token_buffer);

	while (scanner.done() == false)
	{
		parse_check = scanner.idx;
	
		retval = _pass_one_ParseStatement (scanner)	//, token_buffer);
		if (retval != RETCODE_OK)
		{
			console.log ("pass one : stopped");
			_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "no idea");
			return RETCODE_ERROR;
//					scanner.skipSingleLineComment();	//ScanToEndOfLine (scanner);
		}
		
		if (parse_check == scanner.idx)
		{
			console.log ("parse failed to advance:")
			console.log (scanner);
			return RETCODE_ERROR;
		}
	}

	if (_pass_one_error_level == ERROR_LEVEL_FATAL)
	{
		console.log ("######################################");
		return RETCODE_ERROR;
	}
	return RETCODE_OK;
}

/*
//		return RETCODE_OK;


//	if (scanner_status == RETCODE_ERROR)
//	{
//		Debug (DEBUG_TRACE, "pass_one.c : Z80_PassOne(): ** ERROR ** unable to get first token");
//		return RETCODE_ERROR;
//	}

	return;


	//while (IsScannerDone (scanner) == RETCODE_FALSE)
	while (scanner.done() == false)
	{
		token_id = scanner.token_id;	//Tokens_GetTokenId (token_buffer);
		switch (token_id)
		{
			case TOKEN_INCLUDE:

				console.log ("INCLUDE DIRECTIVE NOT SUPPORTED");
		
				// first token after include should be
				// the filename in double quotes.
				scanner_status = GetNextToken (scanner);
				if (scanner_status == RETCODE_ERROR)
				{
					_pass_one_report_error(ERROR_LEVEL_ERROR, scanner, "filename expected");
					return RETCODE_ERROR;
				}

				if (GetTokenType (scanner) != SCANNER_TOKEN_TYPE_STRING)
				{
					_pass_one_report_error (ERROR_LEVEL_FATAL, scanner, "filename expected");
					return RETCODE_ERROR;
				}

				// token buffer = name of new file to scan.

				// need to push current scanner onto stack,
				// initialise a new file scanner, and then
				// continue scanning as normal.

				fp = FileOpen (&token_buffer[0], "rb");
				if (fp == NULL)
				{
					_pass_one_report_error(ERROR_LEVEL_FATAL, scanner,"unable to open file");
					return RETCODE_ERROR;
				}
				CloseFile (fp);

				StackPush (&_pass_one_FileStack, scanner, sizeof (SCANNER));

				scanner_status = InitFileScanner (scanner, 
					token_buffer, token_buffer, TOKEN_BUFFER_SIZE);

				//if (IsScannerDone (scanner) == RETCODE_FALSE)
				if (scanner.done() == false)
				{
					// get the first token to scan

					scanner_status = GetNextToken (scanner);
					if (scanner_status == RETCODE_ERROR)
					{
					Debug (DEBUG_TRACE, 
			"pass_one.c:Z80_PassOne(): ** ERROR ** an error occurred while scanning file ");
					return RETCODE_ERROR;
					}
				}
				break;

			default:
//				retval = _pass_one_ParseStatement (scanner, &token_buffer[0]);
				retval = _pass_one_ParseStatement (scanner, token_buffer);
				if (retval == RETCODE_ERROR)
				{
//					return RETCODE_ERROR;
					scanner.skipSingleLineComment();	//ScanToEndOfLine (scanner);
//		return RETCODE_OK;

				}
				break;
		}
		if (_pass_one_error_level == ERROR_LEVEL_FATAL)
		{
			return RETCODE_ERROR;
		}
	}

	return RETCODE_OK;
}
*/

function _pass_one_Init()
{
	// init does nothing for now, as there is no file stack
	// for include directive.

	_pass_one_ProgramCounter = ORG_UNDEFINED;
/*
	var retval;

	retval = StackCreate (&_pass_one_FileStack, sizeof (SCANNER) * 32);
	if (retval == RETCODE_ERROR)
	{
		Debug (DEBUG_TRACE, "pass_one.c :Init(): ** ERROR ** unable to create stack");
		Msg ("Internal Error : Unable to initialise file stack");
		return RETCODE_ERROR;
	}

	CreateString (&operand_label);	// init string buffer.
*/
	return RETCODE_OK;
}

function _pass_one_Cleanup()
{
		// for now, no cleanup to do here
/*
	var scanner;
	var retval;

		// need to close all open file scanners.

	while (StackNumberOfItems (&_pass_one_FileStack) > 0)
	{
		retval = StackPop (&_pass_one_FileStack, &scanner, sizeof (SCANNER));
		if (retval == RETCODE_ERROR)
		{
			Debug (DEBUG_TRACE, "pass_one.c : Cleanup(): ** ERROR ** Pop Error");
		}
		else
		{
			EndScanner (&scanner);
		}
	}

	StackDestroy (&_pass_one_FileStack);

	DestroyString (&operand_label);
*/
}

	// ---------------------------------------------
	//		Public Routines
	// ---------------------------------------------

function Z80_PassOne (source_text)		//filename)
{
	// javascript change from the original, the parameter passed in
	// is the source text, and not a file name.
	// modified the code below accordingly.

	// returns RETCODE_OK if successful,
	// otherwise returns RETCODE_ERROR

	var scanner;
//	var scanner_status;
	var retval;
	
//	var token_buffer = "                                      ";

	console.log ("Z80_PassOne");

	_pass_one_ProgramCounter = ORG_UNDEFINED;
	
	scanner = new StrScanner (source_text, _token_Z80_tokens);	//_token_Z80_tokens);	//token_list);
	
	retval = _pass_one_ParseFile (scanner)	//, token_buffer);	//&token_buffer[0]);
	if ((retval == RETCODE_ERROR) || (_pass_one_error_level == ERROR_LEVEL_FATAL))
	{
		console.log ("ERROR : file parse error");
//		Debug (DEBUG_TRACE, "pass_one.c : Z80_PassOne(): ** ERROR ** file parse error");
//		EndScanner (&scanner);
		_pass_one_Cleanup();
		return RETCODE_ERROR;
	}

/*
	var token_buffer = [];	//[TOKEN_BUFFER_SIZE];

	//Debug (DEBUG_TRACE, "pass_one.c : Z80_PassOne()");

	retval = _pass_one_Init();
	if (retval == RETCODE_ERROR)
	{
//		Msg ("Pass One Failed.");
		return RETCODE_ERROR;
	}

	scanner_status = InitFileScanner (&scanner, 
		filename, token_buffer, TOKEN_BUFFER_SIZE);

	if (scanner_status != RETCODE_OK)
	{
		Debug (DEBUG_TRACE, "pass_one.c : Z80_PassOne(): ** ERROR ** Failed to initialise scanner");
		Msg ("Unable to open file:");
		Msg (filename);
		_pass_one_Cleanup();
		return RETCODE_ERROR;
	}

		// need to push first item in order for loop to work.

	StackPush (&_pass_one_FileStack, &scanner, sizeof (SCANNER));
	while (StackNumberOfItems (&_pass_one_FileStack) > 0)
	{
		retval = StackPop (&_pass_one_FileStack, &scanner, sizeof (SCANNER));
		if (retval == RETCODE_ERROR)
		{
			Debug (DEBUG_TRACE, "pass_one.c : Z80_PassOne(): ** ERROR ** Pop Error");
			Msg ("Internal error : pass one file stack failure.");
			_pass_one_Cleanup();
			return RETCODE_ERROR;
		}

		retval = _pass_one_ParseFile (&scanner, &token_buffer[0]);
		if ((retval == RETCODE_ERROR) || (_pass_one_error_level == ERROR_LEVEL_FATAL))
		{
			Debug (DEBUG_TRACE, "pass_one.c : Z80_PassOne(): ** ERROR ** file parse error");
			EndScanner (&scanner);
			_pass_one_Cleanup();
			return RETCODE_ERROR;
		}

		EndScanner (&scanner);
	}

	_pass_one_Cleanup();
*/
	return RETCODE_OK;
}
