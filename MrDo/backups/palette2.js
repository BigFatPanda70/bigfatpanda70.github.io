/*
	Title	:	Mr Do Palette Info.
	
	Version:		1.0	15th July 2017
	
	Author:	Nick Fleming
	
	Updated:	15th July 2017
	
	 Notes:
	-------
		This file just holds a simple array with red,green & blue values for a 256 colour palette.
		
	Yes, I could have done it the mame way and decoded the palette from the hardware + palette roms...
	
	but its just easier to have it as a single array when working with javascript.

	I've left some comments in from other emulators for reference to the original.
*/


/*
	// rom values from YAAME emulator .
var mrdocolour =
	[
		// palette (high bits)		(rom u2)
	0x00,0x0C,0x03,0x00,
	0x0F,0x0B,0x0C,0x3F,
	0x0D,0x0F,0x0F,0x0C,
	0x0C,0x3C,0x0C,0x30,
	0x0C,0x03,0x30,0x03,
	0x0C,0x0F,0x00,0x3F,
	0x03,0x1E,0x00,0x0F,
	0x37,0x36,0x0D,0x33,
		//  palette (low bits)		(rom t2)
	0x00,0x0C,0x03,0x00,
	0x0C,0x03,0x00,0x3F,
	0x0F,0x03,0x0F,0x3F,
	0x0C,0x0F,0x0F,0x3A,
	0x03,0x0F,0x00,0x0C,
	0x00,0x0F,0x3F,0x03,
	0x2A,0x0C,0x00,0x0A,
	0x0C,0x0E,0x3F,0x0F,
		// sprite color lookup table 
	0x00,0x97,0x71,0xF9,
	0x00,0x27,0xA5,0x13,
	0x00,0x32,0x77,0x3F,
	0x00,0xA7,0x72,0xF9,
	0x00,0x1F,0x9A,0x77,
	0x00,0x15,0x27,0x38,
	0x00,0xC2,0x55,0x69,
	0x00,0x7F,0x76,0x7A
];
*/


/*

var pal_red = [256];
var pal_green = [256];
var pal_blue = [256];

	// YAAME version - gives slightly different results to MAME.
function loadpal()
{
	var c,i,j;
	var bit0,bit1,bit2,bit3;

	for (i = 0;i < 64;i++)
	{
		for (j = 0;j < 4;j++)
		{
			bit0=(mrdocolour[4*(i/8)+j+32]>>1)&0x01;
			bit1=(mrdocolour[4*(i/8)+j+32])&0x01;
			bit2=(mrdocolour[4*(i%8)+j]>>1)&0x01;
			bit3=(mrdocolour[4*(i%8)+j])&0x01;
			pal_red[(4*i + j)] = 0x2c * bit0 + 0x37 * bit1 + 0x23 * bit2 + 0x59 * bit3;
			bit0=(mrdocolour[4*(i / 8) + j + 32] >> 3) & 0x01;
			bit1=(mrdocolour[4*(i / 8) + j + 32] >> 2) & 0x01;
			bit2=(mrdocolour[4*(i % 8) + j] >> 3) & 0x01;
			bit3=(mrdocolour[4*(i % 8) + j] >> 2) & 0x01;
			pal_green[(4*i + j)] = 0x2c * bit0 + 0x37 * bit1 + 0x23 * bit2 + 0x59 * bit3;
			bit0=(mrdocolour[4*(i / 8) + j + 32] >> 5) & 0x01;
			bit1=(mrdocolour[4*(i / 8) + j + 32] >> 4) & 0x01;
			bit2=(mrdocolour[4*(i % 8) + j] >> 5) & 0x01;
			bit3=(mrdocolour[4*(i % 8) + j] >> 4) & 0x01;
			pal_blue[(4*i + j)] = 0x2c * bit0 + 0x37 * bit1 + 0x23 * bit2 + 0x59 * bit3;
		}
	}
*/

// MAME version :

// **************************************************************************
//
//  Convert the color PROMs into a more useable format.
//
//  Mr. Do! has two 32 bytes palette PROM and a 32 bytes sprite color lookup
//  table PROM.
//  The palette PROMs are connected to the RGB output this way:

//  U2:
//  bit 7 -- unused
//        -- unused
//        -- 100 ohm resistor  -diode- BLUE
//        --  75 ohm resistor  -diode- BLUE
//        -- 100 ohm resistor  -diode- GREEN
//        --  75 ohm resistor  -diode- GREEN
//        -- 100 ohm resistor  -diode- RED
//  bit 0 --  75 ohm resistor  -diode- RED

//  T2:
//  bit 7 -- unused
//        -- unused
//        -- 150 ohm resistor  -diode- BLUE
//        -- 120 ohm resistor  -diode- BLUE
//        -- 150 ohm resistor  -diode- GREEN
//        -- 120 ohm resistor  -diode- GREEN
//        -- 150 ohm resistor  -diode- RED
//  bit 0 -- 120 ohm resistor  -diode- RED

//  200 ohm pulldown on all three components

// ************************************************************************** 

/*
function loadpal()
{
//	const uint8_t *color_prom = memregion("proms")->base();
	var i;

	var R1 = 150;
	var R2 = 120;
	var R3 = 100;
	var R4 = 75;
	var pull = 220;
	var pot=[16];
	var weight=[16];
	var potadjust = 0.7;   // diode voltage drop

	var a1,a2;
	var bits0, bits2;
	var r, g, b;

	for (i = 0x0f; i >= 0; i--)
	{
		var par = 0;

		if (i & 1) par += 1.0/R1;
		if (i & 2) par += 1.0/R2;
		if (i & 4) par += 1.0/R3;
		if (i & 8) par += 1.0/R4;
		if (par)
		{
			par = 1/par;
			pot[i] = pull/(pull+par) - potadjust;
		}
		else pot[i] = 0;

		weight[i] = 0xff * pot[i] / pot[0x0f];
		if (weight[i] < 0) weight[i] = 0;
	}

	for (i = 0; i < 0x100; i++)
	{
		a1 = ((i >> 3) & 0x1c) + (i & 0x03) + 0x20;
		a2 = ((i >> 0) & 0x1c) + (i & 0x03);

		// red component
		bits0 = (mrdocolour[a1] >> 0) & 0x03;
		bits2 = (mrdocolour[a2] >> 0) & 0x03;
		pal_red[i] = weight[bits0 + (bits2 << 2)];

		// green component 
		bits0 = (mrdocolour[a1] >> 2) & 0x03;
		bits2 = (mrdocolour[a2] >> 2) & 0x03;
		pal_green[i] = weight[bits0 + (bits2 << 2)];

		// blue component
		bits0 = (mrdocolour[a1] >> 4) & 0x03;
		bits2 = (mrdocolour[a2] >> 4) & 0x03;
		pal_blue[i] = weight[bits0 + (bits2 << 2)];
	}

	 //color_prom now points to the beginning of the lookup table
	color_prom += 0x40;

	//characters 
	for (i = 0; i < 0x100; i++)
		palette.set_pen_indirect(i, i);

	// sprites
	for (i = 0x100; i < 0x140; i++)
	{
		uint8_t ctabentry = color_prom[(i - 0x100) & 0x1f];

		if ((i - 0x100) & 0x20)
			ctabentry >>= 4;        // high 4 bits are for sprite color n + 8
		else
			ctabentry &= 0x0f;  // low 4 bits are for sprite color n 

		palette.set_pen_indirect(i, ctabentry + ((ctabentry & 0x0c) << 3));
	}
}
*/




	// data stored  red, green, blue....x256.
var MrDoPalette256 =
[
	0x00,0x00,0x00,0x00,0xfe,0x00,0xfe,0x00,0x00,0x00,0x00,0x00,0xb4,0xb4,0x00,0xb4,0xd4,0x00,0x58,0xb4,0x00,0xb4,0xb4,0xb4,
	0x00,0xb4,0x00,0xb4,0xfe,0x00,0xfe,0xb4,0x00,0x00,0xb4,0x00,0x00,0xb4,0x00,0x00,0xfe,0xb4,0x58,0xb4,0x00,0x00,0x00,0xb4,
	0x00,0xb4,0x00,0xb4,0x58,0x00,0x58,0x00,0xb4,0xb4,0x00,0x00,0x00,0xb4,0x00,0xb4,0xfe,0x00,0x58,0x00,0x00,0xb4,0xb4,0xb4,
	0xb4,0x00,0x00,0x3c,0xfe,0x00,0x58,0x00,0x00,0xb4,0xb4,0x00,0xb4,0x00,0xb4,0x3c,0xc0,0xb4,0xc0,0xb4,0x00,0xb4,0x00,0xb4,
	0x00,0x58,0x00,0x58,0xb4,0x00,0xb4,0x00,0x00,0x58,0x58,0x58,0xb4,0xfe,0x00,0xfe,0x3c,0x00,0x00,0xb4,0x00,0xfe,0xfe,0xfe,
	0x00,0xfe,0x00,0xfe,0xb4,0x00,0xb4,0xb4,0x00,0x58,0xfe,0x58,0x00,0xfe,0x00,0x58,0xb4,0xb4,0x00,0xb4,0x00,0x58,0x58,0xfe,
	0x00,0xfe,0x00,0xfe,0x00,0x00,0x00,0x00,0xb4,0xfe,0x58,0x58,0x00,0xfe,0x00,0xfe,0xb4,0x00,0x00,0x00,0x00,0xfe,0xfe,0xfe,
	0xb4,0x58,0x00,0xd4,0xb4,0x00,0x00,0x00,0x00,0xfe,0xfe,0x58,0xb4,0xc0,0xb4,0xd4,0x00,0xb4,0x00,0xb4,0x00,0xfe,0x58,0xfe,
	0x58,0x58,0x00,0x58,0xb4,0x00,0xfe,0x58,0x00,0x58,0x58,0x58,0xfe,0xfe,0x00,0xfe,0x3c,0x00,0x58,0xfe,0x00,0xfe,0xfe,0xfe,
	0xc0,0xfe,0x00,0xfe,0xb4,0x00,0xfe,0xfe,0x00,0x58,0xfe,0x58,0x58,0xfe,0x00,0x58,0xb4,0xb4,0x58,0xfe,0x00,0x58,0x58,0xfe,
	0x58,0xfe,0x00,0xfe,0x00,0x00,0x58,0x58,0xb4,0xfe,0x58,0x58,0x58,0xfe,0x00,0xfe,0xb4,0x00,0x58,0x58,0x00,0xfe,0xfe,0xfe,
	0xfe,0x58,0x00,0xd4,0xb4,0x00,0x58,0x58,0x00,0xfe,0xfe,0x58,0xfe,0xc0,0xb4,0xd4,0x00,0xb4,0xc0,0xfe,0x00,0xfe,0x58,0xfe,
	0x00,0x58,0x00,0x58,0xfe,0x00,0xfe,0x58,0x00,0x00,0x00,0x58,0xb4,0xfe,0x00,0xfe,0xd4,0x00,0x58,0xfe,0x00,0xe5,0xe5,0xfe,
	0x00,0xfe,0x00,0xfe,0xfe,0x00,0xfe,0xfe,0x00,0x00,0xe5,0x58,0x00,0xfe,0x00,0x58,0xfe,0xb4,0x58,0xfe,0x00,0x00,0x00,0xfe,
	0x00,0xfe,0x00,0xfe,0x58,0x00,0x58,0x58,0xb4,0xe5,0x00,0x58,0x00,0xfe,0x00,0xfe,0xfe,0x00,0x58,0x58,0x00,0xe5,0xe5,0xfe,
	0xb4,0x58,0x00,0xd4,0xfe,0x00,0x58,0x58,0x00,0xe5,0xe5,0x58,0xb4,0xc0,0xb4,0xd4,0xc0,0xb4,0xc0,0xfe,0x00,0xe5,0x00,0xfe,
	0x58,0x00,0x00,0x58,0xfe,0x00,0xb4,0x00,0x00,0x00,0x58,0x00,0xfe,0xb4,0x00,0xfe,0xd4,0x00,0x00,0xb4,0x00,0xb4,0xfe,0xb4,
	0xc0,0xb4,0x00,0xfe,0xfe,0x00,0xb4,0xb4,0x00,0x00,0xfe,0x00,0x58,0xb4,0x00,0x58,0xfe,0xb4,0x00,0xb4,0x00,0x00,0x58,0xb4,
	0x58,0xb4,0x00,0xfe,0x58,0x00,0x00,0x00,0xb4,0xb4,0x58,0x00,0x58,0xb4,0x00,0xfe,0xfe,0x00,0x00,0x00,0x00,0xb4,0xfe,0xb4,
	0xfe,0x00,0x00,0xd4,0xfe,0x00,0x00,0x00,0x00,0xb4,0xfe,0x00,0xfe,0x00,0xb4,0xd4,0xc0,0xb4,0x00,0xb4,0x00,0xb4,0x58,0xb4,
	0x00,0x00,0x00,0x58,0xfe,0x00,0xfe,0x58,0x58,0x58,0x00,0x00,0xb4,0xb4,0x00,0xfe,0xd4,0x00,0x58,0xfe,0x58,0xfe,0xb4,0xb4,
	0x00,0xb4,0x00,0xfe,0xfe,0x00,0xfe,0xfe,0x58,0x58,0xb4,0x00,0x00,0xb4,0x00,0x58,0xfe,0xb4,0x58,0xfe,0x58,0x58,0x00,0xb4,
	0x00,0xb4,0x00,0xfe,0x58,0x00,0x58,0x58,0xfe,0xfe,0x00,0x00,0x00,0xb4,0x00,0xfe,0xfe,0x00,0x58,0x58,0x58,0xfe,0xb4,0xb4,
	0xb4,0x00,0x00,0xd4,0xfe,0x00,0x58,0x58,0x58,0xfe,0xb4,0x00,0xb4,0x00,0xb4,0xd4,0xc0,0xb4,0xc0,0xfe,0x58,0xfe,0x00,0xb4,
	0x00,0x00,0x00,0x00,0xfe,0x00,0xb4,0x00,0x00,0x00,0x00,0x00,0xe5,0xe5,0x00,0xb4,0xd4,0x00,0x00,0xb4,0x00,0xe5,0xe5,0xb4,
	0x85,0xe5,0x00,0xb4,0xfe,0x00,0xb4,0xb4,0x00,0x00,0xe5,0x00,0x00,0xe5,0x00,0x00,0xfe,0xb4,0x00,0xb4,0x00,0x00,0x00,0xb4,
	0x00,0xe5,0x00,0xb4,0x58,0x00,0x00,0x00,0xb4,0xe5,0x00,0x00,0x00,0xe5,0x00,0xb4,0xfe,0x00,0x00,0x00,0x00,0xe5,0xe5,0xb4,
	0xe5,0x00,0x00,0x3c,0xfe,0x00,0x00,0x00,0x00,0xe5,0xe5,0x00,0xe5,0x85,0xe5,0x3c,0xc0,0xb4,0x00,0xb4,0x00,0xe5,0x00,0xb4,
	0x00,0x58,0x00,0x00,0xfe,0x00,0xfe,0x58,0x58,0x58,0x58,0x00,0xb4,0xfe,0x00,0xe5,0xd4,0x00,0x58,0xfe,0x58,0xfe,0xfe,0xb4,
	0x00,0xfe,0x00,0xe5,0xfe,0x00,0xfe,0xfe,0x58,0x58,0xfe,0x00,0x00,0xfe,0x00,0x00,0xfe,0xb4,0x58,0xfe,0x58,0x58,0x58,0xb4,
	0x00,0xfe,0x00,0xe5,0x58,0x00,0x58,0x58,0xfe,0xfe,0x58,0x00,0x00,0xfe,0x00,0xe5,0xfe,0x00,0x58,0x58,0x58,0xfe,0xfe,0xb4,
	0xb4,0x58,0x00,0xa6,0xfe,0x00,0x58,0x58,0x58,0xfe,0xfe,0x00,0xb4,0xc0,0xb4,0xa6,0xc0,0xb4,0xc0,0xfe,0x58,0xfe,0x58,0xb4
];

var PaletteBuffer;
var PaletteBuf32;
var PaletteBuf8;

function Palette_Init()
{
	var i;
	var idx;
	var red;
	var green;
	var blue;
	
	PaletteBuffer = new ArrayBuffer (256*4);				// 256 colours, 4 bytes per colour
	PaletteBuf32 = new Uint32Array (PaletteBuffer);

//	PaletteBuf8 = new Uint8ClampedArray (PaletteBuffer);

	i = 0;
	for (idx = 0; idx < 256; idx++)
	{
		red = MrDoPalette256[i++];
		green = MrDoPalette256[i++];
		blue = MrDoPalette256[i++];
		PaletteBuf32[idx] = (255<<24) | (blue<<16) | (green<<8) | red;		// (255<<24) = alpha value.
	}
}


