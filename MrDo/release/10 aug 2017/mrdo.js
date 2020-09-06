//
//
//	Mr Do :	Javascript stuff
//
//	Info	:	Version 0.0 	27th June 2017
//
//	Author:	Nick Fleming
//
//	Updated : 10th August 2017

/*

Notes: screen size = 192 x 240 (vertical)

Character Set Format Info:
	8*8 character size.
	512 characters
	2 bitplanes
	{array : bit offset of each bitplane}
	{array : bit offset of each horizontal pixel}
	{array : bit offset of each vertical pixel}
	charincrement distance between two consecutive elements (in bits)

---
drawgfx.h:
 these macros are useful in gfx_layouts 
#define STEP2(START,STEP)		(START),(START)+(STEP)
#define STEP4(START,STEP)		STEP2(START,STEP),STEP2((START)+2*(STEP),STEP)
#define STEP8(START,STEP)		STEP4(START,STEP),STEP4((START)+4*(STEP),STEP)
#define STEP16(START,STEP)		STEP8(START,STEP),STEP8((START)+8*(STEP),STEP)
#define STEP32(START,STEP) STEP16(START,STEP),STEP16((START)+16*(STEP),STEP)
---


#define STEP2(START,STEP)		(START),(START)+(STEP)
#define STEP4(START,STEP)		(START),(START)+(STEP),(START)+2*(STEP),(START)+2*(STEP)+STEP
#define STEP8(START,STEP)		STEP4(START,STEP),STEP4((START)+4*(STEP),STEP)

static const gfx_layout charlayout =	 
{
	8,8,												// 8 * 8 character size
	RGN_FRAC(1,2),
	2,													//2 bits per pixel ??
	{ RGN_FRAC(0,2), RGN_FRAC(1,2) },		// the 2 bit planes are separate ??
	{ STEP8(7,-1) },								// layout for pixels within char			7,6,5,4,3,2,1
	{ STEP8(0,8) },								// consecutive order as go down lines. 0,8,16,24,32,40,48,56
	8*8												// every char takes 8 consecutive bytes.
};

static const gfx_layout spritelayout =
{
	16,16,									// 16 * 16 sprites
	RGN_FRAC(1,1),							// 128 sprites
	2,											// 2 bits per pixel
	{ 4, 0 },								// 
	{ STEP4(0*8+3,-1), STEP4(1*8+3,-1), STEP4(2*8+3,-1), STEP4(3*8+3,-1) },
	{ STEP16(0,32) },
	64*8										// every sprite takes 64 consecutive bytes ???
};

another mame version :
static const gfx_layout charlayout =
{
	8,8,									// 8*8 characters
	512,									// 512 characters
	2,										// 2 bits per pixel
	{ 0, 512*8*8 },					// the two bitplanes are separated
	{ 7, 6, 5, 4, 3, 2, 1, 0 },
	{ 0*8, 1*8, 2*8, 3*8, 4*8, 5*8, 6*8, 7*8 },
	8*8	// every char takes 8 consecutive bytes 
};

	input port info
----------------------

	note : IP_ACTIVE_LOW - this means that when a button is pressed, the bit is set to zero. 
									when a button is not pressed, the bit is set to one.

	{ 0xa000, 0xa000, input_port_0_r },	// IN0 
	{ 0xa001, 0xa001, input_port_1_r },	// IN1 

	PORT_START	// IN0 
	PORT_BIT( 0x01, IP_ACTIVE_LOW, IPT_JOYSTICK_LEFT | IPF_4WAY )
	PORT_BIT( 0x02, IP_ACTIVE_LOW, IPT_JOYSTICK_DOWN | IPF_4WAY )
	PORT_BIT( 0x04, IP_ACTIVE_LOW, IPT_JOYSTICK_RIGHT | IPF_4WAY )
	PORT_BIT( 0x08, IP_ACTIVE_LOW, IPT_JOYSTICK_UP | IPF_4WAY )
	PORT_BIT( 0x10, IP_ACTIVE_LOW, IPT_BUTTON1 )
	PORT_BIT( 0x20, IP_ACTIVE_LOW, IPT_START1 )
	PORT_BIT( 0x40, IP_ACTIVE_LOW, IPT_START2 )
	PORT_BIT( 0x80, IP_ACTIVE_LOW, IPT_TILT )

	PORT_START	// IN1 
	PORT_BIT( 0x01, IP_ACTIVE_LOW, IPT_JOYSTICK_LEFT | IPF_4WAY | IPF_COCKTAIL )
	PORT_BIT( 0x02, IP_ACTIVE_LOW, IPT_JOYSTICK_DOWN | IPF_4WAY | IPF_COCKTAIL )
	PORT_BIT( 0x04, IP_ACTIVE_LOW, IPT_JOYSTICK_RIGHT | IPF_4WAY | IPF_COCKTAIL )
	PORT_BIT( 0x08, IP_ACTIVE_LOW, IPT_JOYSTICK_UP | IPF_4WAY | IPF_COCKTAIL )
	PORT_BIT( 0x10, IP_ACTIVE_LOW, IPT_BUTTON1 | IPF_COCKTAIL )
	PORT_BIT( 0x20, IP_ACTIVE_LOW, IPT_UNUSED )
	PORT_BIT( 0x40, IP_ACTIVE_LOW, IPT_COIN1 )
	PORT_BIT( 0x80, IP_ACTIVE_LOW, IPT_COIN2 )



		Interrupts
	---------------
		Not sure, but I think z80 IM 1 is used for a vertical blank interrupt (call to 0x38 every 60hz.. ???)
		
		
	 14th July
	------------
	Looking at how the colour palette is created from just two small 32 byte roms.
	- it looks way more complicated than I need for this emulator so I am just going to
	have a hard coded 256 colour lookup table for now (hopefully).

	 15th July 2017
	-----------------
		Moving palette stuff to a separate file and working on screen layout.
		
	SUCCESS !! screen layout working..have the words 'universal' and 'MR Do' visible.. wrong colours but
	IT WORKS !!

	 16th July 2017
	------------------
	Added some crude input routines .. and they appear to work too.. got the coin entry working
	and the one player start button actually clears the screen ! 

	 17th July 2017
	-----------------
		Attempting to get sprite positions working.

	Sprite data:
	
		Sprite date is stored at address 0x9000 and there are 64 available sprites. Each sprite is 16x16 pixels in size.

			4 bytes per sprite.
			
				  byte
					0			bits 0-6 = sprite number 0-127
					1			x coordinate (0-256)
					2			colour & flip info:
									bits 0-3 = colour info (0 to 16)
									bit 4 = y flip
									bit 5 = x flip.
					3			y coordinate (0-240)
	
	 10th August 2017
	-------------------
		off work with cracked rib.. working on code to flip sprites...
					
*/



var MyZ80 = new Z80();


//var Port_IN0 = 0xFF;
//var Port_IN1 = 0xFF;


var screenCanvas;
var screenCanvasCtx;
var screenWidth;
var screenHeight;
var screenImgData;		// reference to image data
var screenBuffer;
var screenArrayBuffer;
var screenData;
var screenBuf8;

var SpriteCanvas;
var SpriteCanvasCtx;
var SpriteScreenWidth;
var SpriteScreenHeight;
var SpriteScreenImgData;		// reference to image data
var SpriteScreenBuffer;
var SpriteScreenArrayBuffer;
var SpriteScreenData;
var SpriteScreenBuf8;

var FrameCounterID = "";

var GamePaused = false;

var GameScreenWidth = 192;
var GameScreenHeight=240;

var GFX_1 = 0;
var GFX_2 = 1;
var GFX_3 = 2;
var MAX_GFX_REGIONS = 3;

var TILESET_NUMBER_0 = 0;
var TILESET_NUMBER_1 = 1;

var GfxBuffer = [MAX_GFX_REGIONS];
var GfxBuf8 = [MAX_GFX_REGIONS];			// 8 bit view of GfxBuffer
//var GfxBuf32 = [MAX_GFX_REGIONS];		// 32 bit view of GfxBuffer

function Base64ToBuffer (rom_array, buffer, address_start, num_bytes_to_copy)
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
	var buf;
	var idx = address_start;
	
	var buf = buffer;
	
//	console.log ("-------:"+rom_length);
	for (lp = 0; lp < rom_array.length; lp++)
	{
		str = rom_array[lp];
//		console.log ("str.len:" + str.length);
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
			
			buf[idx++] = n1;
			buf[idx++] = n2;
			buf[idx++] = n3;
		}
	}
}

//function Palette_Load (rom_array, address_start, num_bytes_to_copy)
//{
//	Base64ToBuffer (rom_array, PaletteBuf8, address_start, num_bytes_to_copy);
//
//}

//function LoadPaletteRoms ()
//{
//	ROM_REGION( 0x0080, "proms", 0 )

//	PaletteBuffer = new ArrayBuffer (0x80);
//	PaletteBuf8 = new Uint8ClampedArray (PaletteBuffer);

//	Palette_Load (rom_u02, 0x0000, 0x020);
//	Palette_Load (rom_t02, 0x0020, 0x020);
//	Palette_Load (rom_f10, 0x0040, 0x020);
//	Palette_Load (rom_j10, 0x0060, 0x020);
//}

function GfxRam_Load (ram_index, rom_array, rom_length, address_start, num_bytes_to_copy)
{
	var gfx = GfxBuf8[ram_index];

	Base64ToBuffer (rom_array, gfx, address_start, num_bytes_to_copy);
}

function LoadGfxRoms ()
{
	// the MAME drivers specify 3 'ROM_REGION' blocks of memory for the graphics.
	// ROM_REGION( 0x2000, REGION_GFX1, ROMREGION_DISPOSE )
	// ROM_LOAD( "s8-09.bin",    0x0000, 0x1000, CRC(aa80c5b6) SHA1(76f9f90deb74598470e7ed565237da38dd07e4e9) )
	// ROM_LOAD( "u8-10.bin",    0x1000, 0x1000, CRC(d20ec85b) SHA1(9762bbe34d3fa209ea719807c723f57cb6bf4e01) )
 
	// ROM_REGION( 0x2000, REGION_GFX2, ROMREGION_DISPOSE )
	// ROM_LOAD( "r8-08.bin",    0x0000, 0x1000, CRC(dbdc9ffa) SHA1(93f29fc106283eecbba3fd69cf3c4658aa38ab9f) )
	// ROM_LOAD( "n8-07.bin",    0x1000, 0x1000, CRC(4b9973db) SHA1(8766c51a345a5e63446e65614c6f665ab5fbe0d7) )
 
	// ROM_REGION( 0x2000, REGION_GFX3, ROMREGION_DISPOSE )
	// ROM_LOAD( "h5-05.bin",    0x0000, 0x1000, CRC(e1218cc5) SHA1(d946613a1cf1c97f7533a4f8c2d0078d1b7daaa8) )
	// ROM_LOAD( "k5-06.bin",    0x1000, 0x1000, CRC(b1f68b04) SHA1(25709cd81c03df51f27cd730fecf86a1daa9e27e) )

	var i;
	
	for (i = 0; i < MAX_GFX_REGIONS; i++)
	{
		GfxBuffer[i] = new ArrayBuffer (0x2000);		// create buffer for raw data.
		GfxBuf8[i] = new Uint8ClampedArray (GfxBuffer[i]);
//		GfxBuf32[i] = new Uint32Array (GfxArrayBuffer[i]);
	}

	GfxRam_Load (GFX_1, rom_s8, rom_s8.length, 0x0000, 0x1000);
	GfxRam_Load (GFX_1, rom_u8, rom_u8.length, 0x1000, 0x1000);

	GfxRam_Load (GFX_2, rom_r8, rom_r8.length, 0x0000, 0x1000);
	GfxRam_Load (GFX_2, rom_n8, rom_n8.length, 0x1000, 0x1000);

	GfxRam_Load (GFX_3, rom_h5, rom_h5.length, 0x0000, 0x1000);
	GfxRam_Load (GFX_3, rom_k5, rom_k5.length, 0x1000, 0x1000);

}


	// ------------------ frame counter code -------------------
	
var time_start = new Date().getTime();
var frame_number;
var frames_per_second;

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
	
	document.getElementById (FrameCounterID).innerHTML = frames_per_second;
};

	// ---------------- end of frame counter stuff ---------------

	// --------------------------------------------------------------
	//					----		Screen Canvas Stuff		----
	// --------------------------------------------------------------

function InitScreenCanvas(canvas_name, sprite_canvas_name)
{
	var lp;
	var item;

	console.log ("canvas name  : " + canvas_name);
	console.log ("sprite canvas: " + sprite_canvas_name);
	
	screenCanvas = document.getElementById (canvas_name);
	
	console.log (screenCanvas);
	screenWidth = screenCanvas.width;
	screenHeight= screenCanvas.height;
	screenCanvasCtx = screenCanvas.getContext('2d');

	screenImgData = screenCanvasCtx.getImageData(0, 0, screenWidth, screenHeight);
	screenBuffer = screenImgData.data;
	
	screenArrayBuffer = new ArrayBuffer (screenImgData.data.length);
	screenBuf8 = new Uint8ClampedArray (screenArrayBuffer);
	screenData = new Uint32Array (screenArrayBuffer);
	
	// pixel test
	for (lp = 0; lp < (screenWidth * screenHeight); lp++)
	{
		screenData[lp] = 
						(255 << 24)	|		// alpha
						(lp << 16) |		// blue
						(255-lp <<  8) |		// green
						lp*lp;						// red
	}

	screenImgData.data.set (screenBuf8);
	screenCanvasCtx.putImageData(screenImgData, 0, 0);


//var SpriteCanvas;
//var SpriteCanvasCtx;
//var SpriteScreenWidth;
//var SpriteScreenHeight;
//var SpriteScreenImgData;		// reference to image data
//var SpriteScreenBuffer;
//var SpriteScreenArrayBuffer;
//var SpriteScreenData;
//var SpriteScreenBuf8;


	SpriteCanvas = document.getElementById (sprite_canvas_name);

	console.log (SpriteCanvas);
	SpriteScreenWidth = SpriteCanvas.width;
	SpriteScreenHeight= SpriteCanvas.height;
	SpriteCanvasCtx = SpriteCanvas.getContext('2d');

	SpriteScreenImgData = SpriteCanvasCtx.getImageData(0, 0, screenWidth, screenHeight);
//	SpriteScreenBuffer = SpriteScreenImgData.data;			// not required ???
	
	SpriteScreenArrayBuffer = new ArrayBuffer (SpriteScreenImgData.data.length);
	SpriteScreenBuf8 = new Uint8ClampedArray (SpriteScreenArrayBuffer);
	SpriteScreenData = new Uint32Array (SpriteScreenArrayBuffer);
	
	// pixel test
//	for (lp = 0; lp < (screenWidth * screenHeight); lp++)
//	{
//		SpriteScreenData[lp] = 
//						(255 << 24)	|		// alpha
//						(lp << 16) |		// blue
//						(255-lp <<  8) |		// green
//						lp*lp;						// red
//	}

	SpriteScreenImgData.data.set (SpriteScreenBuf8);
	SpriteCanvasCtx.putImageData(SpriteScreenImgData, 0, 0);
}

function DrawPalette()
{
	var i;
	var px;
	var py;
	var r;
	var c;
	var ink;
	var idx;
	
	i = 0;
	for (py = 0; py < 2; py++)
	{
		for (px = 0; px < 16; px++)
		{
			idx = ((py*8)*screenWidth)+(px*8);

			PaletteToRGB (i&31);

			for (r = 0; r < 8; r++)
			{
				for (c = 0; c < 8; c++)
				{
//					screenData[idx++] = PaletteBuf32 [i];	//(255 << 24) | (blue<<16) | (green<<8) | red;
					screenData[idx++] = (255 << 24) | (p_blue<<16) | (p_green<<8) | p_red;
				}
				idx += screenWidth - 8;
			}
			i++;
		}
	}
}

function DrawCh (ch, cx, cy, palette, gfx_rom_index)
{
		// draws a character onto the background screen.

	var r;
	var c;
	var scrink = [8];
	var i;
	var ch_byte0 = [8];
	var ch_byte1 = [8];
	var gfx;
	var idx;
	var i;
	
	if (cy >= 256)	return;
	if (cy < 0)	return;
	if (cx < 0)	return;
	
	if (ch >= 512)	return;

		// test palette.
		
	scrink[0] = PaletteBuf32[palette];
	scrink[1] = PaletteBuf32[palette+1];
	scrink[2] = PaletteBuf32[palette+2];
	scrink[3] = PaletteBuf32[palette+3];

	scrink [0] = (0<<24)|(192<<16)|(192<<8)|192;
	scrink [1] = (255<<24)|(128<<16)|(128<<8)|128;
	scrink [2] = (255<<24)|(64<<16)|(64<<8)|64;
	scrink [3] = (255<<24)|(255<<16)|(255<<8)|255;

//	scrink [4] = (255<<24)|(255<<16)|(0<<8)|255;
//	scrink [5] = (255<<24)|(0<<16)|(255<<8)|255;
//	scrink [6] = (255<<24)|(255<<16)|(255<<8)|0;
//	scrink [7] = (255<<24)|(255<<16)|(255<<8)|255;

	gfx =	GfxBuf8[gfx_rom_index];
 
	idx = (ch-1) * 8; 
			// 512 characters,
			
	// get the character data for a single character (16 bytes, 2 bytes per character row)
	// bit layout 7,6,5,4,3,2,1,0	
	// the bit planes are separate (so byte 1 is (512*8) bytes from byte 0) 
	ch_byte0[0] = gfx[idx];
	ch_byte1[0] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[1] = gfx[idx];
	ch_byte1[1] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[2] = gfx[idx];
	ch_byte1[2] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[3] = gfx[idx];
	ch_byte1[3] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[4] = gfx[idx];
	ch_byte1[4] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[5] = gfx[idx];
	ch_byte1[5] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[6] = gfx[idx];
	ch_byte1[6] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[7] = gfx[idx];
	ch_byte1[7] = gfx[idx+(512*8)];
	idx++;

	for (r = 7; r >= 0 ; r--)
	{
		i = cx + ((cy + r) * GameScreenWidth );
		screenData[i++] = scrink [ (ch_byte0[0]&1) + ((ch_byte1[0]<<1)&2) ];		ch_byte0[0] >>= 1; ch_byte1[0] >>=1;
		screenData[i++] = scrink [ (ch_byte0[1]&1) + ((ch_byte1[1]<<1)&2) ];		ch_byte0[1] >>= 1; ch_byte1[1] >>=1;
		screenData[i++] = scrink [ (ch_byte0[2]&1) + ((ch_byte1[2]<<1)&2) ];		ch_byte0[2] >>= 1; ch_byte1[2] >>=1;
		screenData[i++] = scrink [ (ch_byte0[3]&1) + ((ch_byte1[3]<<1)&2) ];		ch_byte0[3] >>= 1; ch_byte1[3] >>=1;
		screenData[i++] = scrink [ (ch_byte0[4]&1) + ((ch_byte1[4]<<1)&2) ];		ch_byte0[4] >>= 1; ch_byte1[4] >>=1;
		screenData[i++] = scrink [ (ch_byte0[5]&1) + ((ch_byte1[5]<<1)&2) ];		ch_byte0[5] >>= 1; ch_byte1[5] >>=1;
		screenData[i++] = scrink [ (ch_byte0[6]&1) + ((ch_byte1[6]<<1)&2) ];		ch_byte0[6] >>= 1; ch_byte1[6] >>=1;
		screenData[i++] = scrink [ (ch_byte0[7]&1) + ((ch_byte1[7]<<1)&2) ];		ch_byte0[7] >>= 1; ch_byte1[7] >>=1;
	}
}

function DrawAlphaCh (ch, cx, cy, palette, gfx_rom_index)
{
	var r;
	var c;
	var scrink = [8];
	var i;
	var ch_byte0 = [8];
	var ch_byte1 = [8];
	var gfx;
	var idx;
	var i;
	var ink;
	var n;

	if (cy >= 256)	return;
	if (cy < 0)	return;
	if (cx < 0)	return;
	
	if ((ch == 0) || (ch >= 512))	return;

	scrink[0] = PaletteBuf32[palette];
	scrink[1] = PaletteBuf32[palette+1];
	scrink[2] = PaletteBuf32[palette+2];
	scrink[3] = PaletteBuf32[palette+3];

		// test palette.
//	scrink [0] = (0<<24)|(255<<16)|(255<<8)|0;
//	scrink [1] = (255<<24)|(0<<16)|(255<<8)|0;
// scrink [2] = (255<<24)|(0<<16)|(0<<8)|255;
//	scrink [3] = (255<<24)|(255<<16)|(255<<8)|255;

	scrink [4] = (255<<24)|(255<<16)|(0<<8)|255;
	scrink [5] = (255<<24)|(0<<16)|(255<<8)|255;
	scrink [6] = (255<<24)|(255<<16)|(255<<8)|0;
	scrink [7] = (255<<24)|(255<<16)|(255<<8)|255;

	gfx =	GfxBuf8[gfx_rom_index];
 
	idx = ch * 8; 
			// 512 characters,
			
	// get the character data for a single character (16 bytes, 2 bytes per character row)
	// bit layout 7,6,5,4,3,2,1,0	
	// the bit planes are separate (so byte 1 is (512*8) bytes from byte 0) 
	ch_byte0[0] = gfx[idx];
	ch_byte1[0] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[1] = gfx[idx];
	ch_byte1[1] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[2] = gfx[idx];
	ch_byte1[2] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[3] = gfx[idx];
	ch_byte1[3] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[4] = gfx[idx];
	ch_byte1[4] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[5] = gfx[idx];
	ch_byte1[5] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[6] = gfx[idx];
	ch_byte1[6] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[7] = gfx[idx];
	ch_byte1[7] = gfx[idx+(512*8)];
	idx++;

	for (r = 7; r >= 0 ; r--)
	{
		i = cx + ((cy + r) * GameScreenWidth );
		
		for (n = 0; n < 8; n++)
		{
			ink = (ch_byte0[n]&1) + ((ch_byte1[n]<<1)&2);
			if (ink != 0) screenData[i] = scrink [ink];
			ch_byte0[n] >>= 1; ch_byte1[n] >>=1; i++;
		}


//		screenData[i++] = scrink [ (ch_byte0[0]&1) + ((ch_byte1[0]<<1)&2) ];		ch_byte0[0] >>= 1; ch_byte1[0] >>=1; i++;
//		screenData[i++] = scrink [ (ch_byte0[1]&1) + ((ch_byte1[1]<<1)&2) ];		ch_byte0[1] >>= 1; ch_byte1[1] >>=1; i++;
//		screenData[i++] = scrink [ (ch_byte0[2]&1) + ((ch_byte1[2]<<1)&2) ];		ch_byte0[2] >>= 1; ch_byte1[2] >>=1; i++;
//		screenData[i++] = scrink [ (ch_byte0[3]&1) + ((ch_byte1[3]<<1)&2) ];		ch_byte0[3] >>= 1; ch_byte1[3] >>=1; i++;
//		screenData[i++] = scrink [ (ch_byte0[4]&1) + ((ch_byte1[4]<<1)&2) ];		ch_byte0[4] >>= 1; ch_byte1[4] >>=1; i++;
//		screenData[i++] = scrink [ (ch_byte0[5]&1) + ((ch_byte1[5]<<1)&2) ];		ch_byte0[5] >>= 1; ch_byte1[5] >>=1; i++;
//		screenData[i++] = scrink [ (ch_byte0[6]&1) + ((ch_byte1[6]<<1)&2) ];		ch_byte0[6] >>= 1; ch_byte1[6] >>=1; i++;
//		screenData[i++] = scrink [ (ch_byte0[7]&1) + ((ch_byte1[7]<<1)&2) ];		ch_byte0[7] >>= 1; ch_byte1[7] >>=1; i++;
	}
}

var SprInk =
[
	// alpha | blue	 |green	 |red
	(0<<24)	|(0<<16)  |(0<<8)	 |0,
	(255<<24)|(255<<16)|(255<<8)|255,
	(255<<24)|(0<<16)  |(0<<8)	 |255,
	(255<<24)|(255<<16)|(0<<8)	 |0,

	(255<<24)|(64<<16)|(64<<8)	 	|64,
	(255<<24)|(128<<16)|(128<<8)	|128,
	(255<<24)|(192<<16)|(192<<8)	|192,
	(255<<24)|(255<<16)|(255<<8)	|255,

	(255<<24)|(64<<16)|(64<<8)	 	|64,
	(255<<24)|(128<<16)|(128<<8)	|128,
	(255<<24)|(192<<16)|(192<<8)	|192,
	(255<<24)|(255<<16)|(255<<8)	|255
];

function DrawSprite (sx, sy, xflip, yflip, sprite_id, color_info)
{
//	    16,16,  /* 16*16 sprites */
  //       128,    /* 128 sprites */
    //     2,      /* 2 bits per pixel */
     //    { 4, 0 },       /* the two bitplanes for 4 pixels are packed into one byte */
//         { 3, 2, 1, 0, 8+3, 8+2, 8+1, 8+0,
//                         16+3, 16+2, 16+1, 16+0, 24+3, 24+2, 24+1, 24+0 },
//         { 0*16, 2*16, 4*16, 6*16, 8*16, 10*16, 12*16, 14*16,
//                         16*16, 18*16, 20*16, 22*16, 24*16, 26*16, 28*16, 30*16 },
//         64*8    /* every sprite takes 64 consecutive bytes */


	// NOTE : not sure if palette is wrong or if bit values are reversed.

	var r;
	var c;
	var i;
	var idx;
	var lp;
	var gfx_idx;
	
	var gfx;
	
	var byten = [16];

	var scrink = [4];
	
	if ((sx < 0) || (sx >= 192))	return;

	scrink [0] = 0;	//(0<<24) | (0<<16)	 |(0<<8)	 |0;
	scrink [1] = (255<<24) | (255<<16)  |(255<<8)|255;
	scrink [2] = (255<<24) | (0<<16)  |(0<<8)	 |255;
	scrink [3] = (255<<24) | (255<<16)|(0<<8)	 |0;

	gfx =	GfxBuf8[2];

	idx = (sprite_id*64)+3;
	
	if (yflip == 0)
	{
		for (r = 0; r < 16; r += 4)
		{
			i = sx + ((sy + r) * GameScreenWidth );

			byten[0] = gfx[idx];
			byten[1] = gfx[idx+4];
			byten[2] = gfx[idx+8];
			byten[3] = gfx[idx+12];
			
			byten[4] = gfx[idx+16];
			byten[5] = gfx[idx+20];
			byten[6] = gfx[idx+24];
			byten[7] = gfx[idx+28];

			byten[8] = gfx[idx+32];
			byten[9] = gfx[idx+36];
			byten[10] = gfx[idx+40];
			byten[11] = gfx[idx+44];

			byten[12] = gfx[idx+48];
			byten[13] = gfx[idx+52];
			byten[14] = gfx[idx+56];
			byten[15] = gfx[idx+60];

			idx--;

			if (xflip == 0)
			{
				for (lp = 0; lp < 4; lp++)
				{
					for (c = 0; c < 16; c++)
					{
						byte0 = byten[c];
//					screenData[i++] = scrink [ ((byte0>>7)&1)+((byte0>>2)&2)]; byten[c] <<= 1;
						SpriteScreenData[i++] = scrink [ ((byte0>>3)&1)+((byte0>>6)&2)]; byten[c] <<= 1;
					}
					i += GameScreenWidth -16;
				}
			}
			else
			{
				for (lp = 0; lp < 4; lp++)
				{
					for (c = 15; c >= 0; c--)
					{
						byte0 = byten[c];
						SpriteScreenData[i++] = scrink [ ((byte0>>3)&1)+((byte0>>6)&2)]; byten[c] <<= 1;
					}
					i += GameScreenWidth -16;
				}
			}
		}
	}
	else
	{
			// 'vertical flip' - bit messy code. sorry. I really should preprocess the
			// sprites so I don't have to rotate them ??
	
		gfx_idx = (sprite_id*64);		// 64 bytes per sprite.

		for (r = 0; r < 16; r++)
		{
			i = sx + ((sy + r) * GameScreenWidth );
			if (xflip != 0)
			{
				for (c = 0; c < 16; c++)
				{
					idx = gfx_idx; 
					idx += (4*(15-c)); 				// 4 = 4 bytes per column (viewed sideways)
					idx += r>>2;	//(15-r)>>2;					// 4 bits per byte, so divide by 4 
					byte0 = gfx[idx] >> (r&3);		// get the byte + rotate the 2 bits per pixel into bits 4 and 0

					ink = (byte0&1)+((byte0>>3)&2);
					SpriteScreenData [i++] = scrink [ink];
				}
			}
			else
			{
				for (c = 0; c < 16; c++)
				{
					idx = gfx_idx; 
					idx += (4*c); 				// 4 = 4 bytes per column (viewed sideways)
					idx += r>>2;	//(15-r)>>2;					// 4 bits per byte, so divide by 4 
					byte0 = gfx[idx] >> (r&3);		// get the byte + rotate the 2 bits per pixel into bits 4 and 0

					ink = (byte0&1)+((byte0>>3)&2);
					SpriteScreenData [i++] = scrink [ink];
				}
			}
			i += GameScreenWidth -16;
		}
	}

/*

	var r;
	var c;
	var i;
	var byte0;
	var byte1;
	var byte2;
	var byte3;
	var gfx;
	var idx;
	var scrink = [8];

	gfx =	GfxBuf8[2];
	idx = sprite_id * 64;

	scrink [0] = (255<<24)|(0<<16)|(0<<8)|0;
	scrink [1] = (255<<24)|(0<<16)|(255<<8)|0;
	scrink [2] = (255<<24)|(0<<16)|(0<<8)|255;
	scrink [3] = (255<<24)|(255<<16)|(255<<8)|255;

	
	for (r = 15; r >= 0; r--)
	{
		byte0 = gfx[idx++];		byte1 = gfx[idx++];		byte2 = gfx[idx++];		byte3 = gfx[idx++];
		i = sx + ((sy + r) * GameScreenWidth );

			screenData[i++] = scrink [ (byte0&1)+((byte0>>3)&2)]; byte0 >>= 1;
			screenData[i++] = scrink [ (byte0&1)+((byte0>>3)&2)]; byte0 >>= 1;
			screenData[i++] = scrink [ (byte0&1)+((byte0>>3)&2)]; byte0 >>= 1;
			screenData[i++] = scrink [ (byte0&1)+((byte0>>3)&2)]; byte0 >>= 1;

			screenData[i++] = scrink [ (byte1&1)+((byte1>>3)&2)]; byte1 >>= 1;
			screenData[i++] = scrink [ (byte1&1)+((byte1>>3)&2)]; byte1 >>= 1;
			screenData[i++] = scrink [ (byte1&1)+((byte1>>3)&2)]; byte1 >>= 1;
			screenData[i++] = scrink [ (byte1&1)+((byte1>>3)&2)]; byte1 >>= 1;

			screenData[i++] = scrink [ (byte2&1)+((byte2>>3)&2)]; byte2 >>= 1;
			screenData[i++] = scrink [ (byte2&1)+((byte2>>3)&2)]; byte2 >>= 1;
			screenData[i++] = scrink [ (byte2&1)+((byte2>>3)&2)]; byte2 >>= 1;
			screenData[i++] = scrink [ (byte2&1)+((byte2>>3)&2)]; byte2 >>= 1;

			screenData[i++] = scrink [ (byte3&1)+((byte3>>3)&2)]; byte3 >>= 1;
			screenData[i++] = scrink [ (byte3&1)+((byte3>>3)&2)]; byte3 >>= 1;
			screenData[i++] = scrink [ (byte3&1)+((byte3>>3)&2)]; byte3 >>= 1;
			screenData[i++] = scrink [ (byte3&1)+((byte3>>3)&2)]; byte3 >>= 1;
	} 	
*/

}

/*
function DrawScreenCh (ch, cx, cy, gfx_rom_index)
{
	var r;
	var c;
	var scrink = [8];
	var i;
	var ch_byte0 = [8];
	var ch_byte1 = [8];
	var gfx;
	var idx;
	var i;

		// test palette.
	scrink [0] = (255<<24)|(0<<16)|(0<<8)|0;
	scrink [1] = (255<<24)|(255<<16)|(0<<8)|0;
	scrink [2] = (255<<24)|(0<<16)|(0<<8)|255;
	scrink [3] = (255<<24)|(255<<16)|(255<<8)|255;

	scrink [4] = (255<<24)|(255<<16)|(0<<8)|255;
	scrink [5] = (255<<24)|(0<<16)|(255<<8)|255;
	scrink [6] = (255<<24)|(255<<16)|(255<<8)|0;
	scrink [7] = (255<<24)|(255<<16)|(255<<8)|255;

	gfx =	GfxBuf8[gfx_rom_index];
 
	idx = ch * 8; 

	ch_byte0[0] = gfx[idx];
	ch_byte1[0] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[1] = gfx[idx];
	ch_byte1[1] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[2] = gfx[idx];
	ch_byte1[2] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[3] = gfx[idx];
	ch_byte1[3] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[4] = gfx[idx];
	ch_byte1[4] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[5] = gfx[idx];
	ch_byte1[5] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[6] = gfx[idx];
	ch_byte1[6] = gfx[idx+(512*8)];
	idx++;
	ch_byte0[7] = gfx[idx];
	ch_byte1[7] = gfx[idx+(512*8)];
	idx++;

	for (r = 0; r < 8; r++)
	{
		i = cx + ((cy + r) * GameScreenWidth );
		screenData[i++] = scrink [ (ch_byte0[0]&1) + ((ch_byte1[0]<<1)&2) ];		ch_byte0[0] >>= 1; ch_byte1[0] >>=1;
		screenData[i++] = scrink [ (ch_byte0[1]&1) + ((ch_byte1[1]<<1)&2) ];		ch_byte0[1] >>= 1; ch_byte1[1] >>=1;
		screenData[i++] = scrink [ (ch_byte0[2]&1) + ((ch_byte1[2]<<1)&2) ];		ch_byte0[2] >>= 1; ch_byte1[2] >>=1;
		screenData[i++] = scrink [ (ch_byte0[3]&1) + ((ch_byte1[3]<<1)&2) ];		ch_byte0[3] >>= 1; ch_byte1[3] >>=1;
		screenData[i++] = scrink [ (ch_byte0[4]&1) + ((ch_byte1[4]<<1)&2) ];		ch_byte0[4] >>= 1; ch_byte1[4] >>=1;
		screenData[i++] = scrink [ (ch_byte0[5]&1) + ((ch_byte1[5]<<1)&2) ];		ch_byte0[5] >>= 1; ch_byte1[5] >>=1;
		screenData[i++] = scrink [ (ch_byte0[6]&1) + ((ch_byte1[6]<<1)&2) ];		ch_byte0[6] >>= 1; ch_byte1[6] >>=1;
		screenData[i++] = scrink [ (ch_byte0[7]&1) + ((ch_byte1[7]<<1)&2) ];		ch_byte0[7] >>= 1; ch_byte1[7] >>=1;
	}
}
*/

function DrawScreen()
{
		// Modified from YAAME (because life is too short to figure out again what someone already has..
		// and the documentation for this is nonexistant anyway..)
		
		//	There are 2 tile mapped (character mapped) screens... each screen supports 512 tiles,
		// that can be coloured using 64 colour palettes.
		// 
		//	The lower 8 bits for each tile are stored at 0x8480 (background map) and 0x8C80 (foreground map)
		// the high bit for each tile is stored along with the palette data at 0x8480 (background) and 0x8880 (foreground)
		//

	// screen size = 192x256

	var y,x;
	var pos,pos2,pos3,pos4;
	var c;						// character number to display.
	var colour_code;
	var sprite_id;
	var xflip,yflip;
	
	var scrollx = MyZ80.mem[0xF800];		// not sure what this is for yet.

	pos=0x8C80;			// foreground tile map - one byte per tile (low 8 bits of character number to display)
	pos2=0x8880;		// colour map . . bit 7 = high bit of character number, bits 0..6 = colour palette info.

	pos3=0x8480;		// background tile map .. same layout as foreground
	pos4=0x8080;

		// background tiles first..
	for (x = 23; x >= 0; x--)
	{
		for (y = 31; y >= 0; y--)
		{
			c = MyZ80.mem[pos3] + ((MyZ80.mem[pos4]&0x80)<<1);
			col = (MyZ80.mem[pos4]&0x3F);
			DrawCh (c, x<<3, y<<3, col, TILESET_NUMBER_1);

//			{
//				drawtilenew(c+768,(y<<3)-scrollx,x<<3,ram[pos4]&0x7F,0,0,2);
//				DrawCh (c, y<<3-scrollx, x<<3, 0);
//				DrawCh (c+256, x<<3, y<<3, 1);
//			}
//			else
//			{
//				drawtilenew(c+512,(y<<3)-scrollx,x<<3,ram[pos4]&0x7F,0,0,2);
//				DrawCh (c, y<<3-scrollx, x<<3, 1);
//				DrawCh (c, x<<3, y<<3, 1);
//			}
			pos3++;
			pos4++;
		}
	}
		// .. then foreground.

	for (x = 0; x < 24; x++)
	{
		for (y = 31; y >= 0; y--)

//	for (y = 4; y <28; y++)
//	{
//		for (x = 31; x >-1; x--)
		{
			c = MyZ80.mem[pos] + ((MyZ80.mem[pos2]&0x80)<<1);
			col = (MyZ80.mem[pos2]&0x3F);

			if (c != 0) DrawAlphaCh (c, x<<3, y<<3, col, TILESET_NUMBER_0);

//			c = MyZ80.mem[pos];
//			if (MyZ80.mem[pos2]&0x80)
//			{
//				if (c != 0)
//				{
//					drawtilemasknew(c+256,y<<3,x<<3,ram[pos2]&0x7F,0,0,2);
//					DrawCh (c+256, x<<3, y<<3, 0);
//				}
	//		}
//			else
//			{
//				drawtilemasknew(c,y<<3,x<<3,ram[pos2]&0x7F,0,0,2);
//				DrawCh (c, x<<3, y<<3, 0);		// right rom for this screen.
//			}
			pos++;
			pos2++;
		}
	}
	
	// draw sprites
	for (c=0;c<64;c++)
	{
		if (MyZ80.mem[(c<<2)+0x9001]!=0)					// c << 2 = c * 4
		{
			x=224-MyZ80.mem[(c<<2)+0x9001];		// for some reason my x offset differs from yaame.. ??
			y=240-MyZ80.mem[(c<<2)+0x9003];

			xflip=MyZ80.mem[(c<<2)+0x9002]&0x20;
			yflip=MyZ80.mem[(c<<2)+0x9002]&0x10;
			colour_code=MyZ80.mem[(c<<2)+0x9002]&0xF;			// 4 bits of colour information ??? - why ????
			sprite_id = MyZ80.mem[(c<<2)+0x9000]&127;	// id = sprite number 0 to 127. 
//			console.log (xflip);
			if (x>=0 && y>0)
			{
				DrawSprite (x, y, xflip, yflip, sprite_id, colour_code);
			}
		}
	}
//	waitforsync();
//	blit(buffer,screen,32,0,0,0,192,256);
}

/*
//				drawspritenew(ram[(c<<2)+0x9000]&127,x,y,col,xflip,yflip,2);
//				DrawSprite (x, y, c);


	var r;
	var c;
	var ch;
	var cx;
	var cy;

	var fi;
	var bi;

	bi = 0x8000;
	fi = 0x8800;
	cx = 0;
	ch = 0;
	for (c = 0; c < 24; c++)
	{
		cy = 0;
		for (r = 0; r < 32; r++)			// there are 32 bytes per vertical 'column' ???
		{
			ch = MyZ80.mem[bi++];
			DrawScreenCh (ch, cx, cy, 1);

//			ch = MyZ80.mem[fi++];
//			if (ch != 0)
			{
//				DrawScreenCh (ch, cx, cy, 0);
			}

			cy += 8;
			ch++;
		}
		cx += 8;
	}
*/

/*	var i;
	var c;
	var r;
	var lp;
	var scrink = [4];
	
	var scrbyte;
	var idx;
	
	scrink [0] = (255<<24)|(255<<16)|(255<<8)|255;
	scrink [1] = (255<<24)|(255<<16)|(0<<8)|0;
	scrink [2] = (255<<24)|(0<<16)|(255<<8)|0;
	scrink [2] = (255<<24)|(0<<16)|(0<<8)|255;

	idx = 0x8000;
	i = 0; 
	for (r = 0; r < GameScreenHeight; r += 8)
	{
		for (c = 0; c < GameScreenWidth; c += 8)
		{
			i = (r*GameScreenWidth) + c;	//r * GameScreenWidth;
			idx = 0x8000 + c;
			for (lp = 0; lp < 8; lp++)
			{
				scrbyte = MyZ80.mem[idx]+MyZ80.mem[idx+512*8*8];
				//255<<24)|(r<<16)|(r<<8)|r;
				screenData[i++] = (scrink[scrbyte&3]);		scrbyte >>= 2;
				screenData[i++] = (scrink[scrbyte&3]);		scrbyte >>= 2;
				screenData[i++] = (scrink[scrbyte&3]);		scrbyte >>= 2;
				screenData[i++] = (scrink[scrbyte&3]);		scrbyte >>= 2;
				scrbyte = MyZ80.mem[idx++];
				screenData[i++] = (scrink[scrbyte&3]);		scrbyte >>= 2;
				screenData[i++] = (scrink[scrbyte&3]);		scrbyte >>= 2;
				screenData[i++] = (scrink[scrbyte&3]);		scrbyte >>= 2;
				screenData[i++] = (scrink[scrbyte&3]);		scrbyte >>= 2;
//				screenData[i++] = (scrink[scrbyte&1]);		scrbyte >>= 1;
//				screenData[i++] = (scrink[scrbyte&1]);		scrbyte >>= 1;
//				screenData[i++] = (scrink[scrbyte&1]);		scrbyte >>= 1;
//				screenData[i++] = (scrink[scrbyte&1]);		scrbyte >>= 1;
				i += GameScreenWidth-8;
			}
		}
	}
*/

/*	var i;
	var scrink = [2];
	var paper;
	var ink;

	ink[0] = 0;
	ink[1] = 
			(255 << 24)	|		// alpha
			(255 << 16) |		// blue
			(255 <<  8) |		// green
			255;						// red

	i = 0;
	for (dsrow = 0; dsrow < hpx; dsrow++)
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
*/


function LoadRom(rom_array, rom_array_length, address, num_bytes_to_write)
{
	Base64ToBuffer (rom_array, MyZ80.mem, address, num_bytes_to_write);
}

function LoadRoms()
{
		// based on MAME data
		// first 32K of normal memory = game data in ROM.
	
	LoadRom (rom_a4, rom_a4.length, 0x0000, 0x2000);
	LoadRom (rom_c4, rom_c4.length, 0x2000, 0x2000);
	LoadRom (rom_e4, rom_e4.length, 0x4000, 0x2000);
	LoadRom (rom_f4, rom_f4.length, 0x6000, 0x2000);
}

var ddd = 0;

function RunFullSpeed()
{
	var t_state_counter;

	t_state_counter = 0;
	MyZ80.StartMaskableInterrupt();		// generate vertical blank interrupt.

	while (t_state_counter < (14336+(192*224)+(12544)) )
	{
		MyZ80.EmZ80();
		t_state_counter += MyZ80.t_states;
	}

}

	// -------------------------
	//			-- Ports --
	// -------------------------


function SetDipSwitches()
{
	var port_in2;
	var port_in3;
	
		// dip switch 0.
	port_in2 = 0;
	
			// difficulty setting
	port_in2 |= 0x03;		// easy 
//	port_in2 |= 0x02;		// medium 
//	port_in2 |= 0x01;		// hard
//	port_in2 |= 0x00;		// hardest 

		// cheat ?? 
	port_in2 |= 0x04;		// off
	port_in2 |= 0x00;		// on.
	
		// Special ?? wtf >
	port_in2 |= 0x08;			// easy. 0 = hard.
//	port_in2 |= 0x00;			// easy.. 0 = hard.
	
		// Extra
	port_in2 |= 0x10;			// easy.. 0 = hard.
//	port_in2 |= 0x00;			// easy.. 0 = hard.

		// cabinet
//	port_in2 |= 0x20;			// cocktail , 0 = upright.
	port_in2 |= 0x00;			// cocktail , 0 = upright.

		// lives 
//	port_in2 |= 0x00;			// 2 lives.
	port_in2 |= 0xc0;			// 3 lives.
//	port_in2 |= 0x80;			// 4 lives.
//	port_in2 |= 0x40;			// 5 lives.


		// coin A & B.
	port_in3 = 0x55;			// one coin, one credit.. for both coin slots .. ?? 

	MyZ80.mem[0xA002] = port_in2;
	MyZ80.mem[0xA003] = port_in3;
}


function DoMemoryMappedPorts()
{
	var port_in0;		// 
	var port_in1;
	
//	 PORT_START_TAG("IN0")
//			PORT_BIT( 0x01, IP_ACTIVE_LOW, IPT_JOYSTICK_LEFT ) PORT_4WAY
//         PORT_BIT( 0x02, IP_ACTIVE_LOW, IPT_JOYSTICK_DOWN ) PORT_4WAY
//         PORT_BIT( 0x04, IP_ACTIVE_LOW, IPT_JOYSTICK_RIGHT ) PORT_4WAY
//         PORT_BIT( 0x08, IP_ACTIVE_LOW, IPT_JOYSTICK_UP ) PORT_4WAY
//         PORT_BIT( 0x10, IP_ACTIVE_LOW, IPT_BUTTON1 )
//         PORT_BIT( 0x20, IP_ACTIVE_LOW, IPT_START1 )
//         PORT_BIT( 0x40, IP_ACTIVE_LOW, IPT_START2 )
//         PORT_BIT( 0x80, IP_ACTIVE_LOW, IPT_TILT )

	port_in0 = 0xFF;
	if (KeyPressed (KEY_LEFT) == true)	port_in0 ^= 0x01;
	if (KeyPressed (KEY_DOWN) == true)	port_in0 ^= 0x02;
	if (KeyPressed (KEY_RIGHT) == true)	port_in0 ^= 0x04;
	if (KeyPressed (KEY_UP) == true)	port_in0 ^= 0x08;
	if (KeyPressed (KEY_S) == true)	port_in0 ^= 0x10;
	if (KeyPressed (KEY_1) == true)	port_in0 ^= 0x20;
	if (KeyPressed (KEY_2) == true)	port_in0 ^= 0x40;
//	if (KeyPressed (KEY_UP) == true)	port_in0 ^= 0x08;		// tilt never set :-)

//       PORT_START_TAG("IN1")
//         PORT_BIT( 0x01, IP_ACTIVE_LOW, IPT_JOYSTICK_LEFT ) PORT_4WAY PORT_COCKTAIL
//         PORT_BIT( 0x02, IP_ACTIVE_LOW, IPT_JOYSTICK_DOWN ) PORT_4WAY PORT_COCKTAIL
//         PORT_BIT( 0x04, IP_ACTIVE_LOW, IPT_JOYSTICK_RIGHT ) PORT_4WAY PORT_COCKTAIL
//         PORT_BIT( 0x08, IP_ACTIVE_LOW, IPT_JOYSTICK_UP ) PORT_4WAY PORT_COCKTAIL
//         PORT_BIT( 0x10, IP_ACTIVE_LOW, IPT_BUTTON1 ) PORT_COCKTAIL
//         PORT_BIT( 0x20, IP_ACTIVE_LOW, IPT_UNUSED )
//         PORT_BIT( 0x40, IP_ACTIVE_LOW, IPT_COIN1 )
//         PORT_BIT( 0x80, IP_ACTIVE_LOW, IPT_COIN2 )

	port_in1 = 0xFF;		// only 1 joystick for mr do machines.
	if (KeyPressed (KEY_5) == true)	port_in1 ^= 0x40;		// key 5 = insert coin.	

	MyZ80.mem[0xA000] = port_in0;
	MyZ80.mem[0xA001] = port_in1;
}

function ClearSpriteCanvas()
{
	var i;
	
	i = 0;
	while (i < (192*256))
	{
		SpriteScreenData[i++] = 0;	
	}
}


function ColourTest ()
{
	inks= [0x00,0x97,0x71,0xF9,			// 32 colours ??
			0x00,0x27,0xA5,0x13,
			0x00,0x32,0x77,0x3F,
			0x00,0xA7,0x72,0xF9,
			0x00,0x1F,0x9A,0x77,
			0x00,0x15,0x27,0x38,
			0x00,0xC2,0x55,0x69,
			0x00,0x7F,0x76,0x7A];
}

function GameLoop ()
{
	var sx;
	var sy;
	var i;
	var tmp_pc;

	requestAnimationFrame (GameLoop);
	UpdateFrameCounter();

	if (ddd > 0)
	{
		ddd--;
	}
	else 
	{
//			RunFullSpeed();

//AM_RANGE(0x9803, 0x9803) AM_READ(mrdo_SECRE_r)	0x9803
//return RAM[ activecpu_get_reg(Z80_HL) ];
			MyZ80.mem[0x9803] = MyZ80.mem [MyZ80.HL & 0xffff];
			DoMemoryMappedPorts();

//			DBG_AsmView();
//			DBG_MemView(MyZ80.PC);
//			DBG_MemView(0x8800);
//			DBG_RegView();
			ddd = 0;

/*			
			if (KeyPressed (KEY_I) == true)
			{
				MyZ80.StartMaskableInterrupt();			
				KeyClear (KEY_I);
			}
			
			if (KeyPressed (KEY_E) == true)
			{
				MyZ80.EmZ80();
				if ((MyZ80.mem[MyZ80.PC] == 0xED) && (MyZ80.mem[MyZ80.PC+1] == 0xB0))
				{
					tmp_pc = MyZ80.PC;
					while (tmp_pc == MyZ80.PC)
					{
						MyZ80.EmZ80();
					} 
				}
				KeyClear (KEY_E);
			}
*/
			if (KeyPressed (KEY_P) == true)
			{
				if (GamePaused == true)
				{
					GamePaused = false;
				}
				else 
				{
					GamePaused = true;
				}
				KeyClear (KEY_P);
			}

			if (GamePaused == false)
			{			
//			for (lp = 0; lp < 32000; lp++)

				// process a 'frames worth' of instructions all in one go.
				for (lp = 0; lp < 64000; lp++)
				{
					MyZ80.EmZ80();
				}
				MyZ80.StartMaskableInterrupt();		// start vertical blank interrupt.
			}			
	}

	ClearSpriteCanvas();
	DrawScreen();
//	DrawSprites();

	DrawPalette();

	screenImgData.data.set (screenBuf8);
	screenCanvasCtx.putImageData(screenImgData, 0, 0);

	SpriteScreenImgData.data.set (SpriteScreenBuf8);
	SpriteCanvasCtx.putImageData(SpriteScreenImgData, 0, 0);
}

/*function DumpHex(n)
{
	if (n < 10)
	{
		document.write ("0x0");
	}
	else 
	{
		document.write ("0x");
	}
	document.write (Math.floor(n).toString(16));
}
function PaletteDump()
{
	var lp;
	for (lp = 0; lp < 256; lp++)
	{
		DumpHex (pal_red[lp]);
		document.write (",");
		DumpHex (pal_green[lp]);
		document.write (",");
		DumpHex (pal_blue[lp]);
		if (lp < 255)	document.write (",");
//		document.write ("<br>");
		if ((lp & 7) == 7)	document.write ("<br>");
	}
}
*/

function InitGame(canvas_id, sprite_canvas_id, frame_counter_div_id)
{
	LoadRoms();
	LoadGfxRoms ();

//	LoadPaletteRoms ();
//	loadpal();
//	PaletteDump();

	Palette_Init();
	
	SetDipSwitches();

	InitScreenCanvas(canvas_id, sprite_canvas_id);
	FrameCounterID = frame_counter_div_id;

	requestAnimationFrame (GameLoop);
}

