/* -------------------------------------------------------

	Title	:	A Simple Infix Calculator.

	Info	:	Javascript version 0.0	9th September 2023

	Author	:	Nick Fleming.

	Updated	:	9th September 2023

	 Notes:
	--------

	combined both expcalc.h and expcalc.c files here

	based on c 	Version 1.0	31st January 2002 (Updated	:	31st January 2002.)
	
		Simple infix notation calculator. Takes an
	input stream of numbers and operators and processes
	them according to the simple infix rules:

		if its a number push it onto the stack.
		if its an operator:
			push the required numbers from the
			stack, and push the result onto
			the stack.

		the last result on the stack is the value
		of the expression.



	 9th September 2023
	--------------------
	C to javascript notes:
	
	the original code passed the calculator structure by
	reference e.g.:

		PostfixCalc_Init(POSTFIX_CALC* calc)

	I've chosen to modify this to a more object based version
	because at the time, in my head, it seemed like the right choice.

	Im not sure now.

	I kept the original function names so conversion is easy

		PostfixCalc_Init(POSTFIX_CALC* calc)
	
	now becomes

		_calc.PostfixCalc_Init();


---------------------------------------------------------------- */

//#ifndef _INC_INFIX_CALC_H_

//#define _INC_INFIX_CALC_H_

//#ifdef __cplusplus
//	extern "C" {
//#endif

function POSTFIX_CALC()
{
	this.stack = [];
}

//typedef struct
//{
//	STACK_STRUCT stack;
//} POSTFIX_CALC;

	// Operator identifiers.
//enum
//{
	// unary operators (highest precedence)

var _op = 0;

var	OP_ABS = _op++;		// absolute value
var	OP_EXP = _op++;			// ??
var	OP_LN = _op++;			// natural logarithm
var	OP_SIN = _op++;			// sine (in radians)
var	OP_COS = _op++;			// cosine (in radians)
var	OP_TAN = _op++;			// tangent (in radians)
var	OP_ACOS = _op++;
var	OP_ASIN = _op++;
var	OP_ATAN = _op++;
var	OP_LOG = _op++;			// logarithm
var	OP_SQRT = _op++;		// square root
var	OP_NEG = _op++;			// 2's compliment (negate) of number
var	OP_INT = _op++;			// for future use - convert float to integer.

var	OP_LOGICAL_NOT = _op++;
var	OP_BITWISE_NOT = _op++;
var	OP_UNARY_MINUS = _op++;
var	OP_POWER = _op++;
var	OP_MULTIPLY = _op++;
var	OP_DIVIDE = _op++;
var	OP_REMAINDER = _op++;
var	OP_ADD = _op++;
var	OP_SUBTRACT = _op++;
var	OP_SHIFTLEFT = _op++;
var	OP_SHIFTRIGHT = _op++;
var	OP_LESSTHAN = _op++;
var	OP_GREATERTHAN = _op++;
var	OP_LESS_OR_EQUAL = _op++;
var	OP_GREATER_OR_EQUAL = _op++;
var	OP_EQUAL = _op++;
var	OP_NOT_EQUAL = _op++;
var	OP_BITWISE_AND = _op++;
var	OP_BITWISE_XOR = _op++;
var	OP_BITWISE_OR = _op++;
var	OP_LOGICAL_AND = _op++;
var	OP_LOGICAL_OR = _op++;
//};

var POSTFIX_TRUE = 1;
var POSTFIX_FALSE = 0;

//extern int PostfixCalc_Init (POSTFIX_CALC* calc);
//extern int PostfixCalc_Number (POSTFIX_CALC* calc, float number);
//extern int PostfixCalc_Operator (POSTFIX_CALC* calc, int operator_id);
//extern float PostfixCalc_Result (POSTFIX_CALC* calc);
//extern int PostfixCalc_Reset (POSTFIX_CALC* calc);
//extern void PostfixCalc_Cleanup (POSTFIX_CALC* calc);

//#ifdef __cplusplus
//	}
//#endif

//#endif	//#ifndef _INC_INFIX_CALC_H_







/* -------------------------------------------------------

	Title	:	A Simple Postix (RPN) Expression Calculator.

	Info	:	Version 1.0	31st January 2002

	Author	:	Nick Fleming.

	Updated	:	25th September 2002

	 Notes:
	--------
		This is source code for a simple Postfix notation
	(aka Reverse Polish Notation - RPN) calculator. It takes an
	input stream of numbers and operators and processes them 
	according to the simple postfix rules:

		if its a number push it onto the stack.
		if its an operator:
			push the required numbers from the
			stack, and push the result onto
			the stack.

		the last result on the stack is the value
		of the expression.

	 To Use:
	---------
	Call PostfixCalc_Init to initialise the internal calculator
	stack.

	Call PostfixCalc_Number to add a number to the calculator stack
	Call PostfixCalc_Operator to process numbers on the stack

	Call PostfixCalc_Result to retrieve the result of a calculation

	Call PostfixCalc_Cleanup when completey finished to free up 
	any resources held by the calculator.

	Call PostfixCalc_Reset between calculators to simply clear the
	calculator stack.

		example 1: 

		adding 2 numbers together :

			POSTFIX_CALC calc;
			float result;

			PostfixCalc_Init (&calc);
			PostfixCalc_Number (&calc, 3.14152);
			PostfixCalc_Number (&calc, 100.0);
			PostfixCalc_Operator (&calc, OP_ADD);
			result = PostfixCalc_Result (&calc);

			printf ("result = %f", result);

			PostfixCalc_Cleanup (&calc);

	25th September 2002
		- updated  header files to use clibs.h

---------------------------------------------------------------- */

//#include <stdio.h>
//#include <math.h>

//#include "clibs.h"

//#include "debug.h"
//#include "globals.h"
//#include "stack.h"

//#include "exprcalc.h"

POSTFIX_CALC.prototype.PostfixCalc_Init = function()// (POSTFIX_CALC* calc)
{
	// returns RECODE_OK if initialisation
	// successful, otherwise returns RETCODE_ERROR


	this.stack = [];

	//var retval;

//	Debug (DEBUG_TRACE, "exprcalc.c : _Init(): ");

//	retval = StackCreate (&calc->stack, sizeof (float) * 32);
//	if (retval == RETCODE_ERROR)
//	{
//		Debug (DEBUG_FATAL_ERROR, "exprcalc.c : _Init(): ** error ** failed to init stack");
//		return RETCODE_ERROR;
//	}

//	return RETCODE_OK;
}

POSTFIX_CALC.prototype.PostfixCalc_Number = function (number)
{
	// returns RETCODE_OK if the number was added
	// to the internal stack, otherwise returns RETCODE_ERROR

	var s;
	
	s = this.stack.length;
	this.stack[s] = number;

//	int retval;

//	retval = StackPush (&calc->stack, &number, sizeof (float));
//	if (retval == RETCODE_ERROR)
//	{
//		Debug (DEBUG_FATAL_ERROR, "exprcalc.c : _Number(): ** error** stack error");
//		return RETCODE_ERROR;
//	}

	return RETCODE_OK;
}

POSTFIX_CALC.prototype.PostfixCalc_Operator = function (operator_id)
{
	// uses the operator to process the numbers held on
	// the stack. Returns RETCODE_OK if successful
	// else returns RETCODE_ERROR

	var retval;

	var number_one;
	var number_two;

	var result;
	var tmp;
	var tmp2;

	var unary_op;
	
	var s;

	//if (StackNumberOfItems (&calc->stack) < 1)
	if (this.stack.length < 1)
	{
//		Debug (DEBUG_FATAL_ERROR, "exprcalc.c : _Operator(): ** ERROR ** calculator stack is empty");
		console.log ("calculator stack empty");
		return RETCODE_ERROR;
	}

	number_one = this.stack.pop();
	
//	retval = StackPop (&calc->stack, &number_one, sizeof (float));
//	if (retval == RETCODE_ERROR)
//	{
//		Debug (DEBUG_FATAL_ERROR, "exprcalc.c : _Operator(): ** ERROR ** calculator stack error");
//		return RETCODE_ERROR;
//	}

	// deal with unary operators first.

	tmp = number_one;	//tmp = (int) number_one;

	unary_op = RETCODE_FALSE;
	switch (operator_id)
	{
		case OP_ABS:	// absolute value
				retval = Math.abs (number_one);
				unary_op = RETCODE_TRUE;
				break;

		case OP_EXP:	// exponential value
				result = Math.exp (number_one);
				unary_op = RETCODE_TRUE;
				break;

//		case OP_LN:	// natural logarithm
//				result = ln (number_one);
//				unary_op = RETCODE_TRUE;
//				break;

		case OP_SIN:	result = Math.sin (number_one);
				unary_op = RETCODE_TRUE;
				break;

		case OP_COS:	result = Math.cos (number_one);
				unary_op = RETCODE_TRUE;
				break;

		case OP_TAN:	result = Math.tan (number_one);
				unary_op = RETCODE_TRUE;
				break;

		case OP_ACOS:	result = Math.acos (number_one);
				unary_op = RETCODE_TRUE;
				break;

		case OP_ASIN:	result = Math.asin (number_one);
				unary_op = RETCODE_TRUE;
				break;

		case OP_ATAN:	result = Math.atan (number_one);
				unary_op = RETCODE_TRUE;
				break;

		case OP_LOG:	result = Math.log (number_one);
				unary_op = RETCODE_TRUE;
				break;

		case OP_SQRT:	result = Math.sqrt (number_one);
				unary_op = RETCODE_TRUE;
				break;

		case OP_NEG:	result = -number_one;
				unary_op = RETCODE_TRUE;
				break;

		case OP_INT:	//tmp = (int) number_one;
				//result = (float) tmp;
				result = Math.floor (tmp);
				unary_op = RETCODE_TRUE;
				break;

		case OP_LOGICAL_NOT: //tmp = (int)number_one;
				//result = (float) !tmp;
				result = !number_one;
				unary_op = RETCODE_TRUE;
				break;

		case OP_BITWISE_NOT:
				//tmp = (int) number_one;
				//result = (float) ~tmp;
				result = ~number_one;		// is this the right operator for javascript ??
				unary_op = RETCODE_TRUE;
				break;

		case OP_UNARY_MINUS:
				result = -number_one;
				unary_op = RETCODE_TRUE;
				break;
		default:
			unary_op = RETCODE_FALSE;
			break;
	}

	if (unary_op == RETCODE_TRUE)
	{
		this.stack.push (result);
//		retval = StackPush (&calc->stack, &result, sizeof (float));
//		if (retval == RETCODE_ERROR)
//		{
//			Debug (DEBUG_FATAL_ERROR, "exprcalc.c : _Operator(): ** ERROR ** unable to push unary result onto postfix stack");
//			return RETCODE_ERROR;
//		}
		return RETCODE_OK;
	}

		// now deal with binary operators.

	//if (StackNumberOfItems (&calc->stack) < 1)
	if (this.stack.length < 1)
	{
//		Debug (DEBUG_FATAL_ERROR, "exprcalc.c : _Operator(): ** ERROR ** not enough numbers on stack for bin op");
		console.log ("** ERROR ** not enough numbers on stack for bin op");
		return RETCODE_ERROR;
	}

//	retval = StackPop (&calc->stack, &number_two, sizeof (number_two));
//	retval = this.stack.pop();
//	if (retval == RETCODE_ERROR)
//	{
//		Debug (DEBUG_FATAL_ERROR, "exprcalc.c : _Operator():** ERROR** unable to pop 2nd operand from postfix stack");
//		return RETCODE_ERROR;
//	}

	number_two = this.stack.pop();

	switch (operator_id)
	{
		case OP_POWER:		result = Math.pow (number_one, number_two);
					break;

		case OP_MULTIPLY:	result = number_one * number_two;
					break;

		case OP_DIVIDE:
					if (number_two == 0)
					{
						//Debug (DEBUG_FATAL_ERROR, "postfix.c : _Operator(): ** ERROR ** Divide by zero");
						console.log (" ** ERROR ** Divide by zero");
						return RETCODE_ERROR;
					}
					result = number_two / number_one;
					break;

		case OP_REMAINDER:	
					tmp = Math.floor (number_one);//tmp = (int)number_one;
					tmp2 = Math.floor (number_two);//tmp2 = (int)number_two;
					//result = tmp2 % tmp;
					result = tmp2 % tmp;
					break;

		case OP_ADD:
//				console.log ("OP1:" + number_one);
//				console.log ("OP2:" + number_two);
		
				result = number_one + number_two;
					break;

		case OP_SUBTRACT:	result = number_two - number_one;

//	DebugNumber (1, "exprcalc.c : womble = ", result);
					break;

		case OP_SHIFTLEFT:
					tmp = Math.floor (number_two);
					tmp2 = Math.floor (number_one);
					result = tmp << tmp2;
					break;

		case OP_SHIFTRIGHT:
					tmp = Math.floor(number_two);
					tmp2= Math.floor (number_one);
					result = tmp >> tmp2;
					break;

		case OP_LESSTHAN:
					if (number_two < number_one)
					{
						result = POSTFIX_TRUE;
					}
					else
					{
						result = POSTFIX_FALSE;
					}
					break;

		case OP_GREATERTHAN:
					if (number_two > number_one)
					{
						result = POSTFIX_TRUE;
					}
					else
					{
						result = POSTFIX_FALSE;
					}
					break;

		case OP_LESS_OR_EQUAL:
					if (number_two <= number_one)
					{
						result = POSTFIX_TRUE;
					}
					else
					{
						result = POSTFIX_FALSE;
					}
					break;

		case OP_GREATER_OR_EQUAL:
					if (number_two >= number_one)
					{
						result = POSTFIX_TRUE;
					}
					else
					{
						result = POSTFIX_FALSE;
					}
					break;

		case OP_EQUAL:
					if (number_one == number_two)
					{
						result = POSTFIX_TRUE;
					}
					else
					{
						result = POSTFIX_FALSE;
					}
					break;

		case OP_NOT_EQUAL:
					if (number_one != number_two)
					{
						result = POSTFIX_TRUE;
					}
					else
					{
						result = POSTFIX_FALSE;
					}
					break;

		case OP_BITWISE_AND:
					tmp = Math.floor (number_one);
					tmp2 = Math.floor (number_two);	//(int)number_two;
					result = tmp & tmp2;
					break;

//		case "ard":
		case OP_BITWISE_XOR:
					tmp = Math.floor (number_one);	//(int)number_one;
					tmp2 = Math.floor (number_two);	//(int)number_two;
					result = tmp ^ tmp2;
					break;

		case OP_BITWISE_OR:	tmp = Math.floor (number_one);
					tmp2 =  Math.floor (number_two);
					result = tmp | tmp2;
					break;

		case OP_LOGICAL_AND:	tmp = Math.floor (number_one);
					tmp2 = Math.floor (number_two);
					if ((tmp != 0) && (tmp2 != 0))
					{
						result = POSTFIX_TRUE;
					}
					else
					{
						result = POSTFIX_FALSE;
					}
					break;

		case OP_LOGICAL_OR:	tmp = Math.floor(number_one);
					tmp2 = Math.floor (number_two);
					if ((tmp | tmp2) != 0)
					{
						result = POSTFIX_TRUE;
					}
					else
					{
						result = POSTFIX_FALSE;
					}
					break;
		default:
			Debug (DEBUG_FATAL_ERROR, "exprcalc.c: _Operator(): ** ERROR ** unknown operator");
			return RETCODE_ERROR;
	}

	this.stack.push (result);
//	retval = StackPush (&calc->stack, &result, sizeof (result));
	//if (retval == RETCODE_ERROR)
//	{
//		Debug (DEBUG_FATAL_ERROR, "exprcalc.c: _Operator(): ** ERROR ** unable to push binop result onto calculator stack");
//		return RETCODE_ERROR;
//	}

	return RETCODE_TRUE;
}

POSTFIX_CALC.prototype.PostfixCalc_Result = function ()
{
	var result;
	var retval;

	result = this.stack.pop();
//	retval = StackPop (&calc->stack, &result, sizeof (float));
//	if (retval == RETCODE_ERROR)
//	{
//		Debug (DEBUG_FATAL_ERROR, "exprcalc.c : _Result(): ** ERROR ** unable to retrieve result");
//		return 0.0;
//	}

	return result;
}

POSTFIX_CALC.prototype.PostfixCalc_Reset = function()
{
	this.stack = [];

//	int retval;
//	float tmp;

//	while (StackNumberOfItems (&calc->stack) > 0)
//	{
//		retval = StackPop (&calc->stack, &tmp, sizeof (tmp));
//		if (retval == RETCODE_ERROR)
//		{
//			Debug (DEBUG_FATAL_ERROR, "exprcalc.c : _Reset():** ERROR ** unable to reset calculator stack");
//			return RETCODE_ERROR;
//		}
//	}

	return RETCODE_OK;
}

POSTFIX_CALC.prototype.PostfixCalc_Cleanup = function()
{
	this.stack = null;
//	StackDestroy (&calc->stack);
}



