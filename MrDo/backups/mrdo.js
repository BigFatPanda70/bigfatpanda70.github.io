//
//	Mr Do :	Javascript stuff
//
//	Info	:	Version 0.0 	27th June 2017
//
//	Author:	Nick Fleming
//
//	Updated : 4th July 2017

/*

Notes: screen size = 192 x 240 (vertical)

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




*/
 
var MyZ80 = new Z80();

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

var GameScreenWidth = 192;
var GameScreenHeight=240;

var GFX_1 = 0;
var GFX_2 = 1;
var GFX_3 = 2;
var MAX_GFX_REGIONS = 3;

var GfxBuffer = [MAX_GFX_REGIONS];
var GfxBuf8 = [MAX_GFX_REGIONS];			// 8 bit view of GfxBuffer
//var GfxBuf32 = [MAX_GFX_REGIONS];		// 32 bit view of GfxBuffer

var PaletteBuffer;
var PaletteBuf8;

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

function Palette_Load (rom_array, address_start, num_bytes_to_copy)
{
	Base64ToBuffer (rom_array, PaletteBuf8, address_start, num_bytes_to_copy);

}

function LoadPaletteRoms ()
{
//	ROM_REGION( 0x0080, "proms", 0 )

	PaletteBuffer = new ArrayBuffer (0x80);
	PaletteBuf8 = new Uint8ClampedArray (PaletteBuffer);

	Palette_Load (rom_u02, 0x0000, 0x020);
	Palette_Load (rom_t02, 0x0020, 0x020);
	Palette_Load (rom_f10, 0x0040, 0x020);
	Palette_Load (rom_j10, 0x0060, 0x020);
}


function GfxRam_Load (ram_index, rom_array, rom_length, address_start, num_bytes_to_copy)
{
		// based on https://en.wikipedia.org/wiki/Base64
	
	// aaaaaabb bbbbcccc ccdddddd
	// ===n1===|===n2===|===n3===
	
//	var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
//	var str;
//	var a;	var b;	var c;	var d;
//	var n1;	var n2;	var n3;
//	var i;
//	var lp; var lp2;
//	var idx = address_start;
	
	var gfx = GfxBuf8[ram_index];

	Base64ToBuffer (rom_array, gfx, address_start, num_bytes_to_copy);
/*
	
//	console.log ("-------:"+rom_length);
	for (lp = 0; lp < rom_length; lp++)
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
			
			gfx[idx++] = n1;
			gfx[idx++] = n2;
			gfx[idx++] = n3;
		}
	}
*/
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
	for (lp = 0; lp < (screenWidth * screenHeight); lp++)
	{
		SpriteScreenData[lp] = 
						(255 << 24)	|		// alpha
						(lp << 16) |		// blue
						(255-lp <<  8) |		// green
						lp*lp;						// red
	}

	SpriteScreenImgData.data.set (SpriteScreenBuf8);
	SpriteCanvasCtx.putImageData(SpriteScreenImgData, 0, 0);

}

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
	
	if (ch >= 512)	return;

		// test palette.
	scrink [0] = (255<<24)|(0<<16)|(0<<8)|0;
	scrink [1] = (255<<24)|(0<<16)|(255<<8)|0;
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

function DrawSprite (sx, sy, sprite_id)
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
	
	var gfx;

	var byten = [16];

	var scrink = [4];

	scrink [0] = 0;	//(0<<24) | (0<<16)	 |(0<<8)	 |0;
	scrink [1] = (255<<24) | (255<<16)  |(255<<8)|255;
	scrink [2] = (255<<24) | (0<<16)  |(0<<8)	 |255;
	scrink [3] = (255<<24) | (255<<16)|(0<<8)	 |0;

	gfx =	GfxBuf8[2];

	idx = (sprite_id*64)+3;

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

	var r;
	var c;
	var ch;
	var cx;
	var cy;

	ch = 0;
	cy = 0;
	for (r = 0; r < 30; r++)
	{
		cx = 0;
		for (c = 0; c < 24; c++)
		{
			DrawScreenCh (ch, cx, cy, 1);
			cx += 8;
			ch++;
		}
		cy += 8;
	}
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
*/
}

function LoadRom(rom_array, rom_array_length, address, num_bytes_to_write)
{
	// based on https://en.wikipedia.org/wiki/Base64
	
	// aaaaaabb bbbbcccc ccdddddd
	// ===n1===|===n2===|===n3===

	Base64ToBuffer (rom_array, MyZ80.mem, address, num_bytes_to_write);
/*
	var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var str;
	var a;	var b;	var c;	var d;
	var n1;	var n2;	var n3;
	var i;
	var lp; var lp2;
	var idx = address;
	
//	console.log ("-------:"+rom_array_length);
	for (lp = 0; lp < rom_array_length; lp++)
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
			
			if ((lp == 0) && (lp2 == 0))
			{
//				console.log ("n1,n2,n3:"+n1+","+n2+","+n3);
			}
			MyZ80.mem[idx++] = n1;
			MyZ80.mem[idx++] = n2;
			MyZ80.mem[idx++] = n3;
		}
	}
*/
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

function GameLoop ()
{
	var sx;
	var sy;
	var i;

	requestAnimationFrame (GameLoop);
	UpdateFrameCounter();

	if (ddd > 0)
	{
		ddd--;
	}
	else 
	{
			DBG_AsmView();
			DBG_MemView();
			DBG_RegView();
			ddd = 0;
			for (lp = 0; lp < 192; lp++)
			{
				MyZ80.EmZ80();
			}

	}

	DrawScreen();

	sx = 0;
	sy = 0;	
	for (i = 0; i < 128; i++)
	{
		DrawSprite (sx, sy, i);
		sx += 16;
		if (sx >= 224)
		{
			sx = 0;
			sy += 16;
		}
	}
	screenImgData.data.set (screenBuf8);
	screenCanvasCtx.putImageData(screenImgData, 0, 0);

	SpriteScreenImgData.data.set (SpriteScreenBuf8);
	SpriteCanvasCtx.putImageData(SpriteScreenImgData, 0, 0);
}


function InitGame(canvas_id, sprite_canvas_id, frame_counter_div_id)
{
	LoadRoms();
	LoadGfxRoms ();
	LoadPaletteRoms ();

	InitScreenCanvas(canvas_id, sprite_canvas_id);
	FrameCounterID = frame_counter_div_id;

	requestAnimationFrame (GameLoop);
}

