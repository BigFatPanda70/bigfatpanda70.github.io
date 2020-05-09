/*

	Title	:	Wordsearch Generator

	Info	:	Version 0.0	29th April 2020

	Author	:	Nick Fleming

	Updated	:	2nd May 2020

	 Notes:
	---------
		One of the very first large scale programs I ever wrote was
	a wordsearch generator in basic, on a RM380Z school computer.

	.. so it's about time I updated it for the web really.



	 Generation strategies:
	-------------------------
	
	1)	Random word placement.
			Pro : really simple to do, works well with small words
				  on a large grid.
			Con : not very good for packing words in.
	
	2) Place words in order of size, largest to smallest.
			Pro: More chance of fitting all the words into the grid than
				 purely random.
			
			Con: still rubbish for packing.

	3) Find words that have common letters and place them in the grid
	  together.
			Pro : Better packing, more like a scrabble algorithm
			Con : 
	
	Filling in the space :
		Place random letters in the empty spaces.
		Check to see if there is still a unique solution to the puzzle.
		If not, repeat from 1st step.
		This could be a long process, but it guarantees that there is
		only one solution to the puzzle.


	 Limits:
	---------
		Not all words in a list are always placeable. So as well as 
	generating the word grid, this program also has to generate the
	list of words actually used. 

*/

var WORDSEARCH_WIDTH = 15;
var WORDSEARCH_HEIGHT = 15;

function GridCellStruct()
{
	this.ch = "";
	this.info = 0;
}

//var wordlist = fruit_and_veg;
//var wordlist = creatures;

var WordGrid = [];
var WordGridWidth;
var WordGridHeight;
var WordList;
var WordCharOverlapCount;

var WordListArray;			// array of words used in the puzzle

var directions = 
[
	-1, 0,
	 0, 1,
	 0,-1,
	 1, 0,

	-1, 1,
	 1,-1,
	-1,-1,
	 1, 1
];

function ShuffleArray(array)
{
		// fisher yates shuffle.
	var i;
	var j;
	var n;
	var tmp;

	for (i = 0; i < array.length-2; i++)
	{
		j = i + Math.floor (Math.random() * (array.length-i));
		tmp = array[j];
		array[j] = array[i];
		array[i] = tmp;
	}
}


function OrderWordList(word_array)
{
		// simple bubble sort to order words by size,
		// largest to smallest. (not bothered about alphabetically).

	var i;
	var sorted;
	var tmp;

	sorted = false;
	while (sorted == false)
	{
		sorted = true;
		for (i = 0; i < (word_array.length-1); i++)
		{
			if (word_array[i].length < word_array[i+1].length)
			{
				tmp = word_array[i];
				word_array[i] = word_array[i+1];
				word_array[i+1] = tmp;
				sorted = false;
			}
		}
	}
}

function InitWordsearchGrid (width, height)
{
	var i;

	WordGrid = [];
	
	for (i = 0; i < (width * height); i++)
	{
		WordGrid[i] = new GridCellStruct();
		WordGrid[i].ch = "";
		WordGrid[i].info = 0;
	}

	WordGridWidth = width;
	WordGridHeight = height;
}

function GetCellCh (x,y)
{
	// returns the 
	var i;
	var ch;
	
	i = (y * WordGridWidth) + x;
//	console.log ("i:" + i + " x:" + x + " y:" + y);
	ch = WordGrid[i].ch;

	return ch;
}

function GetCellInfo (x,y)
{
	// returns the 
	var i;
	var info;
	
	i = (y * WordGridWidth) + x;
	info = WordGrid[i].info;

	return info;
}

function SetCellCh (x,y, ch)
{
	var i;
	
	i = (y * WordGridWidth) + x;
	
	WordGrid[i].ch = ch;
}

function SetCellInfo (x,y, info)
{
	var i;
	
	i = (y * WordGridWidth) + x;
	
	WordGrid[i].info = info;
}

function CheckWordInGrid (x,y,dx,dy,word)
{
		// checks to see if a word exists in the grid at that position.
		// returns false if word is not in grid.
		// true if it is.

	var x0;
	var y0;

	var x1;
	var y1;
	var i;
	var ch;
	var cell_ch;

	x1 = x + (dx * word.length) - 1;
	y1 = y + (dy * word.length) - 1;

		// check to see if trying to place word off screen.

	if ((x1 < 0) || (y1 < 0))
	{
		return false;
	}

	if ((x1 >= WordGridWidth) || (y1 >= WordGridHeight))
	{
		return false;
	}

	x0 = x;
	y0 = y;

	for (i = 0; i < word.length; i++)
	{
		ch = word.charAt(i);
		cell_ch = GetCellCh (x0,y0);
		if (ch != cell_ch)
		{
			return false;
		}
		x0 += dx;
		y0 += dy;
	}

	return true;
}

function WordIsInGrid (word)
{
	// long boring routine.. goes through entire grid looking for
	// the word. Checks all positions and all directions. so the
	// bigger the grid, the longer this will take.
	
	// returns true if it finds it, false otherwise.

	var x;
	var y;
	var r;
	var i;
	var dx;
	var dy;
	
	for (y = 0; y < WordGridHeight; y++)
	{
		for (x = 0; x < WordGridWidth; x++)
		{
			for (i = 0; i < 8; i++)
			{
				dx = directions [(i*2)+0];
				dy = directions [(i*2)+1];

				r = CheckWordInGrid (x, y, dx, dy, word);
				if (r == true)
				{
					return true;
				}
			}
		}
	}
	return false;
}

function CanPlaceWord (x,y,dx,dy,word)
{
	// returns true if a word can be placed, otherwise returns false.
	
	// dx,dy = direction of word. values can be -1,0 or 1

	var px;
	var py;

	var x1;
	var y1;

	var ch;
	var cell_ch;
	var i;

//	console.log ("can place word");
	
	WordCharOverlapCount = 0;
	
	x1 = x + (dx * word.length);
	y1 = y + (dy * word.length);
	
//	console.log ("x:" + x + " y:"+y + " dx:" + dx + " dy:" + dy + " x1:" + x1 + " y1:" + y1);

		// check to see if trying to place word off screen.

	if ((x1 < 0) || (y1 < 0))
	{
		return false;
	}
	
	if ((x1 > WordGridWidth) || (y1 > WordGridHeight))
	{
		return false;
	}
	
//	console.log ("checking.." + word.length);
	
	for (i = 0; i < word.length; i++)
	{
		px = x + (i * dx);
		py = y + (i * dy);
		

		cell_ch = GetCellCh (px,py);

//		console.log ("px:" + px + " py:" + py + " ch:" + cell_ch + ":");
		

//		console.log ("cell_ch:" + cell_ch + ":");
		if (cell_ch != "")
		{
			// need to check letter, if it differs from one already placed
			// then can't place word.

			ch = word.charAt (i);
			if (cell_ch != ch)
			{
				return false;
			}
			WordCharOverlapCount++;	// count the number of squares word overlaps.
		}
	}

//	console.log ("can place at x:" + x + " y:"+y + " dx:" + dx + " dy:" + dy + " x1:" + x1 + " y1:" + y1);
	return true;
}

function InsertWord (word, x,y, dx,dy)
{
	var i;
	var x0;
	var y0;
	var ch;
	
//	console.log ("insert word x:" + x + " y:" + y + " dx : " + dx + " dy:" + dy);

	x0 = x;
	y0 = y;
	for (i = 0; i < word.length; i++)
	{
		ch = word.charAt (i);
		SetCellCh (x0,y0,ch);
		x0 += dx;
		y0 += dy;
	}
}

function PlaceWord (word)
{
	// places a word at a 'random' position within the grid.
	// selects the position that has the most existing letters
	// already in the grid. Hopefully this will lead to some
	// good packing.

	// returns true if word can be placed, false otherwise
	
	// for now, makes a list of all the valid positions and then
	// picks one at random.

	var x;
	var y;
	var dx;
	var dy;
	var count;
	var d;
	var i;
	var j;
	var tmp;
	var r;
	
	var positions = [];
	
//	console.log ("place word :" + word);

	d = [0,1,2,3,4,5,6,7];

	ShuffleArray (d);
	
//	console.log ("d : " );
//	console.log (d);

	for (y = 0; y < WordGridHeight; y++)
	{
		for (x = 0; x < WordGridWidth; x++)
		{
			for (i = 0; i < d.length; i++)
			{
//				x = 0;
//				y = 0;
//				i = 2;
				dx = directions [(d[i]*2)+0];
				dy = directions [(d[i]*2)+1];

//				console.log ("position " + i + " x:" + x + " y:" + y + " dx:" + dx + " dy:" + dy + " " + word);
				
				r = CanPlaceWord (x,y,dx,dy,word);
				if (r == true)
				{
						// add position data to valid position list.

					positions.push(x);
					positions.push(y);
					positions.push(dx);
					positions.push(dy);
				}
			}
//			console.log (" ");
		}
	}
	
	if (positions.length < 4)
	{
		return false;	// no valid positions found
	}

	i = 4 * Math.floor (Math.random() * (positions.length/4));
	
//	console.log ("i:" + i);
	x = positions[i];
	y = positions[i+1];
	dx = positions [i+2];
	dy = positions [i+3];
//	console.log ("---");
	InsertWord (word, x,y, dx,dy);
	return true;
}
function TrimWord (str)
{
	str = str.toLowerCase();
	str = str.replace(/\s+/g, '');
	return str;
}

function FillBlanks (word_array)
{
	// fills in the blanks with random letters.
	
	// TO DO : expand this so that it ensures each word can only
	// be found once. this will make the routine take a very long
	// time, so not done it here.

	var x;
	var y;
	var ch;
	
	var str="abcdefghijklmnopqrstuvwxyz";
	
	for (y = 0; y < WordGridHeight; y++)
	{
		for (x = 0; x < WordGridWidth; x++)
		{
			ch = GetCellCh (x,y);
			if (ch == "")
			{
				ch = str.charAt (Math.floor (Math.random() * 26));
				SetCellCh (x,y,ch);
			}
		}
	}
}

function CreateWordSearch(word_list_array, num_words, width, height)
{
		// num_words allows a subset of the entire array to be used
		
	var i;
	var r;
	var idx;
	var trimmed_word;
	
//	console.log ("create");
	InitWordsearchGrid (width, height);

		// test data.
	
//	i = 0;
//	WordGrid[i++].ch = "t";	WordGrid[i++].ch = "e";	WordGrid[i++].ch = "f";	WordGrid[i++].ch = "s";	WordGrid[i++].ch = "f";
//	WordGrid[i++].ch = "w";	WordGrid[i++].ch = "i";	WordGrid[i++].ch = "o";	WordGrid[i++].ch = "e";	WordGrid[i++].ch = "i";
//	WordGrid[i++].ch = "o";	WordGrid[i++].ch = "g";	WordGrid[i++].ch = "u";	WordGrid[i++].ch = "v";	WordGrid[i++].ch = "v";
//	WordGrid[i++].ch = "t";	WordGrid[i++].ch = "h";	WordGrid[i++].ch = "r";	WordGrid[i++].ch = "e";	WordGrid[i++].ch = "e";
//	WordGrid[i++].ch = "";	WordGrid[i++].ch = "t";	WordGrid[i++].ch = "e";	WordGrid[i++].ch = "n";	WordGrid[i++].ch = "o";

// oeffs
// nioei
// eguvv
// three
//  twon


	WordList = word_list_array;
	//OrderWordList(WordList);
	ShuffleArray(WordList)
	
//	console.log (WordList);
	
	WordListArray = [];
	
	num_words = WordList.length;
//	num_words = 20;

	for (i = 0; i < num_words; i++)
	{
		trimmed_word = TrimWord (WordList[i]);
		
//		r = PlaceWord (WordList[i]);
		r = PlaceWord (trimmed_word);
		if (r == true)
		{
			// TO DO add word to 'placed' array
			idx = WordListArray.length;
			WordListArray[idx] = WordList[i];
		}
	}
	
	FillBlanks (WordListArray);
	
	WordListArray.sort();
	
//	console.log (WordListArray);
}
