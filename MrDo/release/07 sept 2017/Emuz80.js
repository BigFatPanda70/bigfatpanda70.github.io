/* ****************************************************************

	Title	:	Port of z80 emulator written in Jthis.AVthis.A

	Version	:	0.0	20th February 2017
				0.1 26th March 2017

	this.Author	:	Nick Fleming

	Updated	:	27th March 2017

	 Notes:
	-------
		This program started as a port of my z80 emulator code that was 
	written to implement a sinclair spectrum in java.

	1)	It's not expected to be fast .. 

	 20th February 2017
	---------------------
		Import of the java source file and look at what needs to be
	done to convert the code. Hopefully most of it will not need
	a total rewrite.

	 To Use:
	---------
			include script.

		create a javacsript object.

	var MyZ80 = new Z80();

	 22nd February 2017
	--------------------
		Converting code.. mostly adding 'this.' infront of everything.

	 26th March 2017
	-----------------
		Adding support for undocumented flags to pass some 
	zexall z80 instruction tests - mostly by setting bits 3 and 5
	using a simple statement such as :
			this.F = (this.F & 0xD7) | (this.H & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm

		RRD and RLD instructions fixed (they have NEVER worked before!!)

	 27th March 2017
	------------------
	
	<adc,sbc> hl, <bc,de,hl,sp>		ok
	add hl,<bc,de,hl,sp>			ok
	add ix,<bc,de,hl,sp>			ok
	add iy,<bc,de,hl,sp>			ok
	aluop a,nn						FAIL
	aluop a,<b,c,d,e,h,l,(hl),a>	FAIL
	aluop a,(ixh,ixl,iyh,iyl>		FAIL
	aluop a,(<ix,iy>+1)				FAIL
	bit n,(<ix,iy>+1)				FAIL
	bit n,<b,c,d,e,h,l,(hl),a>		FAIL
	cpd <r>							FAIL
	cpi <r>							FAIL
	<daa, cpl,scf,ccf>				FAIL
	<inc,dec> a					ok
	<inc,dec> b					ok
	<inc,dec> bc				ok
	<inc,dec> c					ok
	<inc,dec> d					ok
	<inc,dec> de				ok
	<inc,dec> e					ok
	<inc,dec> h					ok
	<inc,dec> hl				ok
	<inc,dec> ix				ok
	<inc,dec> iy				ok
	<inc,dec> l					ok
	<inc,dec> (hl)
	<inc,dec> sp				ok
	<inc,dec> (<ix,iy>+1)
	<inc,dec> ixh				ok
	<inc,dec> ixl				ok
	<inc,dec> iyh				ok
	<inc,dec> iyl				ok
	ld <bc,de>,(nnnn)			ok
	ld hl,(nnnn)				ok
	ld sp,(nnnn)				ok
	ld <ix,iy>,(nnnn)			ok
	ld (nnnn),<bc,de>			ok
	ld (nnnn),hl				ok
	ld (nnnn),sp				ok
	ld (nnnn),<ix,iy>			ok
	ld (bc,de,hl,sp>nnnn		ok
	ld <ix,iy>,nnnn				ok
	ld a,<(bc),(de)>
	ld <b,c,d,e,h,l,(hl),a>,nn	ok
	ld (<ix,iy>+1),nn
	ld <b,c,d,e>, (<ix,iy>+1)
	ld <h,l>,(<ix,iy>+1)
	ld a,(<ix,iy>+1)
	ld <ixh,ixl,iyh,iyl>,nn		ok
	ld <bcdehla>,<bcdehla>		FAIL !!!
	ld <bcdexya>,<bcdexya>		FAIL !!!
	ld a,(nnnn) / ld (nnnn),a	ok
	ldd <r>	(1)
	ldd <r> (2)
	ldi <r> (1)
	ldi <r> (2)
	neg
	<rrd,rld>
	<rlca,rrca,rla,rra>
	shf/rot (<ix,iy>+1)
	shf/rot <b,c,d,e,h,l,(hl),a>
	<set,res> n,<bcdehl(hl)a>
	<set,res> n,(<ix,iy>+1)
	ld (<ix,iy>+1),<b,c,d,e>
	ld (<ix,iy>+1),<h,l>
	ld (<ix,iy>+1),a
	ld (<bc,de>),a

	
	about 67 tests.. most FAIL


	 30th March 2017
	------------------
		modified inc and dec code.. so more instructions pass.
		
************************************************************** */

//package mypackage;

// Z80 Chip Emulator 
// Version 1.0 20th November 2012
// this.Author Nick Fleming.
// Last Updated: 12th December 2012

// This will be the basic z80 emulator source code
// written in java so I can use it on the blackberry.

// web references : all over :
// http://xpectrum.googlecode.com/svn-history/r30/trunk/src/cpu/
// http://matt.west.co.tt/spectrum/jsspeccy/
// http://www.z80.info/z80sflag.htm
// http://www.z80.info/opcodes.txt
// http://www2.sys-con.com/itsg/virtualcd/java/archives/0707/surdulescu/index.html

// 20/11/12
// the main initial problem will be how to properly manage
// bytes, as java's byte handling is a bit poor.

// 12/12/12 
// .. looking at the code to see where I go from here.. 
// need to get the ix,iy instructions in 
// and also need to look at doing interrupt support.
// once that is done I can start to 'build' the emulator proper I think.


// half carry solution ?? http://www.spuify.co.uk/?p=220
// and http://www.retrogames.com/cgi-bin/wwwthreads/showpost.pl?Board=retroemuprog&Number=3997&page=&view=&mode=flat&sb=
// e.g
// 		tmp = this.A;
//		this.A++;
//		half_carry = ((this.A+1)^1)^this.A() & 0x10;

// 

// flags reg:
// bit	7		sign
// 		6		zero
//		5		
//		4		half carry
//		3		
//		2		parity/overflow
//		1
//		0		carry

// 22nd November 2012:
// have decided to use integers in place of bytes
// also decided not to use a table based approach, to keep the overall memory
// footprint small - a 64k table is a big deal on a small memory system !

// parity/overflow flag (P/V) 
// (from Rodney Zaks)
//  Parity: count the total number of ones in the result.
//  if this result is odd, the parity bit will be 0
//	if this result is even, the parity bit will be 1

// hmm.. looking around at parity calculations.. table based approach is best way
// to go it seems.. other emulators have come to the same conclusion so gonna do ONE
// little table at least !!.

// 19th January 2013 - having a look at the code so far.

// might need some sort of debugger tool at some point to test all this.
// front panel display !!! lol

// 6th February 2013
// - adding code to return the length of the instruction at the program counter.
// hopefully useful for disassembly / single stepping.

// 11th February 2013	- adding more instructions

// 17th February 2013:
//		adding t-state information, a few more instructions
//		rewriting ldir and lddr so that an interrupt can occur
//		in the middle of them.
//		halt modified to repeat and do nothing..
//		.. sort of got the 'start interrupt' stuff sorted out too..
//		.. almost done.. just got all the ix and iy instructions to do...sigh.

//	To Do : (as of 17th Feb 2013)
//		IN this.A,(n)
//		IN r,(C)
//		OUT (C),r
//		OUT (n),this.A

//		// and some obscure less used ones: (by me anyway).
//	CPI INI OUTI CPD IND OUTD CPIR CPDR INDR INIR OTDR OTIR 

//	20th Feb - found SBC HL,DE not implemented !! shocked !!!
//	.. in fact quite a few common EDxx instructions missing such as LD (nm),DE
// .. and ld (nn),hl.. cannot believe i missed that one !

// 23rd Feb : still more missing instructions.. so many its so easy to miss.. xor n, and or n
// 	this is a hard project in that there is a *lot* of things to keep track of.

// 27th Feb 2013:
// revisiting IX and IY instructions as opcodes such as ld L, (ix+d) are not working.
// notice that only instructions using (hl) have a displacement when ix is used so 
// modifying code to reflect this (hopefully). - UNDER CONSTRUCTION !! NOT FINISHED

// 14th March 2013:
// running the test file, comparing step by step with fuse.. discover error with half carry flag
// for cp instructions ... ld a,1 cp 1 would set the half carry - fixed. also fixed n flag to 1 for cp instructions.

// 19th March 2013:
//		Off work (ill & bad back) - look at getting Dthis.Athis.A instruction tested/working.. bugs fixed.

// TO DO (KEYBOthis.ARD) 19th/March/2013
// ... need to rewrite the keyboard inputs slightly - as I've done it slightly wrong.
// http://www.nvg.ntnu.no/sinclair/faq/tech_48.html
// my version assumes the high byte will only read in set of five keys, where in reality
// any zero bit in the high byte will return that row of keys - if more than one row is
// selected the result is the and of all single inputs.

var z80_flags_table = [256];		// tiny table for 'fast' sign, zero and parity calculation.

		// from 'mastering machine code on your zx81' : 

var z80_InstructionLengthTable = [
			0x5F, 0x55, 0x55, 0xa5, 0x55, 0x55, 0x55, 0xa5,
			0xaF, 0x55, 0x55, 0xa5, 0xa5, 0x55, 0x55, 0xa5,
			0xaF, 0xF5, 0x55, 0xa5, 0xa5, 0xF5, 0x55, 0xa5,
			0xaF, 0xF5, 0x99, 0xE5, 0xa5, 0xF5, 0x55, 0xa5,
			0x55, 0x55, 0x55, 0x95, 0x55, 0x55, 0x55, 0x95,
			0x55, 0x55, 0x55, 0x95, 0x55, 0x55, 0x55, 0x95,
			0x55, 0x55, 0x55, 0x95, 0x55, 0x55, 0x55, 0x95,
			0x99, 0x99, 0x99, 0x59, 0x55, 0x55, 0x55, 0x95,
			0x55, 0x55, 0x55, 0x95, 0x55, 0x55, 0x55, 0x95,
			0x55, 0x55, 0x55, 0x95, 0x55, 0x55, 0x55, 0x95,
			0x55, 0x55, 0x55, 0x95, 0x55, 0x55, 0x55, 0x95,
			0x55, 0x55, 0x55, 0x95, 0x55, 0x55, 0x55, 0x95,
			0x55, 0xFF, 0xF5, 0xa5, 0x55, 0xFE, 0xFF, 0xa5,
			0x55, 0xfa, 0xF5, 0xa5, 0x55, 0xfa, 0xF5, 0xa5,
			0x55, 0xF5, 0xF5, 0xa5, 0x55, 0xF5, 0xfa, 0xa5,
			0x55, 0xF5, 0xF5, 0xa5, 0x55, 0xF5, 0xF5, 0xa5
	];
	
var z80_keyboard_port_table =		// FE, FD, FB, F7, EF, DF, BF, 7F
	[
			0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff
	];

var z80_tstates_table =		// ( have no idea how accurate this is !!)
	[
			4,	10,	7,	6,	4,	4,	7,	4,	4,	11,	7,	6,	4,	4,	7,	4,		// 00
			8,	10,	7,	6,	4,	4,	7,	4,	12,	11,	7,	6,	4,	4,	7,	4,		// 10
			12,	10,	16,	6,	4,	4,	7,	4,	12,	11,	16,	6,	4,	4,	7,	4,		// 20
			12,	10,	13,	6,	11,	11,	10,	4,	12,	11,	13,	6,	4,	4,	7,	4,		// 30
			4,	4,	4,	4,	4,	4,	7,	4,	4,	4,	4,	4,	4,	4,	7,	4,		// 40
			4,	4,	4,	4,	4,	4,	7,	4,	4,	4,	4,	4,	4,	4,	7,	4,		// 50
			4,	4,	4,	4,	4,	4,	7,	4,	4,	4,	4,	4,	4,	4,	7,	4,		// 60
			7,	7,	7,	7,	7,	7,	4,	7,	4,	4,	4,	4,	4,	4,	7,	4,		// 70
			4,	4,	4,	4,	4,	4,	7,	4,	4,	4,	4,	4,	4,	4,	7,	4,		// 80
			4,	4,	4,	4,	4,	4,	7,	4,	4,	4,	4,	4,	4,	4,	7,	4,		// 90
			4,	4,	4,	4,	4,	4,	7,	4,	4,	4,	4,	4,	4,	4,	7,	4,		// this.A0
			4,	4,	4,	4,	4,	4,	7,	4,	4,	4,	4,	4,	4,	4,	7,	4,		// B0
			11,	10,	10,	10,	17,	11,	7,	11,	11,	10,	10,	8,	17,	17,	7,	11,		// C0	NOTE CB Default set to 8.
			5,	10,	10,	11,	17,	11,	7,	11,	5,	4,	10,	11,	17,	0,	7,	11,		// D0
			11,	10,	10,	19,	17,	10,	7,	11,	11,	4,	10,	4,	10,	0,	7,	11,		// E0
			11,	10,	10,	4,	17,	10,	7,	11,	11,	10,	10,	4,	17,	0,	7,	11		// F0
	];

var z80_cycles_table =		// not yet used !! 
	[
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0
	];

var z80_prefix_table =		// table to determine which ix,iy instructions have a prefix after the opcode.
	[
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	// 00
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	// 10
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	// 20
			0,	0,	0,	0,	1,	1,	1,	0,	0,	0,	0,	0,	0,	0,	0,	0,	// 30
			0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	1,	0,	// 40
			0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	1,	0,	// 50
			0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	1,	0,	// 60
			1,	1,	1,	1,	1,	1,	0,	1,	0,	0,	0,	0,	0,	0,	1,	0,	// 70
			0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	1,	0,	// 80
			0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	1,	0,	// 90
			0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	1,	0,	// a0
			0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	1,	0,	// b0
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	// c0
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	// d0
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	// e0
			0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0	// f0
	];

function z80_SetFlagsTable()
{
			// fast parity : http://www-graphics.stanford.edu/~seander/bithacks.html#ParityParallel

	var lp;
	var q;
	
	for (lp = 0; lp < 256; lp++)
	{
		q = lp;
		q ^= (q>>4);
		q &= 0xf;
		q = (0x6996 >> q) & 1;
		z80_flags_table[lp] = (lp & 0xa8) | (q<<2);		// TO DO : check this is the right way round.
	}
	z80_flags_table[0] = 0x40;		// only zero has the zero flag set !!
}

function Z80 ()
{
	var lp;

	this.IX = 0;
	this.IY = 0;
	this.A = 0;
	this.F = 0;
	this.B = 0;
	this.C = 0;
	this.D = 0;
	this.E = 0;
	this.H = 0;
	this.L = 0;

	this.HL = 0;		// 16 bit hl value for (hl) instructions.
	this.SP = 0;
	this.I = 0;
	this.R = 0;
	this.PC = 0;
	
	this.A_ = 0;		// alternate register set.
	this.F_	= 0;
	this.BC_ = 0;
	this.DE_ = 0;
	this.HL_ = 0;

		//	boolean disable_interrupts = true;
	this.interrupts_on = true;

		// some flags registers - stored separately, only merged together when
		// the 'this.AF' instructions are used. Don't actually need them to be stored
		// together most of the time

	this.s = 0;			// sign flag (copy of msb of result)
	this.z = 0;			// zero flag : set if the value is zero.
	this.f5 = 0;			// undocumented flag
	this.hc = 0;			// half carry
	this.f3 = 0;			// undocumented flag
	this.pv = 0;			// parity or overflow.
	this.n = 0;			// set if last operation was a subtraction
	this.c = 0;			// carry flag

	this.t_states = 0;	// timing states of last instruction executed (approx)
	this.cycles = 0;		// machine cycles.

	this.iff1 = 0;		// interrupt flag things.
	this.iff2 = 0;
	this.interrupt_mode = 0;

//	this.mem = [65536];		// using integers !! (less messing about that with bytes).
	this.mem = new Uint8ClampedArray(65536);
	for (lp = 0; lp < 65536; lp++)
	{
		this.mem[lp] = 0;
	}
	
	z80_SetFlagsTable();
}	

Z80.prototype.Reset = function ()
{
		var lp;

		this.IX = 0;
		this.IY = 0;
		this.A = 0;
		this.F = 0;
		this.B = 0;
		this.C = 0;
		this.D = 0;
		this.E = 0;
		this.H = 0;
		this.L = 0;
		this.SP = 0;
		this.I = 0;
		this.R = 0;
		this.PC = 0;

		this.A_ = 0;		// alternate register set.
		this.F_	= 0;
		this.BC_ = 0;
		this.DE_ = 0;
		this.HL_ = 0;
		this.iff1 = 0;
		this.iff2 = 0;
		this.interrupt_mode = 0;
		
		this.s = 0;			// sign flag (copy of msb of result)
		this.z = 0;			// zero flag : set if the value is zero.
		this.f5 = 0;			// undocumented flag
		this.hc = 0;			// half carry
		this.f3 = 0;			// undocumented flag
		this.pv = 0;			// parity or overflow.
		this.n = 0;			// set if last operation was a subtraction
		this.c = 0;			// carry flag

		this.t_states = 0;	// timing states of last instruction executed (approx)
		this.cycles = 0;		// machine cycles.

		this.iff1 = 0;		// interrupt flag things.
		this.iff2 = 0;
		this.interrupt_mode = 0;

			// should a reset clear memory ???
//		for (lp = 0; lp < 65536; lp++)
//		{
//			this.mem[lp] = 0;
//		}
		
}

Z80.prototype.InstructionLength = function (mem_index)
{
	// returns the length in bytes of the instruction add the address index specified
	// hopefully useful for debugging.

	// Based on the disassembly chapter from 'mastering machine code on your zx81'
		
	// corrections and notes about robustness here : www.users.waitrose.com/~thunor//mmcoyzx81/chapter16.html

	var op;
	var i;
		
	var ddfd;
	var len;
		
	var mm;
		
	mm = mem_index & 0xffff;
	
	op = this.mem[mm] & 0xff;

	if (op == 0xCB)	return 2;	// all instructions starting cb are 2 bytes long.
		
	ddfd = 0;
	len = 0;

	while ((op == 0xDD) || (op == 0xFD))
	{
		ddfd++;
		mm++; mm &= 0xffff;
		op = this.mem [mm]; 
		if (len == 4)	return len;		// exit on possible error (reading garbage).
	}

	if (op == 0xED)
	{
				// doesnt work for ED47, ED43 or ED53
		mm++; mm &= 0xffff;
		op = this.mem [mm];
		len = 2;
		if ((op & 0xc7) == 0x43)	len = 4;
		return len;
	}

	i = op >> 1;
	len = z80_InstructionLengthTable[i];
	if ((op & 1) == 0) len = len >> 4;		// select nibble
	if (ddfd != 0) len = len >> 2;			// select which 2 bits.
	len = len & 0x03;
	if (ddfd != 0)	len++;
	return len;
}


Z80.prototype.StartMaskableInterrupt = function()
{
		// http://www.smspower.org/Development/InterruptMechanism	- non maskable ints not used on standard spectrum
		
		// from http://www.worldofspectrum.org/faq/reference/z80reference.htm
		// coincidentally(?) im 0 calls the same as im 1 due to hardware set up.
		// (assuming no additional hardware is attached)

	var idx;

	if (this.interrupts_on == false)		return;		// nothing to do if interrupts are disabled.

//		interrupts_on = false;		// dont allow any further interrupts (until EI is executed).

	if (this.mem[this.PC] == 0x76)
	{
		// pc is currently halted, so need to advance pc on one byte so that program continues
		// after interrupt is called.
		this.PC++;	this.PC &= 0xffff;
	}

	this.iff1 = 0;
	this.iff2 = 0;
	
	// push current program counter onto stack (same as call)

	this.SP--; this.SP&=0xffff; this.mem[this.SP]=(this.PC>>8)&0xff; this.SP--; this.SP&=0xffff; this.mem[this.SP]=this.PC&0xff;

	if (this.interrupt_mode != 2)
	{
			// effectively execute a RST 0x38 instruction

			// set the program counter to this new address.
		this.PC = 0x38;
		this.t_states = 13;
		return;
	}
		
			// must be interrupt mode 2
	idx = ((this.I << 8) + 0xff) & 0xffff;		// for now, just assuming low byte is ff (hardware default)

	this.PC = (this.mem[idx++]<<8);	idx &= 0xffff;
	this.PC += (this.mem[idx]) & 0xff;
	this.t_states = 19;
}

Z80.prototype.RETN = function()
{
		// done here so emulator can start after .sna file load.
	this.iff1 = this.iff2;
	this.PC = this.mem[this.SP] & 0xff;
	this.SP++;	this.SP &= 0xffff;
	this.PC = (this.PC + (this.mem[this.SP]<<8)) & 0xffff;
	this.SP++;	this.SP &= 0xffff;
	this.t_states = 14; cycles = 4;
}


Z80.prototype.EmZ80 = function()
{
	var b;
	var tmp;
	var c_tmp;
	var idx;
	var idx2;
	var lp;

	var d;		// displacement for HL,IX and IY  instructions.
	var tmp_h;	// temp stores for H and L when implementing IX & IY instructions.
	var tmp_l;
	var prefix;	// 0 = no prefix, 1 = DD, 2 = FD

		// start by getting the byte at the current program counter.
		// this is the 'opcode'.

		b = this.mem[this.PC] & 0xff;

		// update the program counter, wrapping round if top of memory reached.
		this.PC = (this.PC + 1) & 0xffff;

		this.R = (this.R+1)&0xff;	// increment 'R' register.

			// get default timing values for this instruction.
		this.t_states = z80_tstates_table [b];
		this.cycles = z80_cycles_table[b];

		tmp_h = this.H;		// two lines to shut java eclipse up.
		tmp_l = this.L;

		d = 65536;					// default displacement is 65536 (not used).
		prefix = 0;				//  0 for most instructions, dd or fd for index register instructions.
		this.HL = ((this.H<<8) + this.L) & 0xffff;		// used for memory addressing modes (hl) and (ix+d)
//womble
		if ((b == 0xdd) || (b == 0xfd))
		{
			prefix = b;		// store prefix for (much) later use

			// The rules : (from z80-documented)
			// any instruction prefixed by DD replaces HL with IX unless:
				// the instruction is EX DE,HL or EXX
				// Instructions prefixed by ED use HL.

			// any access to (HL) is changed to (IX+d) except jp (hl)  which is just a jump to address hl
			// jp(hl) becomes jp(ix).
			
			// any access to H is treated as an access to IXh except if (ix+d) is used as well
			// any access to L is treated as an access to IXl except if (ix+d) is used as well

			// ref : http://www.z80.info/decoding.htm#dd
				// get next byte to help decide how to proceed.
			b = this.mem[this.PC] & 0xff;

			if ((b == 0xEB) || (b == 0xD9) || (b == 0xED) || (b == 0xDD) || (b == 0xFD))
			{
				// if its a prefix (ED,DD,FD) or ex de,hl or exx treat the original dd or fd prefix as a nop.
				this.t_states = 4;
				this.cycles = 1;
				return;
			}

			this.PC = (this.PC + 1) & 0xffff;

			if (b != 0xCB)
			{
				// deal with everything except CB instructions - they are handled by the cb code later..
//				d = mem [this.PC];		// get the prefix (if it exists)
//				this.PC = (this.PC + prefix_table[b]) & 0xffff;	// skip over the prefix 
//				HL = (IX + d) & 0xffff;
				if (z80_prefix_table[b] == 1)
				{
					// displacement is used, so registers H and L are unchanged.
					d = this.mem[this.PC++];	 this.PC &= 0xffff;		// get the displacement (always 3rd byte of instruction
					if (d >= 0x80)	d |= 0xffff00;	// quick sign extend d
//					if (tmp >= 0x80)	tmp |= 0xffff00;	// quick sign extend
					if (prefix == 0xDD)
					{
						this.HL = (this.IX + d) & 0xffff;				// HL is modified to use IX+d or IY+d
					}
					else
					{
						this.HL = (this.IY + d) & 0xffff;
					}
				}
				else
				{
						// any instruction that uses H or L is replaced by IX or IY
		 			tmp_h = this.H;
					tmp_l = this.L;
					if (prefix == 0xDD)
					{
						this.H = (this.IX >> 8) & 0xff;
						this.L = this.IX & 0xff;
					}
					else
					{
						this.H = (this.IY >> 8) & 0xff;
						this.L = this.IY & 0xff;
					}
				}
			}

			this.t_states = z80_tstates_table [b];
			this.cycles = z80_cycles_table[b];


// 			tmp_h = H;
//			tmp_l = L;
//			if (prefix == 0xDD)
//			{
//				H = (IX >> 8) & 0xff;
//				L = IX & 0xff;
//			}
//			else
//			{
//				H = (IY >> 8) & 0xff;
//				L = IY & 0xff;
//			}

			
		}
		
		// decode oPCode using big case statement - this should be fairly efficient
		// as java should generate a jump table for it (not convinced)!

		if ( ((b & 0xC0) == 0x40) && (b != 0x76))
		{
			// instruction is of the type ld r,r
			tmp = 0;
			t_states = 4;
			cycles = 1;
			switch (b & 7)
			{
				case 0:	tmp = this.B; break;
				case 1:	tmp = this.C; break;
				case 2:	tmp = this.D; break;
				case 3:	tmp = this.E; break;
				case 4:	tmp = this.H; break;
				case 5:	tmp = this.L; break;//				case 6:	tmp = mem [ ((H&0xFF)<<8) | (L&0xFF)]; t_states = 7; cycles = 2;	break;
//				case 6:	tmp = mem [ ((H&0xFF)<<8) + (L&0xFF) + d]; t_states = 7; cycles = 2; prefix_skip = 1;	break;
//				case 6:	tmp = mem [ ((H&0xFF)<<8) + (L&0xFF) + d]; t_states = 7; cycles = 2; break;
				case 6:	tmp = this.mem[this.HL]; t_states = 7; cycles = 2; break;
				case 7:	tmp = this.A; break;
				default:	break;
			}
			switch ((b>>3) & 7)
			{
				case 0: this.B = tmp;	break;
				case 1: this.C = tmp;	break;
				case 2: this.D = tmp;	break;
				case 3: this.E = tmp;	break;
				case 4: this.H = tmp;	break;
				case 5: this.L = tmp;	break;

					// CARE !! possible HALT instruction	- not handled here.
				case 6:
					//mem [ ((H&0xFF)<<8) | (L&0xFF)] = tmp;	t_states = 7; cycles = 2; break;
//					mem [ ((H&0xFF)<<8) + (L&0xFF) + d] = tmp;	t_states = 7; cycles = 2; prefix_skip = 1; break;
//					mem [ ((H&0xFF)<<8) + (L&0xFF) + d] = tmp;	t_states = 7; cycles = 2; break;
					this.mem[this.HL] = tmp;	this.t_states = 7; this.cycles = 2; break;

				case 7: this.A = tmp;	break;
			}
			
				// copy of prefix cleanup code to handle undocumented ix/iy instructions.
			if ((prefix != 0) && (d == 65536))
			{
				if (prefix == 0xDD)
				{
					this.IX = ((this.H<<8)+this.L) & 0xffff;
				}
				if (prefix == 0xFD)
				{
					this.IY = ((this.H<<8)+this.L) & 0xffff;
				}
				this.H = tmp_h;
				this.L = tmp_l;
			}

			return;		
		}
		
		if (b == 0xED)
		{
			// ED prefix.

// 			ED40		IN B,(C)
//			ED41		OUT (C),B
//			ED42		SBC HL,BC
//			ED43 n n	LD (nn),BC
//			ED44		NEG
//			ED45		RETN
//			ED46		IM 0
//			ED47		LD I,this.A
//			ED48		IN C,(C)
//			ED49		OUT (C),C
//			ED4this.A		this.ADC HL,BC
//			ED4B n n	LD BC,(nn)
//			ED4C		NEG*
//			ED4D		RETI
//			ED4E		IM 0*
//			ED4F		LD R,this.A
//			ED50		IN D,(C)
//			ED51		OUT (C),D
//			ED52		SBC HL,DE
//			ED53 n n	LD (nn),DE
//			ED54		NEG*
//			ED55		RETN*
//			ED56		IM 1
//			ED57		LD this.A,I
//			ED58		IN E,(C)
//			ED59		OUT (C),E
//			ED5this.A		this.ADC HL,DE
//			ED5B n n	LD DE,(nn)
//			ED5C		NEG*
//			ED5D		RETN*
//			ED5E		IM 2
//			ED5F		LD this.A,R
//			ED60		IN H,(C)
//			ED61		OUT (C),H
//			ED62		SBC HL,HL
//			ED63 n n	LD (nn),HL
//			ED64		NEG*
//			ED65		RETN*
//			ED66		IM 0*
//			ED67		RRD
//			ED68		IN L,(C)
//			ED69		OUT (C),L
//			ED6this.A		this.ADC HL,HL
//			ED6B n n	LD HL,(nn)
//			ED6C		NEG*
//			ED6D		RETN*
//			ED6E		IM 0*
//			ED6F		RLD
//			ED70		IN F,(C)* / IN (C)*
//			ED71		OUT (C),0*
//			ED72		SBC HL,this.SP
//			ED73 n n	LD (nn),this.SP	
//			ED74		NEG*
//			ED75		RETN*
//			ED76		IM 1*
//			ED78		IN this.A,(C)
//			ED79		OUT (C),this.A
//			ED7this.A		this.ADC HL,this.SP
//			ED7B n n	LD this.SP,(nn)
//			ED7C		NEG*
//			ED7D		RETN*
//			ED7E		IM 2*
//			EDthis.A0		LDI
//			EDthis.A1		CPI
//			EDthis.A2		INI
//			EDthis.A3		OUTI
//			EDthis.A8		LDD
//			EDthis.A9		CPD
//			EDthis.Athis.A		IND
//			EDthis.AB		OUTD
//			EDB0		LDIR
//			EDB1		CPIR
//			EDB2		INIR
//			EDB3		OTIR
//			EDB8		LDDR
//			EDB9		CPDR
//			EDBthis.A		INDR
//			EDBB		OTDR
		
			b = this.mem[this.PC];	this.PC = (this.PC + 1) & 0xffff;
			switch (b)
			{
					// in r,(c)	(B<<8)+C = port address.
				case 0x40:	// in b,(c)
				case 0x48:	// in c,(c)
				case 0x50:	// in d,(c)
				case 0x58:	// in e,(c)
				case 0x60:	// in h,(c)
				case 0x68:	// in l,(c)
				case 0x70:		// undocumented !!
				case 0x78:		//in a,(c)

					this.t_states = 12;	cycles = 3;
					idx = 0;
					tmp = 0xff;		//0x1f;			// my value, not hardware accurate (0x1f = no keys pressed).
					if (this.C == 0xFE)
					{
						// keyboard reading port. ** UNDER CONSTRUCTION ** 
						idx = 0;
						c_tmp = this.B;
						while (c_tmp != 0xff)
						{
							if ((c_tmp & 1) == 0)	tmp &= z80_keyboard_port_table[idx];
							idx++;
							c_tmp = (c_tmp>>1) | 0x80;
						}
					}
					switch (b)
					{
							// in r,(c)	(B<<8)+C = port address.
						case 0x40:	this.B  = tmp;	break;	// in b,(c)
						case 0x48:	this.C  = tmp;	break;		// in c,(c)
						case 0x50:	this.D  = tmp;	break;		// in d,(c)
						case 0x58:	this.E  = tmp;	break;		// in e,(c)
						case 0x60:	this.H  = tmp;	break;		// in h,(c)
						case 0x68:	this.L  = tmp;	break;		// in l,(c)
						case 0x70:	break;	// result isnt stored anywhere according to http://www.z80.info/z80info.htm
						case 0x78:	this.A  = tmp;	break;			//in a,(c)
					}
//					t_states = 0;
//					this.PC -= 2;	this.PC &= 0xffff;	// for now we halt here
					break;
					
					// out (c),r
				case 0x41:	// out (c),b
				case 0x49:
				case 0x51:
				case 0x59:
				case 0x61:
				case 0x69:
				case 0x71:
				case 0x79:	// out (c),a
					
					this.t_states = 12;	this.cycles = 3;
					break;

				case 0x44:			// neg ** UNDER CONSTRUCTION
						// somewhere on the net says 'zaks got it wrong'
						// so just doing a simple 'neg' .
					this.hc = (0 - (this.A & 0x0f)) & 0x10;
					this.A  = (0 - this.A);
					this.c = (this.A>>8) & 1;			//	c = (this.A >> 16) & 1;
					this.A &= 0xff;
					this.F = z80_flags_table[this.A] | (this.A & 0x28) | this.hc | 0x02 | this.c ;		// N flag(2) is set.
					this.t_states = 8;
					this.cycles = 2;
					break;

				case 0x46:	// IM 0
					this.interrupt_mode = 0;
					this.t_states = 8;
					this.cycles = 2;
					break;
				case 0x56:	// IM 1
					this.interrupt_mode = 1;
					this.t_states = 8;
					this.cycles = 2;
					break;
				case 0x5E:	// IM 2
					this.interrupt_mode = 2;
					this.t_states = 8;
					this.cycles = 2;
					break;

				case 0x4D:	// RETI
					// does a 'pop' of the program counter.
					this.PC = this.mem[this.SP];
					this.SP++;	this.SP &= 0xffff;
					this.PC = (this.PC + (this.mem[this.SP]<<8)) & 0xffff;
					this.SP++;	this.SP &= 0xffff;
					this.t_states = 14; this.cycles = 4;
					break;
				case 0x45:	// retn
					this.RETN();
					break;

				case 0x4F:		// LD R,A	(flags not affected)
					this.R = this.A;	this.t_states = 9;	this.cycles = 2;
					break;
				case 0x5F:		// LD A,R
					this.A = (this.R&0xff);	this.t_states = 9;	this.cycles = 2;
					this.F = z80_flags_table[this.A] | (this.A & 0x28) | (this.iff2 << 2) | (this.F&1);		// sz flags set, hc = 0, N = 0, pv = iff2, carry unchanged
					break;
				case 0x47:		// LD I,A	(flags not affected)
					this.I = this.A;	this.t_states = 9;	this.cycles = 2;
					break;
				case 0x57:		// LD A,I
					this.A = this.I;	this.t_states = 9;	this.cycles = 2;
					this.F = z80_flags_table[this.A] | (this.A & 0x28) | (this.iff2 << 2) | (this.F & 1);	// as ld a,r 
					break;

				case 0xa0:		// LDI
					idx = ((this.H<<8) + this.L) & 0xffff;
					idx2 = ((this.D<<8) + this.E) & 0xffff;
					this.mem[idx2++] = this.mem[idx++];
					this.H = (idx>>8) & 0xff;
					this.L = idx & 0xff;
					this.D = (idx2>>8) & 0xff;
					this.E = idx2 & 0xff;

					this.F = (this.F & 0xE9);			// NOTE : NOT DONE UNDOCMENTED FLthis.AGS ON THIS ONE !!! 
					tmp = (this.B << 8) + this.C - 1;
					this.B = (tmp >> 8) & 0xff;
					this.C = tmp & 0xff;
					if (tmp != 0)	this.F |= 0x04;		// pv set if bc is not zero
					
					this.t_states = 16;
					this.cycles = 4;
					break;

				case 0xa8:		// LDD
					idx = ((this.H<<8) + this.L) & 0xffff;
					idx2 = ((this.D<<8) + this.E) & 0xffff;
					this.mem[idx2--] = this.mem[idx--];
					this.H = (idx>>8) & 0xff;
					this.L = idx & 0xff;
					this.D = (idx2>>8) & 0xff;
					this.E = idx2 & 0xff;

					this.F = (this.F & 0xE9);			// NOTE : NOT DONE UNDOCMENTED FLthis.AGS ON THIS ONE !!! 
					tmp = (this.B << 8) + this.C - 1;
					this.B = (tmp >> 8) & 0xff;
					this.C = tmp & 0xff;
					if (tmp != 0)	this.F |= 0x04;		// pv set if bc is not zero
					
					this.t_states = 16;
					this.cycles = 4;
					break;
	
				case 0xB0:		// LDIR
								// (DE)<-(HL); DE++; HL++; BC--; repeat
								// hf, p/v, n set to zero

					// Modified to do one byte transfer - this should enable interrupts
					// to correctly work when ldir is in operation.

					idx = ((this.H<<8) + this.L) & 0xffff;
					idx2 = ((this.D<<8) + this.E) & 0xffff;
					this.mem[idx2++] = this.mem[idx++];
					this.H = (idx >> 8) & 0xff;	this.L = idx  & 0xff;
					this.D = (idx2 >> 8)& 0xff;	this.E = idx2 & 0xff;
					lp = ((this.B << 8) + this.C - 1) & 0xffff;
					this.B = (lp >> 8) & 0xff;	this.C = lp & 0xff;

					this.t_states = 16;
					this.cycles = 4;
					this.F = this.F & 0xE9;		// set half carry, p/v and n to zero. 11101001					
					if (lp != 0)
					{
						this.t_states = 21;
						this.cycles = 5;
						this.PC = (this.PC - 2) & 0xffff;		// reset the program counter.
						this.F |= 0x04;					// pv set if bc is not zero (how the hell do you work this out !!!)
					}
					break;

				case 0xB8:		// LDDR
					// (DE)<-(HL); DE--; HL--; BC--; repeat
					// hf, p/v, n set to zero

					// Modified to do one byte transfer - this should enable interrupts
					// to correctly work when lddr is in operation.
					idx = ((this.H<<8) + this.L) & 0xffff;
					idx2 = ((this.D<<8) + this.E) & 0xffff;
					this.mem[idx2--] = this.mem[idx--];
					this.H = (idx >> 8) & 0xff;	this.L = idx  & 0xff;
					this.D = (idx2 >> 8)& 0xff;	this.E = idx2 & 0xff;
					lp = ((this.B << 8) + this.C - 1) & 0xffff;
					this.B = (lp >> 8) & 0xff;	this.C = lp & 0xff;

					this.t_states = 16;
					this.cycles = 4;
					this.F = this.F & 0xe9;		// set half carry, p/v and n to zero. 11101001
					if (lp != 0)
					{
						this.t_states = 21;
						this.cycles = 5;
						this.PC = (this.PC - 2) & 0xffff;		// reset the program counter.
						this.F |= 0x04;					// pv set if bc is not zero (how the hell do you work this out !!!)
					}

					break;

				case 0x4a:		// adc hl,bc
				case 0x5a:		// adc hl,de
				case 0x6a:		// adc hl,hl
				case 0x7a:		// adc hl,sp
					// FAILS ZEXDOC !
					// NOTE : PV FLAG IS NOT CALCULATED CORRECTLY.
					// HALF CARRY NOT TESTED (but looks right!)
					
					// womblewomble.
					tmp = 0;
					switch (b)
					{
						case 0x4a:	tmp = (this.B<<8)+this.C;	break;
						case 0x5a:	tmp = (this.D<<8)+this.E;	break;
						case 0x6a:	tmp = (this.H<<8)+this.L;	break;
						case 0x7a:	tmp = this.SP; break;
					}
					this.hc = ( ((this.H<<8)+this.L) & 0x0fff) + (tmp&0x0fff) + (this.F&1);
					this.hc = (this.hc>>8) & 0x10;

//					pv = ((this.A&0x7f) + (tmp & 0x7f) + c_tmp) & 0x80;	// get the carry in bit from bit 6 to bit 7.
					this.pv = ((((this.H<<8)+this.L)&0x7fff) + (tmp & 0x7fff) + (this.F&1)) & 0x8000;	// get the carry in bit from bit 14 to bit 15.
					
					tmp = ((this.H<<8) + this.L) + tmp + (this.F&1);

//					pv = (pv ^ ((this.A>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
					this.pv = (this.pv ^ ((tmp>>1)& 0x8000)) >> 13;		// xor with carry out to get correct overflow and shift into place
					
					this.H = (tmp>>8) & 0xff;
					this.L = tmp & 0xff;
						// flags set the hard way !! (grr!)
					this.F = (this.H & 0x80) | this.hc | this.pv | ((tmp>>16)&1);		// N flag (not set), carry from result, sign from high byte.
					if ((this.H|this.L) == 0) this.F |= 0x40;		// set the zero flag if this.HL = 0
					this.t_states = 15;	this.cycles = 4;

					this.F = (this.F & 0xD7) | (this.H & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
					
					break;

					// overflow : from zaks: the overflow flag will be set when :
					// there is a carry from bit 6 to bit 7 and no external carry
					// or when there is no carry from bit 6 to bit 7 but there is an external carry.
					// overflow flag set by xor'ing carry in and carry out of bit 7.


					
					
					
				case 0x42:		// sbc hl,bc
				case 0x52:		// sbc hl,de
				case 0x62:		// sbc hl,hl
				case 0x72:		// sbc hl,sp
						// NOTE : PV FLAG IS NOT CALCULATED CORRECTLY.
						// HALF CARRY NOT TESTED.
					tmp = 0;
					switch (b)
					{
						case 0x42:	tmp = (this.B<<8)+this.C;	break;		// sbc hl,bc
						case 0x52:	tmp = (this.D<<8)+this.E;	break;		// sbc hl,de
						case 0x62:	tmp = (this.H<<8)+this.L;	break;		// sbc hl,hl
						case 0x72:	tmp = this.SP; break;
					}
					this.hc = ( ((this.H<<8)+this.L) & 0x0fff) - (tmp&0x0fff) - (this.F&1);
					this.hc = (this.hc>>8) & 0x10;

					this.pv = ((((this.H<<8)+this.L)&0x7fff) - (tmp & 0x7fff) - (this.F&1)) & 0x8000;	// get the carry in bit from bit 14 to bit 15.

					tmp = ((this.H<<8) + this.L) - tmp - (this.F&1);
					
					this.pv = (this.pv ^ ((tmp>>1)& 0x8000)) >> 13;		// xor with carry out to get correct overflow and shift into place

					this.H = (tmp>>8) & 0xff;
					this.L = tmp & 0xff;
						// flags set the hard way !! (grr!)
					this.F = (this.H & 0x80) | this.hc | this.pv | ((tmp>>16)&1) | 0x02;		// N flag set, carry from result, sign from high bit of this.H.
					if ((this.H|this.L) == 0) this.F |= 0x40;		// set the zero flag if this.HL = 0
					this.t_states = 15;	this.cycles = 4;
					
					this.F = (this.F & 0xD7) | (this.H & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm

					break;

				case 0x4B:	// ld bc,(nn)
					tmp = this.mem[this.PC++];	this.PC &= 0xffff;
					tmp = (tmp + (this.mem[this.PC++]<<8)) & 0xffff;	this.PC &= 0xffff;
					this.C = this.mem[tmp++];	tmp &= 0xffff;
					this.B = this.mem[tmp];
					this.t_states = 20;	this.cycles = 6;
					break;
				case 0x5B:	// ld de,(nn)
					tmp = this.mem[this.PC++];	this.PC &= 0xffff;
					tmp = (tmp + (this.mem[this.PC++]<<8)) & 0xffff;	this.PC &= 0xffff;
					this.E = this.mem[tmp++];	tmp &= 0xffff;
					this.D = this.mem[tmp];
					this.t_states = 20;	this.cycles = 6;
					break;
				case 0x6B:	// ld hl,(nn)
					tmp = this.mem[this.PC++];	this.PC &= 0xffff;
					tmp = (tmp + (this.mem[this.PC++]<<8)) & 0xffff;	this.PC &= 0xffff;
					this.L = this.mem[tmp++];	tmp &= 0xffff;
					this.H = this.mem[tmp];
					this.t_states = 20;	this.cycles = 6;
					break;
				case 0x7B:	// ld sp,(nn)
					tmp = this.mem[this.PC++];	this.PC &= 0xffff;
					tmp = (tmp + (this.mem[this.PC++]<<8)) & 0xffff;	this.PC &= 0xffff;
					this.SP = this.mem[tmp++];	tmp &= 0xffff;
					this.SP = (this.SP + (this.mem[tmp]<<8)) & 0xffff;
					this.SP &= 0xffff;
					this.t_states = 20;	this.cycles = 6;
					break;

				case 0x43:	// ld (nn),bc
					tmp = this.mem[this.PC++]; this.PC &= 0xffff;
					tmp += (this.mem[this.PC++])<< 8;	this.PC &= 0xffff;
					this.mem[tmp++] = this.C;	tmp &= 0xffff;
					this.mem[tmp] = this.B;
					this.t_states = 20;	this.cycles = 6;
					break;
				case 0x53:	// ld (nn),de
					tmp = this.mem[this.PC++]; this.PC &= 0xffff;
					tmp += (this.mem[this.PC++])<< 8;	this.PC &= 0xffff;
					this.mem[tmp++] = this.E;	tmp &= 0xffff;
					this.mem[tmp] = this.D;
					this.t_states = 20;	this.cycles = 6;
					break;
				case 0x63:	// ld (nn),hl
					tmp = this.mem[this.PC++]; this.PC &= 0xffff;
					tmp += (this.mem[this.PC++])<< 8;	this.PC &= 0xffff;
					this.mem[tmp++] = this.L;	tmp &= 0xffff;
					this.mem[tmp] = this.H;
					this.t_states = 20;	this.cycles = 6;
					break;
				case 0x73:	// ld (nn),sp
					tmp = this.mem[this.PC++]; this.PC &= 0xffff;
					tmp += this.mem[this.PC++] << 8;	this.PC &= 0xffff;
					this.mem[tmp++] = this.SP & 0xff;	tmp &= 0xffff;
					this.mem[tmp] = (this.SP>>8)& 0xff;
					this.t_states = 20;	this.cycles = 6;
					break;

				case 0x6F:		// RLD	- what the hell is this used for anyway ???
				
				// The contents of the low-order four bits (bits 3, 2, 1, and 0) of the memory location (HL)
				// are copied to the high-order four bits (7, 6, 5, and 4) of that same memory location; the
				// previous contents of those high-order four bits are copied to the low-order four bits of the
				// Accumulator (Register A); and the previous contents of the low-order four bits of the
				// Accumulator are copied to the low-order four bits of memory location (HL). The contents
				// of the high-order bits of the Accumulator are unaffected.
				
					idx = ((this.H<<8)+this.L)&0xffff;
					tmp = ((this.mem[idx]<<4)&0xf0) | (this.A&0x0f);
					this.A = (this.A&0xf0) | ((this.mem[idx]>>4) & 0x0f);
					this.mem[idx] = tmp;	// ERROR THIS IS WRONG -> this.mem[tmp] = tmp;
					this.F = z80_flags_table[this.A&0xff] | (this.F&1) | (this.A & 28);
					this.t_states = 18;	this.cycles = 5;
					
					break;
				case 0x67:		// RRD
					idx = ((this.H<<8)+this.L)&0xffff;
					tmp = ((this.A<<4)&0xf0)+((this.mem[idx]>>4)&0x0f);
					this.A = (this.A&0xF0) + (this.mem[idx]&0x0f);
					this.mem[idx] = tmp;	// ERROR THIS IS WRONG -> this.mem[tmp] = tmp;
					this.F = z80_flags_table[this.A&0xff] | (this.F&1) | (this.A & 28);
					this.t_states = 18;	this.cycles = 5;
					break;

				case 0xa1:		// this.CPI	- also used by word games !!! - identical to this.CPD except HL gets incremented.
				case 0xa9:		// CPD	- used by word game.
						//ref : http://www.oocities.org/siliconvalley/peaks/3938/z80undoc3.txt

					idx = ((this.H<<8)+this.L) & 0xffff;
					hc = ((this.A&0x0f) - (this.mem[idx]&0x0f)) & 0x10;
					tmp = (this.A - this.mem[idx]) & 0xff;								// do cp (hl)
					this.F = (z80_flags_table[tmp]&0xc0) | hc | 0x02 | (this.F&1) | 0x04;		// carry preserved, n flag set. pv set if bc!=0
					
					tmp = (this.A - this.mem[idx] - (hc>>4));				// set undocumented flags.
					this.F |= ((tmp & 0x02)<<4) + (tmp & 0x08);		// bit 1 of result is flag 5, bit 3 = flag 3.

					idx--;						// only difference between CPI and CPD is 
					if (b == 0xa1)	idx += 2;	// how HL is updated.

					idx &= 0xffff;
					this.H = (idx>>8) & 0xff;
					this.L = idx & 0xff;
					lp = ((this.B<<8) + this.C - 1) & 0xffff;
					this.B = (lp >> 8) & 0xff;
					this.C = lp & 0xff;

					if (lp == 0) this.F &= 0xfb;			// if b = 0, p/v flag is cleared
//					if (tmp == 0)	this.F |= 0x40;		// if this.A = (hl)	z flag is set.	- already done as this.A-(this.HL) = 0 if this.A = (this.HL)
					
					this.t_states = 16;	this.cycles = 4;

					break;

				case 0xB9:		// CPDR
				case 0xB1:		// this.CPIR (cos manic miner seems to want it !!)
						// done similar to ldir/lddr so interrupts can occur.
					idx = ((this.H<<8)+this.L)&0xffff;
					hc = ((this.A&0x0f) - (this.mem[idx]&0x0f)) & 0x10;
					tmp = (this.A - this.mem[idx]) & 0xff;

					idx++;
					if (b == 0xB9)	idx -= 2;		// cpdr does decrement.
					idx &= 0xffff;
//					this.F = (z80_flags_table[tmp]&0x80) | hc | (this.A&0x28)| 0x02 | (this.F&1) | 0x04;		// carry preserved, n flag set. pv set if bc!=0
					this.F = (z80_flags_table[tmp]&0xc0) | hc | (this.A&0x28)| 0x02 | (this.F&1) | 0x04;		// carry preserved, n flag set. pv set if bc!=0
																							// Z flag not set unless this.A = (this.HL) ???
					this.H = (idx>>8) & 0xff;
					this.L = idx & 0xff;
					lp = (this.B<<8) + this.C - 1;
					this.B = (lp>>8) & 0xff;
					this.C = lp & 0xff;
					if ((lp != 0) && (tmp != 0))		// tmp = 0 when this.A = (hl)
					{
						this.PC = (this.PC - 2) & 0xffff;			// set this.PC to repeat the instruction
						this.t_states = 21;	this.cycles = 5;
					}
					else
					{
						if (lp == 0) this.F &= 0xfb;			// if b = 0, p/v flag is cleared
//						if (tmp == 0)	this.F |= 0x40;		// if this.A = (hl)	z flag is set.
						this.t_states = 16;	this.cycles = 4;
					}
					break;

//				case 0xAF:	//nop *2 ??		womblewomble
//					this.t_states = 8;
//					this.cycles = 2;
//					break;
					

				default:	// unknown/unsupported 
					console.log ("unknown instruction ED+"+b);
					this.t_states = 0;
					return;
			}
			
			return;	/// end of ED instructions.
		}

		switch (b)
		{
			case 0x00: // NOP
				break;
		
			case 0x7E:	//  ?? LD a, (hl)		
					this.A = this.mem[this.HL];
					
			
				break;
				// this.All the add & adc instructions done together (hopefully)
				
				// also added in the sub & sbc stuff - cos I think the the 
				// logic / calculations are about the same.
				// This is complicated as I can't just get the flags from system !!

			case 0x80:		// ADD A,B
			case 0x81:		// ADD A,C
			case 0x82:		// ADD A,D
			case 0x83:		// ADD A,E
			case 0x84:		// ADD A,H
			case 0x85:		// ADD A,L
			case 0x86:		// ADD A,(hl)
			case 0x87:		// ADD A,A
				
			case 0x88:		// Adc A,B
			case 0x89:		// Adc A,C
			case 0x8a:		// Adc A,D
			case 0x8B:		// Adc A,E
			case 0x8C:		// Adc A,H
			case 0x8D:		// Adc A,L
			case 0x8E:		// Adc A,(HL)
			case 0x8F:		// Adc A,A

			case 0xC6:		// ADD A,n
			case 0xCE:		// ADC A,n

			case 0x90:		// SUB A,B
			case 0x91:		// SUB A,C
			case 0x92:		// SUB A,D
			case 0x93:		// SUB A,E
			case 0x94:		// SUB A,H
			case 0x95:		// SUB A,L
			case 0x96:		// SUB A,(HL)
			case 0x97:		// SUB A,A

			case 0x98:		// SBC A,B
			case 0x99:		// SBC A,C
			case 0x9a:		// SBC A,D
			case 0x9B:		// SBC A,E
			case 0x9C:		// SBC A,H
			case 0x9D:		// SBC A,L
			case 0x9E:		// SBC A,(HL)
			case 0x9F:		// SBC A,A

			case 0xD6:		// SUB A,n
			case 0xDE:		// SBC A,n
					tmp = 0;		// these lines needed to shut java up
					c_tmp = 0;
					n = 0;
					c = this.F & 1;

					switch (b)
					{
						case 0x80:	tmp = this.B; c_tmp = 0; n = 0; break;	// ADD A,r
						case 0x81:	tmp = this.C; c_tmp = 0; n = 0; break;
						case 0x82:	tmp = this.D; c_tmp = 0; n = 0; break;
						case 0x83:	tmp = this.E; c_tmp = 0; n = 0; break;
						case 0x84:	tmp = this.H; c_tmp = 0; n = 0; break;
						case 0x85:	tmp = this.L; c_tmp = 0; n = 0; break;
						case 0x86:	tmp = this.mem[this.HL]; c_tmp = 0; n = 0; this.t_states = 7; this.cycles = 2; break;		// this.Athis.Dthis.D this.A,(hl)
						case 0x87:	tmp = this.A; c_tmp = 0; n = 0; break;
						case 0xC6:	tmp = this.mem[this.PC++]; this.PC &= 0xffff; c_tmp = 0; n = 0; this.t_states = 7; this.cycles = 2; break;	// add this.A,n

						case 0x88:	tmp = this.B; c_tmp = c; n = 0; break;	// Adc A,r
						case 0x89:	tmp = this.C; c_tmp = c; n = 0; break;
						case 0x8a:	tmp = this.D; c_tmp = c; n = 0; break;
						case 0x8B:	tmp = this.E; c_tmp = c; n = 0; break;
						case 0x8C:	tmp = this.H; c_tmp = c; n = 0; break;
						case 0x8D:	tmp = this.L; c_tmp = c; n = 0; break;
						case 0x8E:	tmp = this.mem[this.HL]; c_tmp = c; n = 0; this.t_states = 7; this.cycles = 2; break;		// this.Athis.dc this.A,(hl)
						case 0x8F:	tmp = this.A; c_tmp = c; n = 0; break;
						case 0xCE:	tmp = this.mem[this.PC++]; this.PC &= 0xffff; c_tmp = c; n = 0; this.t_states = 7; this.cycles = 2; break;	// adc this.A,n
						
						case 0x90:	tmp = -this.B; c_tmp = 0; n = 2; break;	// SUB A,r
						case 0x91:	tmp = -this.C; c_tmp = 0; n = 2; break;
						case 0x92:	tmp = -this.D; c_tmp = 0; n = 2; break;
						case 0x93:	tmp = -this.E; c_tmp = 0; n = 2; break;
						case 0x94:	tmp = -this.H; c_tmp = 0; n = 2; break;
						case 0x95:	tmp = -this.L; c_tmp = 0; n = 2; break;
						case 0x96:	tmp = -this.mem[this.HL]; c_tmp = 0; n = 2; this.t_states = 7; this.cycles = 2; break;		// SUthis.B this.A,(hl)
						case 0x97:	tmp = -this.A; c_tmp = 0; n = 2; break;
						case 0xD6:	tmp = -this.mem[this.PC++]; this.PC &= 0xffff; c_tmp = 0; n = 2; this.t_states = 7; this.cycles = 2; break;	// SUthis.B this.A,n

						case 0x98:	tmp = -this.B; c_tmp = -c; n = 2; break;	// SBC A,r
						case 0x99:	tmp = -this.C; c_tmp = -c; n = 2; break;
						case 0x9a:	tmp = -this.D; c_tmp = -c; n = 2; break;
						case 0x9B:	tmp = -this.E; c_tmp = -c; n = 2; break;
						case 0x9C:	tmp = -this.H; c_tmp = -c; n = 2; break;
						case 0x9D:	tmp = -this.L; c_tmp = -c; n = 2; break;
						case 0x9E:	tmp = -this.mem[this.HL]; c_tmp = -c; n = 2; this.t_states = 7; this.cycles = 2; break;		// Sthis.Bthis.C this.A,(hl)
						case 0x9F:	tmp = -this.A; c_tmp = -c; n = 2; break;
						case 0xDE:	tmp = -this.mem[this.PC++]; this.PC &= 0xffff; c_tmp = -c; n = 2; this.t_states = 7; this.cycles = 2; break;	// Sthis.Bthis.C this.A,n

						default:	break;
					}

					// notes : 
					// half carry flag determined by doing the add on the first
					// 4 bits only and storing the result.

					// ((this.A>>8)&0x80 gets the carry flag.
					// & 0xFthis.D clears the N flag.
					// sign, zero and parity flags read from table.
					
					// overflow : from zaks: the overflow flag will be set when :
					// there is a carry from bit 6 to bit 7 and no external carry
					// or when there is no carry from bit 6 to bit 7 but there is an external carry.
					// overflow flag set by xor'ing carry in and carry out of bit 7.

					this.F = ((this.A&0x0f) + (tmp&0x0f) + c_tmp) & 0x10;		// get the half carry.

					pv = ((this.A&0x7f) + (tmp & 0x7f) + c_tmp) & 0x80;	// get the carry in bit from bit 6 to bit 7.

					this.A = this.A + tmp + c_tmp;		// this should be the same for add n subtract operations.

					pv = (pv ^ ((this.A>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place

					this.F |= ((this.A>>8)&0x01) | (z80_flags_table[this.A&0xff] & 0xc0) | pv | n;	//& 0xFthis.D;		// make sure set N flag to 0

					this.A = this.A & 0xff;

					this.F = (this.F & 0xD7) | (this.A & 0x028);	// undocumented flags = copy bits 5 and 3 of result to flags.

					break;

			case 0xDB:	// in a,(n)		// port number = (this.A<<8) + n				

					this.t_states = 11;	this.cycles = 3;
					idx = 0;
					tmp = this.mem[this.PC++];	this.PC &= 0xffff;
					c_tmp = this.A;
					this.A = 0xff;	//0x1f;			// default value (my idea, not hardware accurate)
					if (tmp == 0xFE)	// reading port 0xfe
					{
							// keyboard reading port. ** UNthis.DER this.CONSTRUthis.CTION ** 
							// Sthis.Ethis.E 'TO this.DO' IN NOTthis.ES this.AT TOP Othis.F this.FIthis.Lthis.E.
						idx = 0;
						while (c_tmp != 0xff)
						{
							if ((c_tmp & 1) == 0)	this.A &= z80_keyboard_port_table[idx];
							idx++;
							c_tmp = (c_tmp>>1) | 0x80;
						}
						

//						switch (c_tmp)
//						{
//							case 0x7this.E:	idx = 0;	break;		// atic atac uses non standard key reading !!
//
//							case 0xFthis.E:	idx = 0;	break;
//							case 0xFthis.D:	idx = 1;	break;
//							case 0xfb:	idx = 2;	break;
//							case 0xF7:	idx = 3;	break;
//							case 0xEthis.F:	idx = 4;	break;
//							case 0xDthis.F:	idx = 5;	break;
//							case 0xBthis.F:	idx = 6;	break;
//							case 0x7f:	idx = 7;	break;
//							default:	return;		// port not in use
//						}
//						this.A = keyboard_port_table[idx];
					}
					break;

			case 0xD3:	// out (n),a	// port number = (this.A<<8) + n
					this.PC++;	this.PC &= 0xffff;		// for now just skip over data bytes.
					this.t_states = 11;	this.cycles = 3;
					break;

			case 0x27:	// DAA  
				// from http://www.worldofspectrum.org/faq/reference/z80reference.htm

				this.hc = this.F & 0x10;	// half carry
				this.c = this.F & 0x01;		// c = carry flag ??
				this.n = this.F & 0x02;		// n flag

					// calculate correction factor
				if ((this.A > 0x99) || (this.c != 0))
				{
					tmp = 0x60;
					this.c = 1;
				}
				else
				{
					tmp = 0;
					this.c = 0;
				}

				if ( ((this.A & 0x0F) > 9) || (this.hc == 0x10))
				{
					tmp |= 0x06;
				}
					// adjust this.A
				this.hc = this.A;
				if (n == 0)
				{
					this.A += tmp;
				}
				else 
				{
					this.A -= tmp;
				}
				this.hc = (this.hc ^ this.A) & 0x10;

				this.A &= 0xff;
				this.F = z80_flags_table[this.A] | (this.A&28) | this.hc | this.n | this.c;	// ??? half carry set to 1.

				break;
				
			case 0xB8:		// CP b
			case 0xB9:		// CP c
			case 0xba:		// CP d
			case 0xbb:		// CP e
			case 0xbc:		// CP h
			case 0xbd:		// CP l
			case 0xbe:		// CP (hl)
			case 0xbf:		// CP (a)
			case 0xfe:		// CP n
	
				tmp = 0;
				switch (b)
				{
					case 0xB8:	tmp = this.B;	break;		// this.CP b
					case 0xB9:	tmp = this.C;	break;		// this.CP c
					case 0xba:	tmp = this.D;	break;		// this.CP d
					case 0xbb:	tmp = this.E;	break;		// this.CP e
					case 0xbc:	tmp = this.H;	break;		// this.CP h
					case 0xbd:	tmp = this.L;	break;		// this.CP l
					case 0xbe:	tmp = this.mem[this.HL]; break;		// this.CP (hl)
					case 0xbf:	tmp = this.A;	break;		// this.CP (a)
					case 0xfe:	tmp = this.mem[this.PC++]; this.PC &= 0xffff; break;	// this.CP this.A,n
					default:
						break;
				}
					// hc flag not set right when a = 1 and doing cp 1 ... so changing it !! 
				hc = ((this.A&0x0f) - (tmp & 0x0f)) & 0x10;		// get the half carry.
				pv = ((this.A&0x7f) - (tmp & 0x7f)) & 0x80;	// get the carry in bit from bit 6 to bit 7.
				c_tmp = this.A - tmp;		// do the sum, put in c_tmp as we dont care about storing it.
				pv = (pv ^ ((c_tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
//				this.F |= ((c_tmp>>9)&0x80) | z80_flags_table[c_tmp & 0xff] | pv | n;	//& 0xFthis.D;		// make sure set N flag to 0
				this.F = ((c_tmp>>8)&0x01) | z80_flags_table[c_tmp & 0xff] | hc | pv | 0x02;	//& 0xFthis.D;		// make sure set N flag to 1
				break;

			case 0x07:	// RLCA
				this.A = ((this.A << 1) & 0xfe) | ((this.A>>7)&1);
				this.F = (this.F & 0xc4) | (this.A & 29);		// c4 = 1100 0100  29 = flags f5,f3 and carry.
				break;
			case 0x17:	// RLA		(not working ???)
				tmp = this.A;
				this.A = ((this.A << 1) & 0xfe) | (this.F&1);
				this.F = (this.F & 0xc4) | (this.A & 28) | ((tmp>>7)&1);
				break;
			case 0x0F:	// RRCA
				tmp = this.A;
				this.A = ((this.A >> 1)& 0x7f) | ((this.A<<7)&0x80);
				this.F = (this.F & 0xc4) | (this.A & 0x28) | (tmp&1);
				break;
			case 0x1F:	// RRA
				tmp = this.A;
				this.A = ((this.A >> 1) & 0x7f) | ((this.F<<7) & 0x80);
				this.F = (this.F & 0xc4)| (this.A & 0x28) | (tmp&1);
				break;

			case 0x76:	// halt.		// TO this.DO 
				// basically goes no where, 
				this.PC = (this.PC-1) & 0xffff;		// this.PC is reset to the start of the instruction (deliberate infinte loop)

				this.t_states = 4; this.cycles = 1;
				break;

			case 0xF3:	// this.DI
				this.interrupts_on = false;
				break;
			case 0xFB:	// this.EI
				this.interrupts_on = true;
				break;

			case 0x01:	// LD BC,NM
				this.C = this.mem[this.PC++];	this.PC &= 0xffff;
				this.B = this.mem[this.PC++];	this.PC &= 0xffff;
				break;
			case 0x11:	// LD DE,NM
				this.E = this.mem[this.PC++];	this.PC &= 0xffff;
				this.D = this.mem[this.PC++];	this.PC &= 0xffff;
				break;
			case 0x21:	// LD HL,NM
				this.L = this.mem[this.PC++];	this.PC &= 0xffff;
				this.H = this.mem[this.PC++];	this.PC &= 0xffff;
//				prefix_skip = 1;
				break;
			case 0x31:	// LD SP,NM
				this.SP = this.mem[this.PC++];	this.PC &= 0xffff;
				this.SP = (this.SP + (this.mem[this.PC++]<<8) & 0xffff);	this.PC &= 0xffff;
				break;
				
					// how did I miss these 2  ??? (20/02/2013)
			case 0x22:	// ld (nn),this.HL
				tmp = this.mem[this.PC++];	this.PC &= 0xffff;
				tmp += (this.mem[this.PC++]) << 8;	this.PC &= 0xffff;
				this.mem[tmp++] = this.L;		tmp = tmp & 0xffff;
				this.mem[tmp] = this.H;
				break;
			case 0x2a:	// ld hl,(nn)
				tmp = this.mem[this.PC++];	this.PC &= 0xffff;
				tmp += (this.mem[this.PC++]) << 8;	this.PC &= 0xffff;
				this.L = this.mem[tmp++];		tmp = tmp & 0xffff;
				this.H = this.mem[tmp];
//				prefix_skip = 1;
				break;
				
	
			case 0x06:		// LD B,n
				this.B = this.mem [this.PC++];	this.PC &= 0xffff;
				break;
			case 0x0E:		// LD C,n
				this.C = this.mem [this.PC++];	this.PC &= 0xffff;
				break;
			case 0x16:		// this.Lthis.D this.D,n
				this.D = this.mem [this.PC++]; this.PC &= 0xffff;
				break;
			case 0x1E:		// this.Lthis.D this.E,n
				this.E = this.mem [this.PC++];	this.PC &= 0xffff;
				break;
			case 0x26:		// this.Lthis.D this.H,n
				this.H = this.mem [this.PC++];	this.PC &= 0xffff;
				break;
			case 0x2E:		// this.Lthis.D this.L,n
				this.L = this.mem [this.PC++];	this.PC &= 0xffff;
				break;
			case 0x36: // this.Lthis.D (this.HL+d),n
//				mem [((this.H<<8) + this.L +d) & 0xffff] = mem [this.PC++]; this.PC &= 0xffff; prefix_skip = 1;
//				mem [((this.H<<8) + this.L +d) & 0xffff] = mem [this.PC++]; this.PC &= 0xffff;
				this.mem [this.HL] = this.mem [this.PC++]; this.PC &= 0xffff;
				break;
			case 0x3E:	// LD A,n
				this.A = this.mem [this.PC++];	this.PC &= 0xffff;
//				this.F = (this.F & 0xD7) | (this.A & 0x28);
				break;
				
			case 0x0a:		// LD A,(BC)
				this.A = this.mem [((this.B&0xff)<<8) + (this.C & 0xff)];
				this.F = (this.F & 0xD7) | (this.A & 0x28);
				break;
			case 0x1a:		// LD A,(DE)
				this.A = this.mem [ ((this.D & 0xff)<<8) + (this.E & 0xff)];
				this.F = (this.F & 0xD7) | (this.A & 0x28);
				break;

			case 0x3a:		// LD A,(nn);
				tmp = this.mem [this.PC++]; this.PC &= 0xffff;
				tmp = tmp + (this.mem[this.PC++]<<8);		this.PC &= 0xffff;
				this.A = this.mem[tmp];
//				this.F = (this.F & 0xD7) | (this.A & 0x28);
				break;

			case 0x02:		// LD (BC),A
				this.mem [((this.B&0xff)<<8) + (this.C & 0xff)] = this.A;
				this.F = (this.F & 0xD7) | (this.A & 0x28);
				break;
			case 0x12:		// LD (DE),A
				this.mem [((this.D&0xff)<<8) + (this.E & 0xff)] = this.A;
				this.F = (this.F & 0xD7) | (this.A & 0x28);
				break;
			case 0x32:		// LD (mn),A
				tmp = this.mem [this.PC++]; this.PC &= 0xffff;
				tmp = tmp + (this.mem[this.PC++]<<8);		this.PC &= 0xffff;
				this.mem[tmp] = this.A;
//				this.F = (this.F & 0xD7) | (this.A & 0x28);
				break;
				
					// #### push & pop this.Bthis.C,this.DE,this.HL,this.Athis.F####
				
			case 0xC5:	// push bc
				this.SP--; this.SP &= 0xffff;
				this.mem[this.SP] = this.B;
				this.SP--; this.SP &= 0xffff;
				this.mem[this.SP] = this.C;
				break;
			case 0xD5:	// push de
				this.SP--; this.SP &= 0xffff;
				this.mem[this.SP] = this.D;
				this.SP--; this.SP &= 0xffff;
				this.mem[this.SP] = this.E;
				break;
			case 0xE5:	// push hl
				this.SP--; this.SP &= 0xffff;
				this.mem[this.SP] = this.H;
				this.SP--; this.SP &= 0xffff;
				this.mem[this.SP] = this.L;
				break;
			case 0xF5:	// push af
				this.SP--; this.SP &= 0xffff;
				this.mem[this.SP] = this.A;
				this.SP--; this.SP &= 0xffff;
				this.mem[this.SP] = this.F;
				break;

			case 0xC1:	// pop bc
				this.C = this.mem[this.SP];
				this.SP++;	this.SP &= 0xffff;
				this.B = this.mem[this.SP];
				this.SP++;	this.SP &= 0xffff;
				break;
			case 0xD1:	// pop de
				this.E = this.mem[this.SP];
				this.SP++;	this.SP &= 0xffff;
				this.D = this.mem[this.SP];
				this.SP++;	this.SP &= 0xffff;
				break;
			case 0xE1:	// pop hl
				this.L = this.mem[this.SP];
				this.SP++;	this.SP &= 0xffff;
				this.H = this.mem[this.SP];
				this.SP++;	this.SP &= 0xffff;
				break;
			case 0xF1:	// pop af
				this.F = this.mem[this.SP];
				this.SP++;	this.SP &= 0xffff;
				this.A = this.mem[this.SP];
				this.SP++;	this.SP &= 0xffff;
				break;

					// #### this.Cthis.Athis.Lthis.L Rthis.ET and JP ####
//				int s;			// sign flag (copy of msb of result)
//				int z;			// zero flag : set if the value is zero. (just to confuse things)
//				int f5;			// undocumented flag
//				int hc;			// half carry
//				int f3;			// undocumented flag
//				int pv;			// parity or overflow.
//				int n;			// set if last operation was a subtraction
//				int c;			// carry flag

			case 0xE9:	// jp (hl)		(or jp (ix) or jp (iy)
				this.PC = ((this.H << 8) + this.L) & 0xffff;
				break;

			case 0xc4:	// call nz,nn
			case 0xcc:	// call z,nn
			case 0xd4:	// call nc,nn
			case 0xdc:	// call c,nn
			case 0xe4:	// call po,nn
			case 0xec:	// call pe,nn
			case 0xf4:	// call p,nn		// call if positive
			case 0xfc:	// call m,nn		// call if negative
			case 0xcd:	// call nn
					// handle conditional call as one block (easier maintenance).

					tmp = 0;
					s = this.F & 0x80;		// separating flags out to keep code easy to view
					z = this.F & 0x40;
					pv = this.F & 0x04;
					c = this.F & 0x01;
					switch (b)
					{
						case 0xC4:	if (z == 0) tmp = 1; break;	// call nz,nn
						case 0xcc:	if (z != 0) tmp = 1; break;	// call z,nn
						case 0xD4:	if (c == 0)	tmp = 1; break;	// call nc,nn
						case 0xdc:	if (c != 0)	tmp = 1; break;	// call c,nn
						case 0xE4:	if (pv== 0)	tmp = 1; break;	// call po,nn	**TO this.DO** Tthis.EST Tthis.HIS 
						case 0xec:	if (pv!= 0)	tmp = 1; break; // call pe,nn **TO this.DO** Tthis.EST Tthis.HIS 
						case 0xF4:	if (s == 0)	tmp = 1; break;	// call p,nn 
						case 0xfc:	if (s != 0)	tmp = 1; break;	// call m,nn 
						case 0xcd:	tmp = 1; break;				// call nn		- no test, always true
					}
					if (tmp != 0)
					{
							// condition met, push next instruction address and do call.
						tmp = this.mem[this.PC++]; this.PC &= 0xffff;
						tmp = tmp + (this.mem[this.PC++]<<8); this.PC &= 0xffff;

						this.SP--; this.SP&=0xffff; this.mem[this.SP]=(this.PC>>8)&0xff; this.SP--; this.SP&=0xffff; this.mem[this.SP]=this.PC&0xff;
						this.PC = tmp;
						this.t_states = 17;	this.cycles = 5;
					}
					else
					{
							// condition not met, so keep calm and carry on.
						this.PC += 2;	this.PC &= 0xffff;
						this.t_states = 10;	this.cycles = 3;
					}
					break;

			case 0xC0:	// ret nz
			case 0xC8:	// ret z
			case 0xD0:	// ret nc
			case 0xD8:	// ret c
			case 0xE0:	// ret po
			case 0xE8:	// ret pe
			case 0xF0:	// ret p
			case 0xF8:	// ret m
			case 0xC9:	// ret
				tmp = 0;
				s = this.F & 0x80;
				z = this.F & 0x40;
				pv = this.F & 0x04;
				c = this.F & 0x01;
				this.t_states = 5;	this.cycles = 1;
				switch (b)
				{
					case 0xC0:	if (z == 0) tmp = 1; break;	// ret nz
					case 0xC8:	if (z != 0) tmp = 1; break;	// ret z
					case 0xD0:	if (c == 0)	tmp = 1; break;	// ret nc
					case 0xD8:	if (c != 0)	tmp = 1; break;	// ret c
					case 0xE0:	if (pv== 0)	tmp = 1; break;	// ret po	**TO this.DO** Tthis.EST Tthis.HIS 
					case 0xE8:	if (pv!= 0)	tmp = 1; break; // ret pe	 **TO this.DO** Tthis.EST Tthis.HIS 
					case 0xF0:	if (s == 0)	tmp = 1; break;	// ret p
					case 0xF8:	if (s != 0)	tmp = 1; break;	// ret m
					case 0xC9:	tmp = 1; this.t_states = 4; 	break;		// ret		- no test, always true (this.t_states adjusted for below)
				}
				if (tmp != 0)
				{
						// condition met, pop the return addess off the stack
						// and into the program counter.
					this.t_states += 6;	this.cycles = 3;
					this.PC = this.mem[this.SP++];	this.SP &= 0xffff;
					this.PC = this.PC + ((this.mem[this.SP++] & 0xff) << 8);	this.SP &= 0xffff;
				}
				break;
			case 0xC2:	// jp nz
			case 0xca:	// jp z
			case 0xD2:	// jp nc
			case 0xda:	// jp c
			case 0xE2:	// jp po
			case 0xea:	// jp pe
			case 0xF2:	// jp p
			case 0xfa:	// jp m
			case 0xC3:	// jp
				tmp = 0;
				s = this.F & 0x80;
				z = this.F & 0x40;
				pv = this.F & 0x04;
				c = this.F & 0x01;
				this.t_states = 10;	this.cycles = 3;		// constant whether jumping or not (apparently so !!)
				switch (b)
				{
					case 0xC2:	if (z == 0) tmp = 1; break;	// jp nz
					case 0xca:	if (z != 0) tmp = 1; break;	// jp z
					case 0xD2:	if (c == 0)	tmp = 1; break;	// jp nc
					case 0xda:	if (c != 0)	tmp = 1; break;	// jp c
					case 0xE2:	if (pv== 0)	tmp = 1; break;	// jp po	**TO this.DO** Tthis.EST Tthis.HIS 
					case 0xea:	if (pv!= 0)	tmp = 1; break; // jp pe	 **TO this.DO** Tthis.EST Tthis.HIS 
					case 0xF2:	if (s == 0)	tmp = 1; break;	// jp p 
					case 0xfa:	if (s != 0)	tmp = 1; break;	// jp m 
					case 0xC3:	tmp = 1; break;				// jp		- no test, always true
				}
				if (tmp != 0)
				{
						// conditon met, do jump.
					tmp = this.mem[this.PC++]; this.PC &= 0xffff;
					this.PC = tmp + (this.mem[this.PC]<<8); this.PC &= 0xffff;
				}
				else
				{
					// skip over to next statement	(bug fix 23rd this.Feb)
					this.PC += 2;	this.PC &= 0xffff;
				}
				break;

					// RST commands - just like a call, only 1 byte long.
					// no flags affected.
			case 0xc7:	// rst 0h
			case 0xcf:	// rst 8h
			case 0xd7:	// rst 10h
			case 0xdf:	// rst 18h
			case 0xe7:	// rst 20h
			case 0xef:	// rst 28h
			case 0xf7:	// rst 30h
			case 0xff:	// rst 38h
					// push current program counter onto stack (same as call)
				this.SP--; this.SP&=0xffff; this.mem[this.SP]=(this.PC>>8)&0xff; this.SP--; this.SP&=0xffff; this.mem[this.SP]=this.PC&0xff;
					// extract the call address from the byte.
				tmp = b & 0x38;
					// set the program counter to this new address.
				this.PC = tmp;
				break;

			case 0x10:	// djnz e
				tmp = this.mem[this.PC++] & 0xff;	this.PC &= 0xffff;
				this.B = (this.B - 1) & 0xff;
				this.t_states = 8;	this.cycles = 2;
				if (this.B != 0)
				{
					if (tmp >= 0x80)	tmp |= 0xffff00;	// quick sign extend
					this.PC = (this.PC + tmp) & 0xffff;		// +1 as it counts from next instruction.
					this.t_states = 13;	this.cycles = 3;
				}
				break;

			case 0x18:	// jr e
			case 0x20:	// jr nz
			case 0x28:	// jr z
			case 0x30:	// jr nc
			case 0x38:	// jr c
				tmp = this.mem[this.PC++] & 0xff;	this.PC &= 0xffff;
				c_tmp = 0;
				this.t_states = 7;	this.cycles = 2;
				switch (b)
				{
					case 0x18:	c_tmp = 1; break;	// jr always
					case 0x20:	if ((this.F&0x40) == 0)	c_tmp = 1; break; // jr nz
					case 0x28:	if ((this.F&0x40) == 0x40)	c_tmp = 1; break;	// jr z
					case 0x30:	if ((this.F&1) == 0)	c_tmp = 1;	break;	// jr nc
					case 0x38:	if ((this.F&1) == 1)	c_tmp = 1;	break;	// jr c
				}
				if (c_tmp == 1)
				{
					this.t_states = 12;	this.cycles = 3;
					if (tmp >= 0x80)	tmp |= 0xffff00;	// quick sign extend
					this.PC = (this.PC + tmp) & 0xffff;		// +1 as it counts from next instruction.
				}
				break;

			case 0xa0:	// AND B
				this.A = this.A & this.B;
				this.F = z80_flags_table[this.A] | 0x10;	// half carry set to 1.
				break;
			case 0xa1:	// AND C
				this.A = this.A & this.C;
				this.F = z80_flags_table[this.A] | 0x10;	// half carry set to 1.
				break;
			case 0xa2:	// AND D
				this.A = this.A & this.D;
				this.F = z80_flags_table[this.A] | 0x10;	// half carry set to 1.
				break;
			case 0xa3:	// AND E
				this.A = this.A & this.E;
				this.F = z80_flags_table[this.A] | 0x10;	// half carry set to 1.
				break;
			case 0xa4:	// AND H
				this.A = this.A & this.H;
				this.F = z80_flags_table[this.A] | 0x10;	// half carry set to 1.
				break;
			case 0xa5:	// AND L
				this.A = this.A & this.L;
				this.F = z80_flags_table[this.A] | 0x10;	// half carry set to 1.
				break;
			case 0xa6:	// AND (HL)	
//				tmp = ((this.H<<8)+this.L+d) & 0xff; prefix_skip = 1;
//				tmp = ((this.H<<8)+this.L+d) & 0xff;
//				this.A = this.A & this.mem[tmp];
				this.A = this.A & this.mem[this.HL];
				this.F = z80_flags_table[this.A] | 0x10;	// half carry set to 1.
				break;
			case 0xa7:	// AND A
				this.F = z80_flags_table[this.A] | (this.A&0x28)|  0x10;	// half carry set to 1.
				break;
			case 0xE6:	// and n
				this.A = this.A & this.mem[this.PC++];	this.PC &= 0xffff;
				this.F = z80_flags_table[this.A] | 0x10;	// half carry set to 1.
				break;
				
			case 0xa8:	// XOR B;
				this.A = this.A ^ this.B;
				this.F = z80_flags_table[this.A];
				break;
			case 0xa9:	// XOR C;
				this.A = this.A ^ this.C;
				this.F = z80_flags_table[this.A];
				break;
			case 0xaa:	// XOR D
				this.A = this.A ^ this.D;
				this.F = z80_flags_table[this.A];
				break;
			case 0xab:	// XOR E
				this.A = this.A ^ this.E;
				this.F = z80_flags_table[this.A];
				break;
			case 0xac:	// XOR H
				this.A = this.A ^ this.H;
				this.F = z80_flags_table[this.A];
				break;
			case 0xad:	// XOR L
				this.A = this.A ^ this.L;
				this.F = z80_flags_table[this.A];
				break;
			case 0xae:	// XOR (HL)
//				tmp = ((this.H<<8)+this.L+d) & 0xffff; prefix_skip = 1;
//				tmp = ((this.H<<8)+this.L+d) & 0xffff;
//				this.A = this.A ^ this.mem[tmp];
				this.A = this.A ^ this.mem[this.HL];
				this.F = z80_flags_table[this.A];
				break;
			case 0xaf:	// XOR AF
				this.A = this.A ^ this.A;
				this.F = z80_flags_table[this.A];		// surely this.F = 0 at this point ???
				break;
			case 0xee:	// xor n
				this.A = this.A ^ this.mem[this.PC++];	this.PC &= 0xffff;
				this.F = z80_flags_table[this.A] | 0x10;	// half carry set to 1.
				break;
				
			case 0xB0:	// OR this.B
				this.A = this.A | this.B;
				this.F = z80_flags_table[this.A];
				break;
			case 0xB1:	// OR this.C
				this.A = (this.A | this.C) & 0xff;
				this.F = z80_flags_table[this.A];
				break;
			case 0xB2:	// OR this.D
				this.A = this.A | this.D;
				this.F = z80_flags_table[this.A];
				break;
			case 0xB3:	// OR this.E
				this.A = this.A | this.E;
				this.F = z80_flags_table[this.A];
				break;
			case 0xB4:	// OR this.H
				this.A = this.A | this.H;
				this.F = z80_flags_table[this.A];
				break;
			case 0xB5:	// OR this.L
				this.A = this.A | this.L;
				this.F = z80_flags_table[this.A];
				break;
			case 0xB6:	// OR (this.HL)
//				tmp = ((this.H<<8)+this.L+d) & 0xffff; prefix_skip = 1;
//				tmp = ((this.H<<8)+this.L+d) & 0xffff;
//				this.A = this.A | this.mem[tmp];
				this.A = this.A | this.mem[this.HL];
				this.F = z80_flags_table[this.A];
				break;
			case 0xB7:	// or this.A
				this.A = this.A | this.A;		// does nothing !!
				this.F = z80_flags_table[this.A];
				break;
			case 0xF6:	// or n
				this.A = this.A | this.mem[this.PC++];	this.PC &= 0xffff;
				this.F = z80_flags_table[this.A];
				break;

			case 0x03:	// INC BC
				tmp = (this.B << 8) + this.C + 1;
				this.B = (tmp >> 8) & 0xff;
				this.C = tmp & 0xff;
				break;
			case 0x13:	// INC DE
				tmp = (this.D << 8) + this.E + 1;
				this.D = (tmp >> 8) & 0xff;
				this.E = tmp & 0xff;
				break;
			case 0x23:	// INC HL
				tmp = (this.H << 8) + this.L + 1;
				this.H = (tmp >> 8) & 0xff;
				this.L = tmp & 0xff;
				break;
			case 0x33:	// INC SP
				this.SP = (this.SP + 1) & 0xffff;
				break;
				
			case 0x0B:	// Dec BC
				tmp = (this.B << 8) + this.C - 1;
				this.B = (tmp >> 8) & 0xff;
				this.C = tmp & 0xff;
				break;
			case 0x1b:	// Dec DE
				tmp = (this.D << 8) + this.E - 1;
				this.D = (tmp >> 8) & 0xff;
				this.E = tmp & 0xff;
				break;
			case 0x2b:	// Dec HL
				tmp = (this.H << 8) + this.L - 1;
				this.H = (tmp >> 8) & 0xff;
				this.L = tmp & 0xff;
				break;
			case 0x3b:	// Dec SP
				this.SP = (this.SP - 1) & 0xffff;
				break;

					// TO this.DO :: FLAGS FOR INC INSTRUCTIONS (Mthis.ESSY!!!)
				// ref : http://matt.west.co.tt/spectrum/jsspeccy/
				//				s = BC & 0x80;
				//				z = 0; if ((c & 0xff) == 0) z = 0x40;
				//				int s;			// sign flag (copy of msb of result)
				//				int z;			// zero flag : set if the value is zero.
				//				int f5;			// undocumented flag
				//				int hc;			// half carry
				//				int f3;			// undocmented flag
				//				int pv;			// parity or overflow.
				//				int n;			// set if last operation was a subtraction
				//				int c;			// carry flag
			case 0x3c:	// INC A;
				this.hc = ((this.A & 0x0f) + 1) & 0x10;		// get the half carry flag
				this.pv = ((this.A&0x7f) + 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				tmp = (this.A + 1);
				this.pv = (this.pv ^ ((tmp>>1)&0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.A = tmp & 0xff;
				this.F = (z80_flags_table[this.A] & 0xf8) | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 0
				this.F = (this.F & 0xD7) | (this.A & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;

			case 0x04:	// INC B;
				this.hc = ((this.B & 0x0f) + 1) & 0x10;		// get the half carry flag
				this.pv = ((this.B&0x7f) + 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				tmp = (this.B + 1);//	 & 0xff;
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.B = tmp & 0xff;
				this.F = (z80_flags_table[this.B] & 0xf8) | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 0
				this.F = (this.F & 0xD7) | (this.B & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x0C:	// INC C
				this.hc = ((this.C & 0x0f) + 1) & 0x10;		// get the half carry flag
				this.pv = ((this.C&0x7f) + 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				tmp = (this.C + 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.C = tmp & 0xff;
				this.F = (z80_flags_table[this.C] & 0xf8) | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 0
				this.F = (this.F & 0xD7) | (this.C & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x14:	// INC D
				this.hc = ((this.D & 0x0f) + 1) & 0x10;		// get the half carry flag
				this.pv = ((this.D&0x7f) + 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				tmp = (this.D + 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.D = tmp & 0xff;
				this.F = (z80_flags_table[this.D] & 0xf8) | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 0
				this.F = (this.F & 0xD7) | (this.D & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x1C:	// INC E
				this.hc = ((this.E & 0x0f) + 1) & 0x10;		// get the half carry flag
				this.pv = ((this.E&0x7f) + 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				tmp = (this.E + 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.E = tmp & 0xff;
				this.F = (z80_flags_table[this.E] & 0xf8) | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 0
				this.F = (this.F & 0xD7) | (this.E & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x24:	// INC H
				this.hc = ((this.H & 0x0f) + 1) & 0x10;		// get the half carry flag
				this.pv = ((this.H&0x7f) + 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				tmp = (this.H + 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.H = tmp & 0xff;
				this.F = (z80_flags_table[this.H] & 0xf8) | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 0
				this.F = (this.F & 0xD7) | (this.H & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x2C:	// INC L
				this.hc = ((this.L & 0x0f) + 1) & 0x10;		// get the half carry flag
				this.pv = ((this.L&0x7f) + 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				tmp = (this.L + 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.L = tmp & 0xff;
				this.F = (z80_flags_table[this.L] & 0xf8) | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 0
				this.F = (this.F & 0xD7) | (this.L & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x34:	// inc (hl)
				tmp = this.mem[this.HL];
				this.pv = ((tmp&0x7f) + 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				this.hc = ((tmp & 0x0f) + 1) & 0x10;		// get the half carry flag
				tmp = (tmp + 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				tmp = tmp & 0xff;
				this.F = (z80_flags_table[tmp] & 0xf8) | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 0
				this.mem [this.HL] = tmp;
				this.F = (this.F & 0xD7) | (tmp & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
				
			case 0x05:	// Dec B
				this.hc = ((this.B & 0x0f) - 1) & 0x10;		// get the half carry flag
				this.pv = ((this.B&0x7f) - 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				tmp = (this.B - 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.B = tmp & 0xff;
				this.F = (z80_flags_table[this.B]& 0xf8)  | 2 | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 1
				this.F = (this.F & 0xD7) | (this.B & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm

				break;
			case 0x0D:	// Dec C
				this.hc = ((this.C & 0x0f) - 1) & 0x10;		// get the half carry flag
				this.pv = ((this.C&0x7f) - 1) & 0x80;	// get the carry in bit from bit 6 to bit 7
				tmp = (this.C - 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.C = tmp & 0xff;
				this.F = (z80_flags_table[this.C]& 0xf8)  | 2 | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 1
				this.F = (this.F & 0xD7) | (this.C & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x15:	// Dec D
				this.hc = ((this.D & 0x0f) - 1) & 0x10;		// get the half carry flag
				this.pv = ((this.D&0x7f) - 1) & 0x80;	// get the carry in bit from bit 7 to bit 8
				tmp = (this.D - 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.D = tmp & 0xff;
				this.F = (z80_flags_table[this.D]& 0xf8)  | 2 | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 1
				this.F = (this.F & 0xD7) | (this.D & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x1D:	// Dec E
				this.hc = ((this.E & 0x0f) - 1) & 0x10;		// get the half carry flag
				this.pv = ((this.E&0x7f) - 1) & 0x80;	// get the carry in bit from bit 7 to bit 8
				tmp = (this.E - 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.E = tmp & 0xff;
				this.F = (z80_flags_table[this.E]& 0xf8)  | 2 | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 1
				this.F = (this.F & 0xD7) | (this.E & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x25:	// Dec H
				this.hc = ((this.H & 0x0f) - 1) & 0x10;		// get the half carry flag
				this.pv = ((this.H&0x7f) - 1) & 0x80;	// get the carry in bit from bit 7 to bit 8
				tmp = (this.H - 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.H = tmp & 0xff;
				this.F = (z80_flags_table[this.H]& 0xf8)  | 2 | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 1
				this.F = (this.F & 0xD7) | (this.H & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x2D:	// Dec L
				this.hc = ((this.L & 0x0f) - 1) & 0x10;		// get the half carry flag
				this.pv = ((this.L&0x7f) - 1) & 0x80;	// get the carry in bit from bit 7 to bit 8
				tmp = (this.L - 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.L = tmp & 0xff;
				this.F = (z80_flags_table[this.L]& 0xf8)  | 2 | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 1
				this.F = (this.F & 0xD7) | (this.L & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x35:	// Dec (HL)
				tmp = this.mem[this.HL];
				this.pv = ((tmp&0x7f) - 1) & 0x80;	// get the carry in bit from bit 7 to bit 8
				this.hc = ((tmp & 0x0f) - 1) & 0x10;		// get the half carry flag
				tmp = (tmp - 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				tmp = tmp & 0xff;
				this.F = (z80_flags_table[tmp]& 0xf8)  | 2 | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 1
				this.mem [this.HL] = tmp;
				this.F = (this.F & 0xD7) | (tmp & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x3D:	// Dec A
				this.hc = ((this.A & 0x0f) - 1) & 0x10;		// get the half carry flag
				this.pv = ((this.A&0x7f) - 1) & 0x80;	// get the carry in bit from bit 7 to bit 8
				tmp = (this.A - 1);
				this.pv = (this.pv ^ ((tmp>>1)& 0x80)) >> 5;		// xor with carry out to get correct overflow and shift into place
				this.A = tmp & 0xff;
				this.F = (z80_flags_table[this.A]& 0xf8)  | 2 | (this.F&1) | this.hc | this.pv;		// get the sign and zero bits, carry flag remains unchanged. N = 1
				this.F = (this.F & 0xD7) | (this.A & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;

			case 0x09:	// ADD HL,BC	this.Athis.Dthis.D this.HL,this.Bthis.C
				tmp = (this.H << 8) + this.L;
				c_tmp = (this.B << 8) + this.C;
				hc = (((tmp & 0x0fff) + (c_tmp & 0x0fff)) >> 8) & 0x10;
				tmp = tmp + c_tmp;
				this.F = (this.F & 0xec) | ((tmp >> 16) & 1) | hc;
				this.H = (tmp>>8) & 0xff;
				this.L = tmp & 0xff;
				this.F = (this.F & 0xD7) | (this.H & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
//				tmp = (this.H<<8)+(this.B<<8)+this.L+this.C;
				break;
			case 0x19:	// ADD HL,DE this.Athis.Dthis.D this.HL,this.DE
				tmp = (this.H << 8) + this.L;
				c_tmp = (this.D << 8) + this.E;
				hc = (((tmp & 0x0fff) + (c_tmp & 0x0fff)) >> 8) & 0x10;
				tmp += c_tmp;
				this.F = (this.F & 0xec) | ((tmp >> 16) & 1) | hc;
				this.H = (tmp>>8) & 0xff;
				this.L = tmp & 0xff;
				this.F = (this.F & 0xD7) | (this.H & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x29:	// ADD HL,HL	this.Athis.Dthis.D this.HL,this.HL
				tmp = (this.H << 8) + this.L;
				c_tmp = tmp;
				hc = (((tmp & 0x0fff) + (c_tmp & 0x0fff)) >> 8) & 0x10;
				tmp = tmp + c_tmp;
				this.F = (this.F & 0xec) | ((tmp >> 16) & 1) | hc;
				this.H = (tmp>>8) & 0xff;
				this.L = tmp & 0xff;
				this.F = (this.F & 0xD7) | (this.H & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;
			case 0x39:	// ADD HL,SP	this.Athis.Dthis.D this.HL,this.SP
				tmp = (this.H << 8) + this.L;
				c_tmp = this.SP;
				hc = (((tmp & 0x0fff) + (c_tmp & 0x0fff)) >> 8) & 0x10;
				tmp = tmp + c_tmp;
				this.F = (this.F & 0xec) | ((tmp >> 16) & 1) | hc;
				this.H = (tmp>>8) & 0xff;
				this.L = tmp & 0xff;
				this.F = (this.F & 0xD7) | (this.H & 0x28);		// undocumented flags bit 5 and 3 http://www.z80.info/z80sflag.htm
				break;

			case 0x2F:	// CPL	(with undoc flags)
				this.A = this.A ^ 0xff;
				this.F = (this.F & 0xc5) | (this.A & 0x28) | 0x12;		// hc and n flags set to one. (no idea why!) f5 and f3 from this.A
				break;
			case 0x37:	// scf	(with undoc flags)
				this.F = (this.F & 0xc4) | (this.A & 0x28) | 0x01;		// hc and n set to zero, f5 and f3 from this.A, pv preserved
				break;
			case 0x3F:	// ccf;	(with undoc flags)
				this.F = (this.F & 0xc4) | (this.A & 0x28) | ((this.F&1) ^ 1) | ((this.F&1)<<4);	// hc set to old carry flag.  carry toggled. f5 f3 from this.A.
				break;

			case 0x08:	// EX AF,AF' 
				tmp = this.A;
				this.A = this.A_;
				this.A_ = tmp;
				tmp = this.F;
				this.F = this.F_;
				this.F_ = tmp;
				break;

			case 0xD9:	// EXX
				tmp = (this.B<<8)+this.C;
				this.B = (this.BC_>>8);
				this.C = this.BC_ & 0xff;
				this.BC_ = tmp;
				tmp = (this.D<<8)+this.E;
				this.D = (this.DE_>>8);
				this.E = this.DE_ & 0xff;
				this.DE_ = tmp;
				tmp = (this.H<<8)+this.L;
				this.H = (this.HL_>>8);
				this.L = this.HL_ & 0xff;
				this.HL_ = tmp;
				break;

			case 0xeb:	// EX DE,HL
				tmp_h = this.D;		// can use tmp_h and tmp_l as ix,iy not affected.
				tmp_l = this.E;
				this.D = this.H;
				this.E = this.L;
				this.H = tmp_h;
				this.L = tmp_l;
				break;
				
			case 0xE3:	// ex (sp),hl
				tmp_h = this.H;
				tmp_l = this.L;
				tmp = this.SP;
				this.L = this.mem[tmp++];	tmp &= 0xffff;
				this.H = this.mem[tmp--]; tmp &= 0xffff;
				this.mem[tmp++] = tmp_l;	tmp &= 0xffff;
				this.mem[tmp] = tmp_h;
				break;

			case 0xF9:	// LD SP,HL
				this.SP = ((this.H<<8)+this.L) & 0xffff;
				break;

			case 0xcb:	// rotate & bit instructions.
				b = this.mem[this.PC++];	this.PC = this.PC & 0xffff;
				this.HL = ((this.H << 8) + this.L) & 0xffff;			// for memory operations.
				if (prefix != 0)
				{
					// offset is the byte after this.cb, with the code being the byte after.
					// for now, only dealing with the documented codes.
					d = b;								// d = offset value
					if (d >= 0x80)	d |= 0xffff00;	// quick sign extend d
					b = this.mem[this.PC++];	this.PC = this.PC & 0xffff;	// b = cb op code.	06,0e,16,1e,26,2e,....etc
					if (prefix == 0xdd)
					{
						this.HL = (this.IX + d) & 0xffff;				// HL is modified to use IX+d or IY+d
					}
					else
					{
						this.HL = (this.IY + d) & 0xffff;
					}

					prefix = 0;		// stop normal code from resetting hl.
				}
				this.t_states = 8; this.cycles = 2;	// default t-states.
				switch (b & 7)
				{
					case 0: tmp = this.B; break;
					case 1: tmp = this.C; break;
					case 2: tmp = this.D; break;
					case 3: tmp = this.E; break;
					case 4: tmp = this.H; break;
					case 5: tmp = this.L; break;
//					case 6: tmp = mem [((this.H<<8) + this.L +d) & 0xffff]; this.t_states = 15; this.cycles = 4; break;
					case 6: tmp = this.mem [this.HL]; this.t_states = 15; this.cycles = 4; break;
					case 7: tmp = this.A; break;
					default:	tmp = 0;	break;		// default just to shut the compiler up. (does nothing).
				}
				if (b < 0x40)	//  shift/rotate instruction.
				{
					switch (b & 0xF8)
					{
						case 0x00:		// RLC r
							tmp = ((tmp << 1) & 0xfe) | ((tmp>>7)&1);
							this.F = z80_flags_table[tmp] | (tmp&1);
							break;
						case 0x08:		// RRC r
							tmp = ((tmp >>  1) & 0x7f) | ((tmp<<7)&0x80);
							this.F = z80_flags_table[tmp] | ((tmp>>7)&1);
							break;
						case 0x10:		// RL r
							tmp = (tmp << 1) | (this.F&1);
							this.F = z80_flags_table[tmp & 0xff] | ((tmp>>8)&1);
							tmp = tmp & 0xff;
							break;
						case 0x18:		// RR r
							tmp = (tmp & 0xff) | ((this.F&1)<<8);		// stick the carry on the end.
							this.F = (tmp&1);							// update the carry flag.
							tmp = (tmp >> 1) & 0xff;
							this.F = this.F | z80_flags_table[tmp];
							break;
						case 0x20:		// SLA r
							this.F = (tmp>>7) & 1;
							tmp = (tmp << 1) & 0xfe;
							this.F = this.F | z80_flags_table[tmp];
							break;
						case 0x28:		// SRA r
							this.F = tmp & 1;
							tmp = (tmp & 0x80) | ((tmp>>1)&0x7f);
							this.F = this.F | z80_flags_table[tmp];
							break;
						case 0x30:		// SLS r		// 'undocumented' shift left set instruction. (aka SLL)
							this.F = (tmp>>7)&1;
							tmp = ((tmp << 1) & 0xfe) | 1;
							this.F = this.F | z80_flags_table[tmp];
							break;
						case 0x38:		// SRL r
							this.F = tmp & 1;
							tmp = (tmp >> 1) & 0x7f;
							this.F = this.F | z80_flags_table[tmp];
							break;
						default:
							this.t_states = 0;
							break;
					}
				}
				else		// b >= 0x40
				{
						// bit set/reset/test instructions.
					switch (b & 0xc0)
					{
						case 0x40:		// bit test instructions. (flag settings from http://www.z80.info/z80sflag.htm)

							this.F = (tmp & 28) | 0x10 | (this.F & 1);		// bits 5 and 3 from r,  N cleared, half carry set, carry preserved,
							if ( (tmp&(1<<((b>>3)&7))) == 0)	this.F |= 0x44;		// set Z if bit is zero, pv flag  set the same.
							if ( (((b>>3)&7) == 7) && ((tmp & 0x80) == 0x80)) this.F |= 0x80;	// set sign if n=7 and bit7 of tmp = 1

//							this.F = (tmp & 0xbc) | 16 | (this.F&1);		//0xbc = 1011 1100 | 16 as half carry flag set, (this.F&1) to preserve carry.
							break;
						case 0x80:		// bit resets	(flags unchanged).
							tmp = tmp & (0xff ^ ( 1 << ((b>>3)&7) ) );		// can't use '!' operator on ints.. how crap !
							break;
						case 0xc0:		// bit set instructions. 
							tmp = tmp | (1<<((b>>3)&7));
							break;
					}					
				}
				switch (b & 7)		// store result in register.
				{
					case 0: this.B = tmp; break;
					case 1: this.C = tmp; break;
					case 2: this.D = tmp; break;
					case 3: this.E = tmp; break;
					case 4: this.H = tmp; break;
					case 5: this.L = tmp; break;
//					case 6: mem [((this.H<<8) + this.L +d) & 0xffff] = tmp; break;
					case 6: this.mem [this.HL] = tmp; break;
					case 7: this.A = tmp; break;
					default: break;
				}
				break;		// end of this.cb instructions.

			default:		// unknown opcode
				console.log ("unknown opcode : " + b);
				this.t_states = 0;
				break;
		}


		if ((prefix != 0) && (d == 65536))
		{
			if (prefix == 0xdd)
			{
				this.IX = ((this.H<<8)+this.L) & 0xffff;
			}
			if (prefix == 0xfd)
			{
				this.IY = ((this.H<<8)+this.L) & 0xffff;
			}
			this.H = tmp_h;
			this.L = tmp_l;
		}
}


