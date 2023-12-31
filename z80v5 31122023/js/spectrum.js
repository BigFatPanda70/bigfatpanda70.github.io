/*
	Title	:	Spectrum Emulator

	Info	:	Version 2.5 13th October 2023

	Author	:	Nick Fleming

	Updated	:	31st December 2023

	 Notes:
	---------
		Updating my old spectrum emulator, including speeding up
	the screen rendering (hopefully) - trying to use the image
	data buffer directly, rather than creating an array and having to
	call drawImage to update the buffer (as it is slow??).



	 To Use:
	---------
		call SpectrumInit (div_id) to init the emulator. div_id is just
	the div container you want the screen to be inside. This code
	handles the rest.


//

//	FUSE CONTROLS 
//		E - left ctrl and left shift.
//		CAT, E mode then right ctrl and 9.
//
//
//	cat 0 for +d cat command
//
//
// to load a program:
//	Load P1
// 	where the number is the catalogue number

/*
	 27th August 2023
	==================
	Removed the need to do Screen.data.set (...) so screen updates should 
	be much faster now.

	Changed keyboard reading so keyboard shift = spectrum shift.
	and also the following symbols now act as symbol shift \,./ 

	numeric keypad on full sized keyboard can now be used for numbers.



	 12th September 2023
	-----------------------
	added routine to allow code to toggle preventDefault for reading
	the keyboard. This is required so that I can edit source code 
	in an edit area on the screen. Otherwise the emulator just hogs
	all the input.


	 13th September 2023
	-----------------------
		Adding code to pause program execution so I can do assembly
	language on the fly.


	 20th September 2023
	----------------------
		Adding experimental tap file reader. (not yet finished!!)


	 13th October 2023
	-------------------
		Reworking the screen display so it outputs the screen data
	one row at a time, to simulate the raster output. Trying it so I
	can experiment with raster avoiding techniques.

*/

// https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/

var ZX_CANVAS_ID = "zx_canvas";

var DebugMode = false;

var ScreenCanvas;
var screenCanvasCtx;
var screenWidth;
var screenHeight;
var screenImgData;		// reference to image data

var screenData;
var screenBuf8;

var keyboardCanvas;
var keyboardCanvasCtx;

var JoystickCanvas;
var JoystickCanvasCtx;

var attrCanvasCtx;

var ScreenRowIndexTable = [192];

var InkPaletteImg = new Image();
InkPaletteImg.src = "inkpalette.png";

var AttrPaletteImg = new Image();
AttrPaletteImg.src = "spectrum_palette2.png";

var KeyboardImg = new Image();
KeyboardImg.src = "keyboard.png";

var JoystickImg = new Image();
JoystickImg.src = "joypad.png";

var PaletteImg = new Image();
PaletteImg.src = "spectrum_palette2.png";

var KeyCodeArray = [];		// true = key down, false = key up

var KeysPreventDefault = true;

var MyZ80 = new Z80();
var SelectedRegister = 0;

var hex_digit = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];


var PauseEmulation = false;

function CreateScreenRowTable()
{
	var scr_addr;
	var lp;
	var i;
		
	for (lp = 0; lp < 3; lp++)
	{
		scr_addr = 16384 + (2048*lp);
		for (i = 0; i < 64; i++)
		{
			ScreenRowIndexTable[i+(lp*64)] = scr_addr;
			if ((scr_addr & 0x700) != 0x700)
			{
				scr_addr += 0x100;
			}
			else
			{
				scr_addr -= 0x700;
				scr_addr += 32;
			}
		}
	}
}

function Hex8 (num)
{
	var str;
	
	str = hex_digit[(num>>4)&0x0F] + hex_digit[num&0x0F];
	
	return str;
}
function Hex16 (num)
{
	var str;
	
	str = 
		hex_digit[(num>>12)&0x0F] +
		hex_digit[(num>>8)&0x0F] +
		hex_digit[(num>>4)&0x0F] +
		hex_digit[num&0x0F];
	
	return str;
}

function ShowRegisters(element_id, element_type)
{
		// element type 0 = div
		// element type 1 = textarea

	var id;
	var str;
	var i;
	var spc =[32];
	var flags;
	
	var nl;
	var sp;
	
	nl = "<br>";
	sp = "&nbsp";
	if (element_type != 0)
	{
			nl = "\n";
			sp = " ";
	}
	
	for (i = 0; i < 32; i++)	{	spc[i] = sp;	}

	id = document.getElementById (element_id);
	str = "";
	spc[SelectedRegister] = ">";

	str += "A"+sp+sp+ spc[0] +sp+sp+Hex8(MyZ80.A) +sp+sp+sp+sp+MyZ80.A+ nl;
	str += "B"+sp+sp+ spc[1] +sp+sp+Hex8(MyZ80.B) +sp+sp+sp+sp+MyZ80.B+ nl;
	str += "C"+sp+sp+ spc[2] +sp+sp+Hex8(MyZ80.C) +sp+sp+sp+sp+MyZ80.C+ nl;
	str += "D"+sp+sp+ spc[3] +sp+sp+Hex8(MyZ80.D) +sp+sp+sp+sp+MyZ80.D+ nl;
	str += "E"+sp+sp+ spc[4] +sp+sp+Hex8(MyZ80.E) +sp+sp+sp+sp+MyZ80.E+ nl;
	str += "H"+sp+sp+ spc[5] +sp+sp+Hex8(MyZ80.H) +sp+sp+sp+sp+MyZ80.H+ nl;
	str += "L"+sp+sp+ spc[6] +sp+sp+Hex8(MyZ80.L) +sp+sp+sp+sp+MyZ80.L+ nl;
	
	str += "BC" +sp+sp+sp+sp+ Hex16 ((MyZ80.B*256)+MyZ80.C) +sp+sp+ ((MyZ80.B*256)+MyZ80.C)+ nl;
	str += "DE" +sp+sp+sp+sp+ Hex16 ((MyZ80.D*256)+MyZ80.E) +sp+sp+ ((MyZ80.D*256)+MyZ80.E)+ nl;
	str += "HL" +sp+sp+sp+sp+ Hex16 ((MyZ80.H*256)+MyZ80.L) +sp+sp+ ((MyZ80.H*256)+MyZ80.L)+ nl;
	
	
	str += "IX"+sp+ spc[7] + Hex16(MyZ80.IX) + nl;
	str += "IY"+sp+ spc[8] +  Hex16(MyZ80.IY) + nl;
	str += "SP"+sp+ spc[9]+Hex16(MyZ80.SP) + nl;
	str += "PC"+sp+ spc[10]+Hex16(MyZ80.PC) + nl;
	str += "I"+sp+sp+ spc[11]+ sp+sp+Hex8(MyZ80.I) + nl;
	str += "R"+sp+sp+ spc[12]+ sp+sp+Hex8(MyZ80.R) + nl;
	str += "AF'"+ spc[13]+ Hex16((MyZ80.A_<<8)+MyZ80.F_) + nl;
	str += "BC'"+ spc[14]+ Hex16(MyZ80.BC_) + nl;
	str += "DE'"+ spc[15]+ Hex16(MyZ80.DE_) + nl;
	str += "HL'"+ spc[16]+ Hex16(MyZ80.HL_) + nl;

	flags = "" + MyZ80.F + " ";
	if (MyZ80.s != 0)	{flags += "s"} else {flags += sp};
	if (MyZ80.z != 0)	{flags += "z"} else {flags += sp};
//	if (MyZ80.c != 0) {flags += "c"} else {flags += sp};
	if ((MyZ80.F&1) != 0) {flags += "c"} else {flags += sp};
	
//	console.log (MyZ80);
	
	str += "F"+sp+sp+ flags + nl;	// + spc[6] + "&nbsp&nbsp" +Hex8(MyZ80.F) + "<br>";
	
	if (element_type == 0)
	{
		id.innerHTML = str;
	}
	else
	{
		id.value = str;
	}
}

function ShowMemView()
{
	var div;
	var row;
	var col;
	var i;
	var pc;
	var max_rows;
	var max_cols;
	var str;
	var ch;

	div = document.getElementById ("memory_panel");
	
	str = "";	//str = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F<br>";	//Addr&nbspmem&nbspascii<br>";
	max_rows = 10;
	max_cols = 16;
	pc = MyZ80.PC;

	for (row = 0; row < max_rows; row++)
	{
		str += Hex16(pc) + "&nbsp";
		for (col = 0; col < max_cols; col++)
		{
			str += "&nbsp" + Hex8(MyZ80.mem[pc+col]); 
		}
		str += "&nbsp";
		for (col = 0; col < max_cols; col++)
		{
			ch = MyZ80.mem[pc+col]&0xff;
			if ((ch > 31) && (ch < 128))
			{
				str += String.fromCharCode (ch);
			}
			else
			{
				str += ".";	
			}
		}
		str += "<br>";
		pc += max_cols;
	}
	
	div.innerHTML = str;
}

function GetDebugString (addr)
{
	var i;
	var dbgstr;
	var b1;
	var b2;
	
	i = MyZ80.mem[addr];

	if (i == 0xED)
	{
		i = MyZ80.mem[addr+1];
		b1 = MyZ80.mem[addr+2] & 0xff;
		b2 = MyZ80.mem[addr+3] & 0xff;
		if ((i < 64) || (i > 155))	return "???";
		dbgstr = ED_OpcodeTable[i-64];
		if (dbgstr.charAt(0) != "*")	return dbgstr;
		dbgstr = dbgstr.replace("MM",Hex16(b2<<8)+b1)
		return dbgstr; 
	}
	
	if (i == 0xCB)
	{
		i = MyZ80.mem[addr+1];
		dbgstr = CB_OpcodeTable[i];
		return dbgstr;
	}	
	
	b1 = MyZ80.mem[addr+1] & 0xff;
	b2 = MyZ80.mem[addr+2] & 0xff;
	dbgstr = single_opcode_table [i];
	if (dbgstr.charAt(0) != "*")	return dbgstr;

	dbgstr = dbgstr.substring(1);
	dbgstr = dbgstr.replace("N",Hex8(b1));
	dbgstr = dbgstr.replace("MM",Hex16((b2<<8)+b1));

	return dbgstr;
}


function AsmView()
{
	var div;
	var str;
	var i;
	var offset;
	var addr;
	var max_rows = 18;
	var instruction_length;
	var lp;
	var dbgstr;

	str = "";
	offset = 0;
	for (i = 0; i < max_rows; i++)
	{
		addr = (MyZ80.PC + offset) & 0xffff;
		str += Hex16 (addr) + "&nbsp";
		
		dbgstr = GetDebugString (addr);

		instruction_length = MyZ80.InstructionLength (addr);
		
		offset += instruction_length;
		lp = instruction_length;
		while (lp > 0)
		{
			str += Hex8 (MyZ80.mem[addr]);
			addr++;
			lp--;
		}
		if (instruction_length == 3) str += "&nbsp&nbsp";
		if (instruction_length == 2) str += "&nbsp&nbsp&nbsp&nbsp";
		if (instruction_length == 1) str += "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp";

		str += "&nbsp" + dbgstr + "<br>";
	}
	
	div = document.getElementById ("asm_panel");
	div.innerHTML = str;
}

function CreatePaletteImage()
{
	var ctx;
	var item;
	var lp;
	var lp2;
	var lp3;
	var n;
	
	item = document.getElementById ("palettecanvas");
	ctx = item.getContext ("2d");	
	
	
	for (lp3 = 0; lp3 < 16;lp3++)
	{
		for (lp = 0; lp < 256; lp++)
		{
			n = lp;
			for (lp2 = 0; lp2 < 8; lp2++)
			{
				if ((n & 128) != 0)
				{
					ctx.drawImage (PaletteImg,0,lp3*2,1,1, (lp*8)+lp2,lp3,1,1);
				}
				n = (n<<1)&254;
			}
		}
	}
}

function LoadRom()
{
	// based on https://en.wikipedia.org/wiki/Base64
	
	// aaaaaabb bbbbcccc ccdddddd
	// ===n1===|===n2===|===n3===
	
	var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var str;
	var a;	var b;	var c;	var d;
	var n1;	var n2;	var n3;
	var i;
	var lp; var lp2;
	var idx = 0;
	
	for (lp = 0; lp < z80_rom48_b64.length; lp++)
	{
		str = z80_rom48_b64[lp];
		i = 0;
		for (lp2 = 0; lp2 < str.length; lp2 += 4)
		{
			a = codes.indexOf(str.charAt(i++));
			b = codes.indexOf(str.charAt(i++));
			c = codes.indexOf(str.charAt(i++));
			d = codes.indexOf(str.charAt(i++));
			n1 = ((a<<2) | (b>>4)) & 0xff;
			n2 = ((b<<4) | (c>>2)) & 0xff;
			n3 = ((c<<6) | d) & 0xff;
			MyZ80.mem[idx++] = n1;
			MyZ80.mem[idx++] = n2;
			MyZ80.mem[idx++] = n3;
		}
	}
}

function LoadB64Array(b64_array)
{
	// note : array should be a spectrum .SNA file.
	// based on https://en.wikipedia.org/wiki/Base64
	
	// aaaaaabb bbbbcccc ccdddddd
	// ===n1===|===n2===|===n3===
	
	var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var str;
	var a;
	var b;
	var c;
	var d;
	var n1;
	var n2;
	var n3;
	var i;
	var lp;	var lp2;
	var idx = 16384;
	var sna_header = [28];
	var sna_idx;
	
	sna_idx = 0;
//	for (lp = 0; lp < b64_file.length; lp++)
	for (lp = 0; lp < b64_array.length; lp++)
	{
//		str = b64_file[lp];
		str = b64_array[lp];
		i = 0;
		for (lp2 = 0; lp2 < str.length; lp2 += 4)
		{
			a = codes.indexOf(str.charAt(i++));
			b = codes.indexOf(str.charAt(i++));
			c = codes.indexOf(str.charAt(i++));
			d = codes.indexOf(str.charAt(i++));
			n1 = ((a<<2) | (b>>4)) & 0xff;
			n2 = ((b<<4) | (c>>2)) & 0xff;
			n3 = ((c<<6) | d) & 0xff;
			if (sna_idx < 27)
			{
				sna_header[sna_idx++] = n1;
				sna_header[sna_idx++] = n2;
				sna_header[sna_idx++] = n3;
			}
			else
			{
				MyZ80.mem[idx++] = n1;
				MyZ80.mem[idx++] = n2;
				MyZ80.mem[idx++] = n3;
			}
		}
	}
	
//		0        1      byte   I
//	   1        8      word   HL',DE',BC',AF'
//	   9        10     word   HL,DE,BC,IY,IX
//	   19       1      byte   Interrupt (bit 2 contains IFF2, 1=EI/0=DI)
//	   20       1      byte   R
//	   21       4      words  AF,SP
//	   25       1      byte   IntMode (0=IM0/1=IM1/2=IM2)
//	   26       1      byte   BorderColor (0..7, not used by Spectrum 1.7)
//	   27       49152  bytes  RAM dump 16384..65535
	MyZ80.I = sna_header[0];
	MyZ80.HL_ = (sna_header[2]<<8) + sna_header[1]; 
	MyZ80.DE_ = (sna_header[4]<<8) + sna_header[3]; 
	MyZ80.BC_ = (sna_header[6]<<8) + sna_header[5]; 
	MyZ80.AF_ = (sna_header[8]<<8) + sna_header[7];
	MyZ80.L = sna_header[9]; 
	MyZ80.H = sna_header[10]; 
	MyZ80.E = sna_header[11]; 
	MyZ80.D = sna_header[12]; 
	MyZ80.C = sna_header[13]; 
	MyZ80.B = sna_header[14];
	MyZ80.IY = (sna_header[16]<<8) + sna_header[15];
	MyZ80.IX = (sna_header[18]<<8) + sna_header[17];
	MyZ80.iff2 = sna_header[19];
	MyZ80.R = sna_header[20];
	MyZ80.A = sna_header[21];
	MyZ80.F = sna_header[22];		// ** TO DO ** get these into flags variables.
	MyZ80.SP = (sna_header[24]<<8) + sna_header[23];
	MyZ80.interrupt_mode = sna_header[25];

	MyZ80.interrupts_on = true;
	if (MyZ80.iff2 == 0)	MyZ80.interrupts_on = false;
	
//	console.log ("regs: ");
//	console.log ("A:"+MyZ80.A+" B:"+MyZ80.B+" C:"+MyZ80.C+" D:"+MyZ80.D+" E:"+MyZ80.E+" H:"+MyZ80.H+" L:"+MyZ80.L);
//	console.log ("interrupts:"+MyZ80.interrupts_on);

	MyZ80.RETN();
}


function LoadRawSna (uint8_buffer)
{
	// loads raw data (from a file) assumed to be in an array buffer.

	var p;
	var sna_header = [28];
	var sna_header_size = 27;
	var i;
	var idx;

	sna_header = [28];
	sna_header_size = 27;

	p = uint8_buffer;

	for (i = 0; i < sna_header_size; i++)
	{
		sna_header[i] = p[i] & 0xff;
	}

	idx = 16384;
	for (i = 0; i < 49152; i++)
	{
		MyZ80.mem[idx++] = p[i + sna_header_size] & 0xff;
	}

	MyZ80.I = sna_header[0];
	MyZ80.HL_ = (sna_header[2]<<8) + sna_header[1]; 
	MyZ80.DE_ = (sna_header[4]<<8) + sna_header[3]; 
	MyZ80.BC_ = (sna_header[6]<<8) + sna_header[5]; 
	MyZ80.AF_ = (sna_header[8]<<8) + sna_header[7];
	MyZ80.L = sna_header[9]; 
	MyZ80.H = sna_header[10]; 
	MyZ80.E = sna_header[11]; 
	MyZ80.D = sna_header[12]; 
	MyZ80.C = sna_header[13]; 
	MyZ80.B = sna_header[14];
	MyZ80.IY = (sna_header[16]<<8) + sna_header[15];
	MyZ80.IX = (sna_header[18]<<8) + sna_header[17];
	MyZ80.iff2 = sna_header[19];
	MyZ80.R = sna_header[20];
	MyZ80.A = sna_header[21];
	MyZ80.F = sna_header[22];		// ** TO DO ** get these into flags variables.
	MyZ80.SP = (sna_header[24]<<8) + sna_header[23];
	MyZ80.interrupt_mode = sna_header[25];

	MyZ80.interrupts_on = true;
	if (MyZ80.iff2 == 0)	MyZ80.interrupts_on = false;

//	console.log ("regs:----- ");
//	console.log ("A:"+MyZ80.A+" B:"+MyZ80.B+" C:"+MyZ80.C+" D:"+MyZ80.D+" E:"+MyZ80.E+" H:"+MyZ80.H+" L:"+MyZ80.L);
//	console.log ("interrupts:"+MyZ80.interrupts_on);

	MyZ80.RETN();

}




var dsrow = 0;
var dscol = 0;
var dsidx = 0;
var scrbyte = 0;
var attr_idx = 0;
var dsink = 0;
var dsrowstart = 0;
var dsrowstarty = 0;

function DrawScreen()
{
		// routine not used ????
		// DrawScreen2 now used
//	var row;
//	var col;
//	var idx;
//	var screen_byte;
//	var attr_idx;
//	var ink;

//	screenCanvasCtx.clearRect (0,dsrowstarty, 256,96);

	for (dsrow = 0; dsrow < 96; dsrow++)
	{
		attr_idx = 22528 + (((dsrow+dsrowstarty)<<2)&0x1E0);
		dsidx = ScreenRowIndexTable[dsrow+dsrowstarty];
		for (dscol = 0; dscol < 32; dscol++)
		{
			scrbyte = MyZ80.mem[dsidx++];
			dsink = MyZ80.mem[attr_idx++] & 7;
			screenCanvasCtx.drawImage (InkPaletteImg, scrbyte*8,dsink, 8,1, dscol*8,dsrow+dsrowstarty, 8,1);
		}	
	}
	dsrowstart ^= 3072;
	dsrowstarty ^= 96;
}

var SpectrumInks =		// stored argb style
	[
		0xFF000000,		//		0xFF000000,				// black	(0,0,0)
		0xFFC81D00,											// blue		(0,29,200)
		0xFF0F24D8,		//		0xFFD8240F				// red		(216,36,15)
		0xFFC930D5,		//		0xFFD530C9,				// magenta	(213,48,201)
		0xFF21C700,		//		0xFF00C721,				// green	(0,199,33)
		0xFFCBC900,		//		0xFF00C9CB,				// cyan		(0,201,203)
		0xFF26CACE,		//		0xFFCECA26,				// yellow	(206,202,38)
		0xFFCBCBCB,		//		0xFFCBCBCB,				// white	(203,203,203)
		0xFF000000,		//		0xFF000000,				// black	(0,0,0)
		0xFFFB2700,		//		0xFF0027FB,				// bright blue		(0,39,251)
		0xFF1630FF,		//		0xFFFF3016,				// bright red		(255,48,22)
		0xFFFC3FFF,		//		0xFFFF3FFC,				// bright magenta	(255,63,252)
		0xFF2CF900,		//		0xFF00F92C,				// bright green		(0, 249,44)
		0xFFFEFC00,		//		0xFF00FCFE,				// bright cyan		(0, 252, 254)
		0xFF33FDFF,		//		0xFFFFFD33,				// bright yellow	(255,253, 51)
		0xFFFFFFFF,		//		0xFFFFFFFF				// bright white		(255,255,255)

		0xFF000000,				// black	(0,0,0)
		0xFF001DC8,				// blue		(0,29,200)
		0xFFD8240F,				// red		(216,36,15)
		0xFFD530C9,				// magenta	(213,48,201)
		0xFF00C721,				// green	(0,199,33)
		0xFF00C9CB,				// cyan		(0,201,203)
		0xFFCECA26,				// yellow	(206,202,38)
		0xFFCBCBCB,				// white	(203,203,203)
		0xFF000000,				// black
		0xFF0027FB,				// bright blue		(0,39,251)
		0xFFFF3016,				// bright red		(255,48,22)
		0xFFFF3FFC,				// bright magenta	(255,63,252)
		0xFF00F92C,				// bright green		(0, 249,44)
		0xFF00FCFE,				// bright cyan		(0, 252, 254)
		0xFFFFFD33,				// bright yellow	(255,253, 51)
		0xFFFFFFFF				// bright white		(255,255,255)

	];

function DrawScreen2()
{
		// not used ???
	var i;
	var scrink = [2];
	var paper;
	var ink;

//	ink[0] = 0;
//	ink[1] = 
//			(255 << 24)	|		// alpha
//			(255 << 16) |		// blue
//			(255 <<  8) |		// green
//			255;						// red

	i = 0;
	for (dsrow = 0; dsrow < 192; dsrow++)
	{
		attr_idx = 22528 + (((dsrow)<<2)&0x7E0);
		
		dsidx = ScreenRowIndexTable[dsrow];
		for (dscol = 0; dscol < 32; dscol++)
		{
			ink = MyZ80.mem[attr_idx++];
			paper = (ink>>3)&0x0F;
			ink = (ink&7)+((ink>3)&8);
			scrink[0] = SpectrumInks[paper];
			scrink[1] = SpectrumInks[ink];

			scrbyte = MyZ80.mem[dsidx++];
			screenData[i++] = scrink [(scrbyte>>7)&1]; 
			screenData[i++] = scrink [(scrbyte>>6)&1]; 
			screenData[i++] = scrink [(scrbyte>>5)&1]; 
			screenData[i++] = scrink [(scrbyte>>4)&1]; 
			screenData[i++] = scrink [(scrbyte>>3)&1]; 
			screenData[i++] = scrink [(scrbyte>>2)&1]; 
			screenData[i++] = scrink [(scrbyte>>1)&1]; 
			screenData[i++] = scrink [scrbyte&1]; 
		}	
	}
}

function DrawSpectrumScreenRow(row_num)
{
	var i;
	var scrink = [2];
	var paper;
	var ink;

//	ink[0] = 0;
//	ink[1] = 
//			(255 << 24)	|		// alpha
//			(255 << 16) |		// blue
//			(255 <<  8) |		// green
//			255;						// red


	i = row_num*256;
	attr_idx = 22528 + (((row_num)<<2)&0x3E0);
		
	dsidx = ScreenRowIndexTable[row_num];
	for (dscol = 0; dscol < 32; dscol++)
	{
		ink = MyZ80.mem[attr_idx++];
		paper = (ink>>3)&0x0F;
		ink = (ink&7)+((ink>>3)&8);
		scrink[0] = SpectrumInks[paper];
		scrink[1] = SpectrumInks[ink];

		scrbyte = MyZ80.mem[dsidx++];
		screenData[i++] = scrink [(scrbyte>>7)&1]; 
		screenData[i++] = scrink [(scrbyte>>6)&1]; 
		screenData[i++] = scrink [(scrbyte>>5)&1]; 
		screenData[i++] = scrink [(scrbyte>>4)&1]; 
		screenData[i++] = scrink [(scrbyte>>3)&1]; 
		screenData[i++] = scrink [(scrbyte>>2)&1]; 
		screenData[i++] = scrink [(scrbyte>>1)&1]; 
		screenData[i++] = scrink [scrbyte&1]; 
	}	

	screenCanvasCtx.putImageData (screenImgData, 0,0, 0, row_num, 256,1);
}

/*
function DrawScreenAttr()
{
	var idx;
//	var row;
//	var col;
	var paper_colour;
	var i;

	idx = 22528;		//16384 + 6144;			// 22
	
	for (i = 0; i < 768; i++)
	{
		paper_colour = (MyZ80.mem[idx++]>>2)&0x0E;
		attrCanvasCtx.drawImage (AttrPaletteImg, 0, paper_colour, 1,1, i & 31,i>>5,1,1);
	}
//	for (row = 0; row < 24; row++)
//	{
//		for (col = 0; col < 32; col++)
//		{
//			paper_colour = (MyZ80.mem[idx++]>>2)&0x0E;
//			attrCanvasCtx.drawImage (AttrPaletteImg, 0, paper_colour, 1,1, col,row,1,1);
//		}
//	}
}
*/

	// ------------------ frame counter code -------------------
/*	
var time_start = new Date().getTime();
var frame_number = 0;
var frames_per_second = 0;

function UpdateFrameCounter()
{
	var dt;
	var time_now;

	time_now = new Date().getTime();
	frame_number++;
	
	dt = (time_now - time_start)/1000;
	if (dt > 1)
	{
		frames_per_second = Math.floor(frame_number / dt);
		time_start = time_now;
		frame_number = 0;
	}
	
	document.getElementById ("fps").innerHTML = frames_per_second;
};
* */

	// -----------------------------------------------------
/*

function DrawKeyboard()
{
	var ctx;
	var item;
	
	item = document.getElementById ("zxkeyboard");
	ctx = item.getContext ('2d');
	
	ctx.drawImage (KeyboardImg,0,0);
}

function DrawJoystick()
{
	var ctx;
	var item;
	
	item = document.getElementById ("oldskooljoystick");
	ctx = item.getContext ('2d');
	
	ctx.drawImage (JoystickImg,0,0);
}
*/

var ScreenRow = 0;
function RunFullSpeed()
{
		// really rough, not terribly accurate timings !! (LOL!!)

	var int_state;
	var t_state_counter;
	
	var total_t_states = 0;

	t_state_counter = 0;
	MyZ80.StartMaskableInterrupt();		// generate vertical blank interrupt.

//	MyZ80.mem[16384] = (MyZ80.mem[16384] + 1) & 0xff;
			// do emulation in 'border' above the screen
	while (t_state_counter < 14336)
	{
//		if (TestStuff() == false)	return;
//		if ((MyZ80.t_states == 0) || (BreakPointAddr == z80.PC))
//		{
//			SingleStepMode = 1;
//			return;			// error !!
//		}
		MyZ80.EmZ80();
		t_state_counter += MyZ80.t_states;
	}

total_t_states += t_state_counter;
			// do emulation in 'screen' area
	ScreenRow = 0;
	while (ScreenRow < 192)
	{
		t_state_counter = 0;
		while (t_state_counter < 224)
		{
//				if (TestStuff() == false)	return;
//			if ((z80.t_states == 0) || (BreakPointAddr == z80.PC))
//			{
//				SingleStepMode = 1;
//				return;			// error !!
//			}
			MyZ80.EmZ80();
			t_state_counter += MyZ80.t_states;
		}
		total_t_states += t_state_counter;
		DrawSpectrumScreenRow(ScreenRow);
		ScreenRow++;
	}
	
			// do emulation in 'border' below screen.
	t_state_counter = 0;
	while (t_state_counter < 12544)				// 56 * 224
	{
//			if (TestStuff() == false)	return;
//			if ((z80.t_states == 0) || (BreakPointAddr == z80.PC))
//			{
//				SingleStepMode = 1;
//				return;			// error !!
//			}
		MyZ80.EmZ80();
		t_state_counter += MyZ80.t_states;
	}
	
	total_t_states += t_state_counter;
//	console.log ("tt:" + total_t_states);
}


var zorro = 0;

var drawing = false;
function EmulateSpectrum()
{
	var lp;

/*	DebugMode = true;
	MyZ80.mem[0] = 0x21;		// ld hl, 0x0201
	MyZ80.mem[1] = 0x01;
	MyZ80.mem[2] = 0x02;

	MyZ80.mem[3] = 0xdd;		// ld ix, 0x0009
	MyZ80.mem[4] = 0x21;
	MyZ80.mem[5] = 0x09;
	MyZ80.mem[6] = 0x00;

	MyZ80.mem[7] = 0xdd;		// ld h,(ix+3) 
	MyZ80.mem[8] = 0x66;
	MyZ80.mem[9] = 0x03;

	MyZ80.mem[10] = 0x04;
	MyZ80.mem[11] = 0x05;
	MyZ80.mem[12] = 0x06;
	MyZ80.mem[13] = 0x07;
	MyZ80.mem[14] = 0x08;
	MyZ80.mem[15] = 0x09;
*/

	FrameCounter_Update();	//UpdateFrameCounter();

	if (KeyCodeArray[163] == true)
	{
		if (DebugMode == false)
		{
			console.log ("# key pressed : debug on");
			DebugMode = true;
		}
		else
		{
			console.log ("# key pressed : debug off");
			DebugMode = false;
		}

		KeyCodeArray[163] = false;
	}

	if ((screenCanvasCtx) && (PauseEmulation == false))
	{
		if (drawing == false)
		{
			drawing = true;

			if (DebugMode == false)
			{
				RunFullSpeed();
//				screenImgData.data.set (screenBuf8);
//				screenCanvasCtx.putImageData(screenImgData, 0, 0);


			}

			if (DebugMode == true)
			{
/*				if (KeyCodeArray[65] == true)		// 'A'
				{
					console.log ("aaa");
					MyZ80.PC += MyZ80.InstructionLength(MyZ80.PC);
					
					KeyCodeArray[65] = false;
				}

				if (KeyCodeArray[83] == true)	// 'S' pressed
				{
//						if (zorro == 0)
//						{
//							while (MyZ80.PC != 0x8D63)	//0x8D4C)	//0x8D55)	//0x8D22)	//0x98D4)	//0x98DC)	//0x98AD)	// 0x98F0)	// 0x98BC)
//							{
//								if (MyZ80.mem[MyZ80.PC] == 0x76)	MyZ80.PC++;
//								MyZ80.EmZ80();
//							}
//							zorro = 1;
//						}
						MyZ80.EmZ80();
						KeyCodeArray[83] = false;
				}
				DrawScreen2();
//					ShowRegisters();
	//				ShowMemView();
					AsmView();
*/
			}
			drawing = false;
		}
	}
//	for (lp = 0; lp < 500000; lp++)
//	{
//		MyZ80.EmZ80();
//		MyZ80.EmZ80();
//	}
	
	requestAnimationFrame (EmulateSpectrum);
}

/*
function ProcessSpectrumKeys(key_code, key_status)
{
			// key_code = ascii key code
			// key_status -> 0 = up	1 = down.
		var i;
		var bit_value;

		if (key_code == 0)	return;

		i = -1;
		if ((key_code >= '0') && (key_code <= '9'))		i = key_code - '0';
		if ((key_code >= 'a') && (key_code <= 'z'))		i = key_code - 'a' + 10;
		if (key_code == ' ')	i = 37;		// space
		if (key_code == 10)		i = 36;		// enter
		if (key_code == 8)		i = 38;		// delete (symbol shift)
				// to do : caps shift key (somehow..)

		if (i == -1)	return;		// nothing of interest pressed.

		i = i * 2; 
		bit_value = KeyPressTable[i++];
		i = (KeyPressTable[i] & 0x07);
		if (key_status == 1)
		{
			// key pressed, need to set the bit to 0
			z80.keyboard_port_table[i] &= (0xff ^ bit_value);
		}
		else
		{
			// key not pressed, need to set the bit to 1.
			z80.keyboard_port_table[i] |= bit_value;
		}
	}
*/

var KeyPressTable =		// spectrum keyboard layout order
[
		// bit, group
	1,	 3,			// '1'
	2,	 3,			// '2'
	4,	 3,			// '3'
	8,	 3,			// '4'
	16, 3,			// '5'
	16, 4,			// '6'
	8,	 4,			// '7'
	4,	 4,			// '8'
	2,	 4,			// '9'
	1,	 4,			// '0'		// bit to set/reset, port data byte index.

	1,	 2,			// 'q'
	2,	 2,			// 'w'
	4,	 2,			// 'e'
	8,	 2,			// 'r'
	16, 2,			// 't'
	16, 5,			// 'y'
	8,	 5,			// 'u'
	4,	 5,			// 'i'
	2,	 5,			// 'o'
	1,	 5,			// 'p'

	1,	 1,			// 'a'
	2,	 1,			// 's'
	4,	 1,			// 'd'
	8,	 1,			// 'f'
	16, 1,			// 'g'
	16, 6,			// 'h'
	8,	 6,			// 'j'
	4,	 6,			// 'k'
	2,	 6,			// 'l'
	1,	 6,			// enter

	1,	 0,			// shift
	2,	 0,			// 'z'
	4,	 0,			// 'x'
	8,	 0,			// 'c'
	16, 0,			// 'v'
	16, 7,			// 'b'
	8,	 7,			// 'n'
	4,	 7,			// 'm'
	2,	 7,			// symbol shift
	1,	 7,			// space
	1,	 7,			// space (this is not a mistake!)
		
	//1,	 0			// caps lock (special case)

];

var KeyPressTable2 =		// keycode order.
[
	 1,	4,			// '0'		// bit to set/reset, port data byte index.
	 1,	3,			// '1'
	 2,	3,			// '2'
	 4,	3,			// '3'
	 8,	3,			// '4'
	16,	3,			// '5'
	16,	4,			// '6'
	 8,	4,			// '7'
	 4,	4,			// '8'
	 2,	4,			// '9'
	 1,	1,			// 'a'		//10
	16,	7,			// 'b'
	 8,	0,			// 'c'
	 4,	1,			// 'd'
	 4,	2,			// 'e'
	 8,	1,			// 'f'
	16,	1,			// 'g'
	16,	6,			// 'h'
	 4,	5,			// 'i'
	 8,	6,			// 'j'
	 4,	6,			// 'k'		//20
	 2,	6,			// 'l'
	 4,	7,			// 'm'		// 22
	 8,	7,			// 'n'		// 23
	 2,	5,			// 'o'
	 1,	5,			// 'p'
	 1,	2,			// 'q'
	 8,	2,			// 'r'
	 2,	1,			// 's'
	16,	2,			// 't'
	 8,	5,			// 'u'		// 20
	16,	0,			// 'v'
	 2,	2,			// 'w'
	 4,	0,			// 'x'
	16,	5,			// 'y'
	 2,	0,			// 'z'
	 1,	6,			// enter			// 36
	 1,	7,			// space			// 36
	 2,	7,			// symbol shift		// 38
	 0,	0,			// caps lock		// 39
	 1, 0,			// shift			// 40

];


function ProcessKeyboardPress (mx,my,key_status)
{
		// called by the mouse and touch events routines to convert the screen canvas
		// coordinates into a spectrum keyboard code.
/*
	var keyboard_row;
	var keyboard_col;
	
	var i;
	var bit_value;

			// work out which key has been pressed.
//	keyboard_row = Math.floor (my/80);		//220 / 4 = 1105
	keyboard_row = Math.floor (my/55);
	
//	mx -= 20 + (keyboard_row*25);
	mx -= 11 + (keyboard_row*20);
	keyboard_col = Math.floor (mx/45);	//71);
	
	if ((keyboard_col < 0) || (keyboard_col >9))	return;

	i = 2 * ((keyboard_row * 10) + keyboard_col);

	bit_value = KeyPressTable[i++];
	i = (KeyPressTable[i] & 0x07);
	if (key_status == 0)
	{
		z80_keyboard_port_table[i] &= (0xff ^ bit_value);
	}
	else
	{
		z80_keyboard_port_table[i] |= bit_value;
	}

//	alert ("mx:"+mx+" my:"+my+" row:"+keyboard_row+" col:"+keyboard_col);
*/
}

function MousePressed(e, key_status)
{
//	var x;
//	var y;
	var mx;
	var my;
	
	var pagex;
	var pagey;
	
	var rect;
	
//	var keyboard_row;
//	var keyboard_col;
	
//	var i;
//	var bit_value;

	if (e != null)
	{
		if (e.which != 1)	return;	// 1 = left mouse button
		pagex = e.pageX;
		pagey = e.pageY;
	}
//	else
//	{
//		pagex = TouchX;
//		pagey = TouchY;
//	}function ProcessKeyPress(keycode, state)


	rect = keyboardCanvas.getBoundingClientRect();

	mx = pagex - rect.left;
	my = pagey - rect.top;
	
	ProcessKeyboardPress (mx,my,key_status)
}

function ProcessExtendedKeyPress (keycode, key_status)
{
	// does some extra processing for converting full size pc
	// keyboard keys to spectrum keys, because ...why not ???
	
	// currently handles the following keycodes
	//	backspace
	//	full stop
	//	comma


	var table_idx = [];
	var idx;
	var port_idx;
	var i;

//	console.log ("extended");

	i = 0;
	switch (keycode)
	{
		case 8:		// backspace key = shift with zero
			table_idx[i++] =  0;	// zero
			table_idx[i++] = 40;	// shift
			break;
		case 188:					// comma = symbol shift with n
			table_idx[i++] = 38;	// symbol shift
			table_idx[i++] = 23;
			break;
		case 190:					// full stop = symbol shift + m
			table_idx[i++] = 38;	// symbol shift
			table_idx[i++] = 22;
			break;
		
		default:	return;
	}
				
	for (i = 0; i < table_idx.length; i++)
	{
		idx = table_idx[i]*2;
//		console.log ("i:" + i + " idx: " + idx);
		port_idx = KeyPressTable2 [idx+1]&7;
		if (key_status == 1)
		{
			z80_keyboard_port_table[port_idx] &= (0xff ^ KeyPressTable2[idx]);
		}
		else
		{
			z80_keyboard_port_table[port_idx] |= KeyPressTable2[idx];
		}
	}
}

function ProcessKeyPress(keycode, key_status)
{
	// converts a keycode to a bit value and stores it in
	// the z80 keyboard port table.
	
	// key_status :
	// 0 = Key Up
	// 1 = Key down

	// keycodes:
	// 48..57 = 0 -> 9
	// 65..90 = a -> z
	// 13 = enter
	// 32 = space
	// 16 = shift
 
	var i;
	var bit_value;

	//console.log ("keycode : " + keycode);

	// convert keycode to keypresstable value.

	i = -1;
	if ((keycode >= 48) && (keycode <= 57))	i = keycode-48;
	if ((keycode >= 96) && (keycode <=105)) i = keycode-96;		// convert numbers on fullsized keypad
	
	if ((keycode >= 65) && (keycode <= 90))	i = keycode-65 + 10;
	if (keycode == 13)		i = 36;		// enter
	if (keycode == 32)	i = 37;		// space
	if (keycode == 16)	i = 40;		// shift
	
	if (keycode == 38)	i = 7;		// up arrow
	if (keycode == 40)	i = 6;		// down arrow
	if (keycode == 37)	i = 5;		// left arrow
	if (keycode == 39)	i = 8;		// right arrow

	if ((keycode == 220) ||		// '\'
		(keycode == 190) ||		// '.'
		(keycode == 188))		// ','
	{
		i = 38;		// symbol shift
		
	}
	
	if ((keycode == 8) ||	// backspace - special case.
		(keycode == 188) || // comma
		(keycode == 190))	// full stop.
	{
		ProcessExtendedKeyPress (keycode, key_status);
		return;
	}
	
/*
		// backspace = shift and zero.
		if (key_status == 1)
		{
			z80_keyboard_port_table[KeyPressTable2[(0*2)+1]&7] &= (0xff ^ KeyPressTable2[0*2]);
			z80_keyboard_port_table[KeyPressTable2[(40*2)+1]&7] &= (0xff ^ KeyPressTable2[40*2]);
		}
		else
		{
			z80_keyboard_port_table[KeyPressTable2[(0*2)+1]&7] |= KeyPressTable2[0*2];
			z80_keyboard_port_table[KeyPressTable2[(40*2)+1]&7] |= KeyPressTable2[40*2];
		}
		return;
	}
*/	
	if (i == -1)	return;

	i *= 2;
	bit_value = KeyPressTable2[i++];
	i = (KeyPressTable2[i] & 0x07);
	if (key_status == 1)
	{
		z80_keyboard_port_table[i] &= (0xff ^ bit_value);
	}
	else
	{
		z80_keyboard_port_table[i] |= bit_value;
	}
}

	// --------- improved keyboard stuff (hopefully) -----------


function DoKeyDown (e)
{
	var k;
	
	k = e.keyCode;

	if ((k == 123) || (k == 116))	return;		// ignore F5 and F12 (used by firefox).
	
//	if (k == 8)	k = 128;

	KeyCodeArray[k] = true;
	ProcessKeyPress(k, 1);

	if (KeysPreventDefault == true)
	{
		e.preventDefault(); 
	}
};

function DoKeyUp (e)
{
	var k;
	
	k = e.keyCode;

	if ((k == 123) || (k == 116))	return;		// ignore F5 and F12 (used by firefox).

	KeyCodeArray[k] = false;
	ProcessKeyPress(k, 0);
}

function KeyEventsInit(element_id)
{
	var lp;

	var t;

	t = document.getElementById (element_id);

	for (lp = 0; lp < 255; lp++)
	{
		KeyCodeArray[lp] = false;
	}
	document.addEventListener ("keydown", DoKeyDown, false);
	document.addEventListener ("keyup", DoKeyUp, false);

//	t.addEventListener ("keydown", DoKeyDown, false);
//	t.addEventListener ("keyup", DoKeyUp, false);
}


function Spectrum_SetPreventKeyDefault (tof)
{
	// true = prevent default
	// false = normal behaviour

	KeysPreventDefault = tof;
}
//KeyEventsInit();

	// ---------------------------------------------------------------


	// -----------------------------------------------------


	// ========= touch events code for keyboard ==========
	// from :https://github.com/borismus/MagicTouch/blob/master/samples/tracker.html
/*var touches = [];

function ol() {
	var canvas = document.getElementById('zxkeyboard');
	var ctx = canvas.getContext('2d');
	alert (canvas + " " + ctx);
//	timer = setInterval(update, 15);
	canvas.addEventListener('touchend', function() {
	//ctx.clearRect(0, 0, w, h);
	alert ("touch end");
	});
	
	canvas.addEventListener('touchmove', function(event) {
  event.preventDefault();
  touches = event.touches;
	});

	canvas.addEventListener('touchstart', function(event) {
  	console.log('start');
	});
};
*/

var TouchX;
var TouchY;

function TouchStart()
{
	var i;

	var str;
	var e;
	var pagex;
	var pagey;
	var tx;
	var ty;
	
	var bitch;
	
	e = event;
	rect = keyboardCanvas.getBoundingClientRect();

	for (i = 0; i < e.targetTouches.length; i++)
	{
		TouchX = e.targetTouches[i].pageX;
		TouchY = e.targetTouches[i].pageY;
	
		pagex = Math.floor(TouchX);
		pagey = Math.floor(TouchY);

		tx = pagex - rect.left;
		ty = pagey - rect.top;

//		str = "x "+ tx + " y " + ty + " \nyeah bitch";

		ProcessKeyboardPress (tx,ty,0);
	}

//	alert (str);
	
//	SelectTile(null);	
	e.preventDefault();
}

function TouchMove()
{
	var e;

	e = event;

	TouchX = e.targetTouches[0].pageX;
	TouchY = e.targetTouches[0].pageY;

//	DragTile(null);	
	e.preventDefault();
}

function TouchEnd()
{
	var i;

	var e;

	var str;
	var e;
	var pagex;
	var pagey;
	var tx;
	var ty;
	
	var bitch;

	e = event;
	rect = keyboardCanvas.getBoundingClientRect();

//	alert (e.changedTouches.length);

	for (i = 0; i < e.changedTouches.length; i++)
	{
		TouchX = e.changedTouches[i].pageX;
		TouchY = e.changedTouches[i].pageY;
	
		pagex = Math.floor(TouchX);
		pagey = Math.floor(TouchY);

		tx = pagex - rect.left;
		ty = pagey - rect.top;

//	str = "x "+ tx + " y " + ty + " \nyeah bitch";

		ProcessKeyboardPress (tx,ty,1);
	}


	e.preventDefault();
}

function TouchyFeelyTime()
{
	var supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

//	alert ("touch events supported:" + supportsTouch);

	var canvas;
	canvas = document.getElementById("zxkeyboard");

	canvas.addEventListener("touchstart",TouchStart,false);
	canvas.addEventListener("touchmove",TouchMove,true);
	canvas.addEventListener("touchend",TouchEnd,false);
}

	// -----------------------------------------------------------
			// ----Canvas based touchscreen joypad ----
	// -----------------------------------------------------------

var JoystickCX = 110;
var JoystickCY = 100;
var JoystickRadius = 100;
var JoystickDeadZone = 20;

var JoystickRadiusSquared = JoystickRadius*JoystickRadius;
var JoystickDeadZoneSquared = JoystickDeadZone*JoystickDeadZone;

var JoystickButton = 
				[
					450,100,			// A
					404,136,			// B
					404,62,			// X
					355,100,			// Y
					256,70,			// start (enter)
					256,140			// select
				];

var JoystickButtonRadius = 25;

var segment_slope_0_m = -38/92;			// dy/dx
var segment_slope_1_m = -92/-38;
var segment_slope_2_m = -92/38;
var segment_slope_3_m = -38/-92;

function GetJoystickSegment (mx, my)
{
		// 8 way joystick - returns segment number 0 to 7.
		// 0 = N, 1 = NE, 2 = E, 3 = SE, 4=S, 5=SW, 6=W, 7=NW
		// -1 = in dead zone or outside joystick area.

	var dx;
	var dy;
	var distance_from_centre_squared;

	var c = document.getElementById("oldskooljoystick");
	var ctx=c.getContext("2d");

	dx = mx - JoystickCX;
	dy = my - JoystickCY;
	
	ctx.beginPath();
	ctx.arc(JoystickCX+dx,JoystickCY+dy,16,0,2*Math.PI);
	ctx.stroke();
	ctx.closePath();

	distance_from_centre_squared = (dx*dx)+(dy*dy)
	if (distance_from_centre_squared < JoystickDeadZoneSquared)	return -1;
	if (distance_from_centre_squared > JoystickRadiusSquared)	return -1;

//	alert ("dy : " + dy + "dx:" + dx + " dx * segment_slope_0_m" + dx * segment_slope_0_m);
	if (dy < (dx * segment_slope_0_m))
	{
		// segment is either 0,1,6 or 7
		console.log ("0,1,6 or 7");
		if (dy < (dx*segment_slope_1_m))
		{
			// segment is either 0 or 1
			console.log ("0,1");

			if ((dx*segment_slope_2_m) < dy)
			{
				console.log ("1");
				return 1;
			}
				console.log ("0");
			return 0;
		}
		else
		{
			// segment is either 6 or 7
			console.log ("6 or 7");

			if ((dx*segment_slope_3_m) < dy)
			{
				console.log ("6");
				return 6;
			}
				console.log ("7");
			return 7;
		}
	}
	else
	{
		// segment is either 2,3,4 or 5
		console.log ("2,3,4 or 5");
 
		if (dy < (dx*segment_slope_1_m))
		{
			// segment is either 2 or 3
				console.log ("2,3");
 
			if (dy < (dx*segment_slope_3_m))
			{
				console.log ("2,");
 				return 2;
			}
					console.log ("3");
 
			return 3;
		}
		else
		{
			// segment is either 4 or 5
					console.log ("4 or 5");
 
			if ((dx*segment_slope_2_m) < dy)
			{
					console.log ("4");
 
				return 4;
			}
					console.log ("5");
			return 5;
		}
	}
	
	return -1;		//should not need this
}


function JoyTouchStart()
{
	var i;

	var str;
	var e;
	var pagex;
	var pagey;
	var tx;
	var ty;
	
	var joy_segment;
	
	e = event;
	rect = JoystickCanvas.getBoundingClientRect();
	

//	alert (e.targetTouches.length);
	for (i = 0; i < e.targetTouches.length; i++)
	{
		TouchX = e.targetTouches[i].pageX;
		TouchY = e.targetTouches[i].pageY;
	
		pagex = Math.floor(TouchX);
		pagey = Math.floor(TouchY);

		tx = pagex - rect.left;
		ty = pagey - rect.top;

		joy_segment = GetJoystickSegment (tx, ty);
		if (joy_segment != -1)
		{
			switch (joy_segment)
			{
				case 0:
							ProcessKeyPress(53,0);
							ProcessKeyPress(54,0);		// up
							ProcessKeyPress(55,1);
							ProcessKeyPress(56,0);
							 break;	// up
				case 2:
							ProcessKeyPress(53,0);
							ProcessKeyPress(54,0);		// right
							ProcessKeyPress(55,0);
							ProcessKeyPress(56,1);
 							break;	// right
				case 4:
							ProcessKeyPress(53,0);
							ProcessKeyPress(54,1);		// up
							ProcessKeyPress(55,0);
							ProcessKeyPress(56,0);
							break;	// down
				case 6:
							ProcessKeyPress(53,1);
							ProcessKeyPress(54,0);		// up
							ProcessKeyPress(55,0);
							ProcessKeyPress(56,0);
 							break;	// left

				case 1:
							ProcessKeyPress(53,0);
							ProcessKeyPress(54,0);		// up
							ProcessKeyPress(55,1);
							ProcessKeyPress(56,1);
							break;	// up + right
			 			
				case 3: 
							ProcessKeyPress(53,0);
							ProcessKeyPress(54,1);		// up
							ProcessKeyPress(55,0);
							ProcessKeyPress(56,1);
						break;	// right+down

				case 5:
							ProcessKeyPress(53,1);
							ProcessKeyPress(54,1);		// up
							ProcessKeyPress(55,0);
							ProcessKeyPress(56,0);
 							break;	// down + left

				case 7:
							ProcessKeyPress(53,1);
							ProcessKeyPress(54,0);		// up
							ProcessKeyPress(55,1);
							ProcessKeyPress(56,0);
  							break;	// left + up
				default:	break;
			}
		}
	}
	e.preventDefault();
}

function JoyTouchEnd()
{
	var i;

	var str;
	var e;
	var pagex;
	var pagey;
	var tx;
	var ty;
	
	var joy_segment;

	var joyreset = 0;
	
	e = event;
	rect = JoystickCanvas.getBoundingClientRect();

	for (i = 0; i < e.changedTouches.length; i++)
	{
		TouchX = e.changedTouches[i].pageX;
		TouchY = e.changedTouches[i].pageY;
	
		pagex = Math.floor(TouchX);
		pagey = Math.floor(TouchY);

		tx = pagex - rect.left;
		ty = pagey - rect.top;

		joy_segment = GetJoystickSegment (tx, ty);
		if (joy_segment != -1)
		{
			joyreset = 1;
		}
	}

	if (joyreset == 1)
	{
			ProcessKeyPress(53,0);
			ProcessKeyPress(54,0);
			ProcessKeyPress(55,0);
			ProcessKeyPress(56,0);
	}
	e.preventDefault();
}

function InitTouchJoypad()
{
	var c;
	var i;
	var bx;
	var by;
	
	c = document.getElementById("oldskooljoystick");

	if (c)
	{
		c.addEventListener("touchstart",JoyTouchStart,false);
//		c.addEventListener("touchmove",YeahScience,true);
		c.addEventListener("touchend",JoyTouchEnd,false);

	//	for (i = 50; i < 200;i += 40) { GetJoystickSegment (i,200-(i/2)); }

		var ctx=c.getContext("2d");
		ctx.beginPath();
//		ctx.arc(JoystickCX,JoystickCY,JoystickRadius,Math.PI*1.9,Math.PI*0.1);
		ctx.arc(JoystickCX,JoystickCY,JoystickRadius,Math.PI*0.15,Math.PI*0.35);
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(JoystickCX,JoystickCY,JoystickDeadZone,0,2*Math.PI);
		ctx.stroke();
		ctx.closePath();
		
		for (i = 0; i < JoystickButton.length; i += 2)
		{
			bx = JoystickButton[i];
			by = JoystickButton[1+i];
			ctx.beginPath();
			ctx.arc(bx,by,JoystickButtonRadius,0,2*Math.PI);
			ctx.stroke();
			ctx.fill();
			ctx.closePath();
		}

		
		ctx.beginPath();

		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX+92,JoystickCY-38);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX+38,JoystickCY-92);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX-92,JoystickCY-38);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX-38,JoystickCY-92);

		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX+92,JoystickCY+38);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX+38,JoystickCY+92);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX-92,JoystickCY+38);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX-38,JoystickCY+92);


//		ctx.moveTo(JoystickCX,JoystickCY);
//		ctx.lineTo(JoystickCX+87,JoystickCY-48);
//		ctx.moveTo(JoystickCX,JoystickCY);
//		ctx.lineTo(JoystickCX-87,JoystickCY-48);
//		ctx.moveTo(JoystickCX,JoystickCY);
//		ctx.lineTo(JoystickCX+87,JoystickCY+48);
//		ctx.moveTo(JoystickCX,JoystickCY);
//		ctx.lineTo(JoystickCX-87,JoystickCY+48);



		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX+35,JoystickCY+35);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX-35,JoystickCY+35);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX+35,JoystickCY-35);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX-35,JoystickCY-35);

		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX+0,JoystickCY+70);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX+0,JoystickCY-70);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX+70,JoystickCY);
		ctx.moveTo(JoystickCX,JoystickCY);
		ctx.lineTo(JoystickCX-70,JoystickCY);

		ctx.stroke();		
		
	}
	else {	console.write ("no joystick"); }
}

function Spectrum_InitCanvas (container_div_id)
{
	var cvs;

	cvs = document.createElement("canvas");
	cvs.className ="zx_canvas";
	cvs.id = ZX_CANVAS_ID;			//"zx_cvs" + Math.floor (Math.random() * 1000);		// random layer name for now.
	cvs.width = 256;	//"256px";	//cvs.width;
	cvs.height= 192;	//"192px";	//cvs.height;
	cvs.style.zIndex = 0;

	div = document.getElementById (container_div_id);
	div.appendChild(cvs);

	screenCanvas = cvs;	// not sure if this is needed

	screenCanvasCtx = screenCanvas.getContext('2d');
	screenImgData = screenCanvasCtx.getImageData(0, 0, cvs.width, cvs.height);

	screenBuf8 = new Uint8ClampedArray (screenImgData.data.buffer);
	screenData = new Uint32Array (screenImgData.data.buffer);
}

function SpectrumInit (container_div_id)
{
		// call here to initialise the spectrum emulator.


	CreateScreenRowTable();

	Spectrum_InitCanvas (container_div_id);

	KeyEventsInit();

	LoadRom();

	EmulateSpectrum();

}

function Spectrum_Pause (true_or_false)
{
	PauseEmulation = true_or_false;
}

function Spectrum_Reset()
{
	MyZ80.Reset();
}

function Spectrum_SetPC (addr)
{
	MyZ80.PC = addr;
}

function Spectrum_LoadRawTap(uint8_buffer)
{
	// NOTE : NOT WORKING *** UNDER CONSTRUCTION ... CBA RIGHT NOW !!
	
	
	// tap format
	//
	//	+------------------+
	//	|	block length   +
	//	+------------------+
	//	|	block type     |
	//	+------------------+
	//	|	               |
	//	|	block data     |
	//	|	               |
	//	|	               |
	//	+------------------+
	//	|	 checksum      |
	//	+------------------+
	//	:	 next block	   :
	//
	//
	//
	
	// block format:
	// 0.1 			block length ( = flag byte + n bytes + checksum byte)
	// 2			flag byte. 0 = tape header, 255 = data
	// 3...			n bytes of data  (rest of block, either header or data)
	// last byte	checksum

	// header block (tape header)
	//	byte  length	info
	//	0		1		block type (0,1,2 or 3)
	//						0 = Program
	//						1 = Number Array
	//						2 = Character Array
	//						3 = Code /Data File
	//  1	   10		filename (10 characters, padded with blanks)
	//	11		2		length of data block
	//	13		2		param 1
	//	15		2		param 2

	// block type : program
	//		param 1 = autostart line number or >= 32768 if no line given.
	//		param 2 = start of variables area
	
	// block type : code 
	//		param 1 = start of the code block when saved
	//		param 2 = 32768

	var p;
	var block_length;
	var block_flag_byte;
	
	var header_type;
	var filename;
	var f;
	
	var header_info_byte;

	p = 0;
	while (p < uint8_buffer.length)
	{
		block_length = uint8_buffer[p] + (uint8_buffer[p+1]*256);
		console.log ("block length:" + block_length);
		p += 2;
	
		block_flag_byte = uint8_buffer[p];
		console.log ("block type:" + block_flag_byte);
		p++;

		switch (block_flag_byte)
		{
			case 0:		// header block
					console.log ("header");
					header_type = uint8_buffer[p];
					p++;
					
					filename="";
					for (f = 0; f < 10; f++)
					{
						filename = filename + String.fromCharCode (uint8_buffer[f+p]);
					}
					console.log ("filename:");
					console.log (filename);
					break;
			case 1:
			default:	console.log ("Spectrum_LoadRawTap:unknown block type");
				return;
		}
		
		p += block_length;
	}
}

