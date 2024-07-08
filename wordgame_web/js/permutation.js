/*
	Title	:	Permutation Generator

	Info	:	Version 0.1	3rd July 2024

	Author	:	Nick Fleming

	Updated	:	3rd July 2024

	 Notes:
	----------
		A non recursive implementation of heaps algorithm. Each time it
	is called it generates another permutation.

https://en.wikipedia.org/wiki/Heap%27s_algorithm

	non recursive version as code base ;

	procedure generate(n : integer, A : array of any):
    // c is an encoding of the stack state. c[k] encodes the for-loop counter for when generate(k - 1, A) is called
    c : array of int

    for i := 0; i < n; i += 1 do
        c[i] := 0
    end for

    output(A)
    
    // i acts similarly to a stack pointer
    i := 1;
    while i < n do
        if  c[i] < i then
            if i is even then
                swap(A[0], A[i])
            else
                swap(A[c[i]], A[i])
            end if
            output(A)
            // Swap has occurred ending the for-loop. Simulate the increment of the for-loop counter
            c[i] += 1
            // Simulate recursive call reaching the base case by bringing the pointer to the base case analog in the array
            i := 1
        else
            // Calling generate(i+1, A) has ended as the for-loop terminated. Reset the state and simulate popping the stack by incrementing the pointer.
            c[i] := 0
            i += 1
        end if
    end while


	 3rd July 2024
	----------------
		Added return value to indicate when all permutations have been
	returned.

*/

var _perm_Array = null;			// current permutation
var _perm_C = null;
var _perm_I = null;
var _perm_NumItems = 0;

function _perm_Init(num_items)
{
	_perm_C = [];
	_perm_Array = [];

	for (i = 0; i < num_items; i++)
	{
		_perm_C[i] = 0;
		_perm_Array[i] = i;
	}

	_perm_I = 1;
}

function Permutation_GetPermutation(output_array)
{
	// output_array = array [] which will receive the permutation.
	
	// returns true if a permutation has been generated, false
	// otherwise.

	var q;
	var tmp;
	
	if (_perm_C == null)
	{
		// first call, so do inits, output default array.
		_perm_Init (_perm_NumItems);
		// output A
		for (q = 0; q < _perm_Array.length; q++)
		{
			output_array[q] = _perm_Array[q];
		}
		return true;
	}
	
	while (_perm_I < _perm_NumItems)	//    while i < n do
	{
		if (_perm_C [_perm_I] < _perm_I)				// if  c[i] < i then
		{
			if ((_perm_I & 1) == 0)						// if i is even then
			{
														//    swap(A[0], A[i])
				tmp = _perm_Array[_perm_I];
				_perm_Array[_perm_I] = _perm_Array[0];
				_perm_Array[0] = tmp;
			}
			else										//	else
            {
														// 		swap(A[c[i]], A[i])
				tmp = _perm_Array[_perm_I];
				_perm_Array[_perm_I] = _perm_Array[ _perm_C [_perm_I]];
				_perm_Array[ _perm_C [_perm_I]] = tmp;
			}											//  end if
				// output A
			for (q = 0; q < _perm_Array.length; q++)
			{
				output_array[q] = _perm_Array[q];
			}

											// Swap has occurred ending the for-loop. Simulate the increment of the for-loop counter
            _perm_C [ _perm_I] += 1;		// c[i] += 1
            // Simulate recursive call reaching the base case by bringing the pointer to the base case analog in the array
            _perm_I = 1;					//i := 1

            return true;		// yes, the exit for each call is here !!
		}	
		else									// else
		{
            // Calling generate(i+1, A) has ended as the for-loop terminated. Reset the state and simulate popping the stack by incrementing the pointer.
            _perm_C [_perm_I] = 0;			//c[i] := 0
            _perm_I += 1;					//i += 1
		}								//end if
    }									//end while
    
    // to do.. ? output something to indicate end of permutations ??
    return false;
}

function Permutation_Init (num_items)
{
	_perm_C = null;
	_perm_I = null;
	_perm_Array = null;
	_perm_NumItems = num_items;

}
