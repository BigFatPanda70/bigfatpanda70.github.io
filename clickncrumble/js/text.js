/*
	Title	:	Text routines for ScrBuffer structure.

	Info	:	Version 0.0	22nd January 2024

	Author	:	Nick Fleming

	Updated	:	22nd January 2024

	 Notes:
	---------

	Some simple routines that basically 'extend' the ScrBuffer object
	and add the ability to draw bitmap fonts .



	 font info array
	-----------------
		name
		metrics
		b64 image data
		first character index
		last char index

*/

var SCR_DEFAULT_FONT = null;

var Font8x8AsciiExtendedMetrics =
[
	// left, top, width, ascent, descent.
 0,0, 8, 8,0,      //     0   
8,0, 8, 8,0,      //     1   
16,0, 8, 8,0,      //     2   
24,0, 8, 8,0,      //     3   
32,0, 8, 8,0,      //     4   
40,0, 8, 8,0,      //     5   
48,0, 8, 8,0,      //     6   
56,0, 8, 8,0,      //     7   
0,8, 8, 8,0,      //     8   
8,8, 8, 8,0,      //     9   
16,8, 8, 8,0,      //     10   
24,8, 8, 8,0,      //     11   
32,8, 8, 8,0,      //     12   
40,8, 8, 8,0,      //     13   
48,8, 8, 8,0,      //     14   
56,8, 8, 8,0,      //     15   
0,16, 8, 8,0,      //     16   
8,16, 8, 8,0,      //     17   
16,16, 8, 8,0,      //     18   
24,16, 8, 8,0,      //     19   
32,16, 8, 8,0,      //     20   
40,16, 8, 8,0,      //     21   
48,16, 8, 8,0,      //     22   
56,16, 8, 8,0,      //     23   
0,24, 8, 8,0,      //     24   
8,24, 8, 8,0,      //     25   
16,24, 8, 8,0,      //     26   
24,24, 8, 8,0,      //     27   
32,24, 8, 8,0,      //     28   
40,24, 8, 8,0,      //     29   
48,24, 8, 8,0,      //     30   
56,24, 8, 8,0,      //     31   
0,32, 8, 8,0,      //     32   
8,32, 8, 8,0,      //     33   !
16,32, 8, 8,0,      //     34   "
24,32, 8, 8,0,      //     35   #
32,32, 8, 8,0,      //     36   $
40,32, 8, 8,0,      //     37   %
48,32, 8, 8,0,      //     38   &
56,32, 8, 8,0,      //     39   '
0,40, 8, 8,0,      //     40   (
8,40, 8, 8,0,      //     41   )
16,40, 8, 8,0,      //     42   *
24,40, 8, 8,0,      //     43   +
32,40, 8, 8,0,      //     44   ,
40,40, 8, 8,0,      //     45   -
48,40, 8, 8,0,      //     46   .
56,40, 8, 8,0,      //     47   /
0,48, 8, 8,0,      //     48   0
8,48, 8, 8,0,      //     49   1
16,48, 8, 8,0,      //     50   2
24,48, 8, 8,0,      //     51   3
32,48, 8, 8,0,      //     52   4
40,48, 8, 8,0,      //     53   5
48,48, 8, 8,0,      //     54   6
56,48, 8, 8,0,      //     55   7
0,56, 8, 8,0,      //     56   8
8,56, 8, 8,0,      //     57   9

//16,56, 8, 8,0,      //     58   :
18,56, 4, 8,0,      //     58   :

//24,56, 8, 8,0,      //     59   ;
26,56, 4, 8,0,      //     59   ;
	
32,56, 8, 8,0,      //     60   <
40,56, 8, 8,0,      //     61   =
48,56, 8, 8,0,      //     62   >
56,56, 8, 8,0,      //     63   ?
0,64, 8, 8,0,      //     64   @
8,64, 8, 8,0,      //     65   A
16,64, 8, 8,0,      //     66   B
24,64, 8, 8,0,      //     67   C
32,64, 8, 8,0,      //     68   D
40,64, 8, 8,0,      //     69   E
48,64, 8, 8,0,      //     70   F
56,64, 8, 8,0,      //     71   G
0,72, 8, 8,0,      //     72   H
8,72, 8, 8,0,      //     73   I
16,72, 8, 8,0,      //     74   J
24,72, 8, 8,0,      //     75   K
32,72, 8, 8,0,      //     76   L
40,72, 8, 8,0,      //     77   M
48,72, 8, 8,0,      //     78   N
56,72, 8, 8,0,      //     79   O
0,80, 8, 8,0,      //     80   P
8,80, 8, 8,0,      //     81   Q
16,80, 8, 8,0,      //     82   R
24,80, 8, 8,0,      //     83   S
32,80, 8, 8,0,      //     84   T
40,80, 8, 8,0,      //     85   U
48,80, 8, 8,0,      //     86   V
56,80, 8, 8,0,      //     87   W
0,88, 8, 8,0,      //     88   X
8,88, 8, 8,0,      //     89   Y
16,88, 8, 8,0,      //     90   Z
24,88, 8, 8,0,      //     91   [
32,88, 8, 8,0,      //     92   \
40,88, 8, 8,0,      //     93   ]
48,88, 8, 8,0,      //     94   ^
56,88, 8, 8,0,      //     95   _
0,96, 8, 8,0,      //     96   `
8,96, 8, 8,0,      //     97   a
16,96, 8, 8,0,      //     98   b
24,96, 8, 8,0,      //     99   c
32,96, 8, 8,0,      //     100   d
40,96, 8, 8,0,      //     101   e
48,96, 8, 8,0,      //     102   f
56,96, 8, 8,0,      //     103   g
0,104, 8, 8,0,      //     104   h

//8,104, 8, 8,0,      //     105   i
10,104, 4, 8,0,      //     105   i

16,104, 8, 8,0,      //     106   j
24,104, 8, 8,0,      //     107   k

//32,104, 8, 8,0,      //     108   l
34,104, 6, 8,0,      //     108   l

40,104, 8, 8,0,      //     109   m
48,104, 8, 8,0,      //     110   n
56,104, 8, 8,0,      //     111   o
0,112, 8, 8,0,      //     112   p
8,112, 8, 8,0,      //     113   q
16,112, 8, 8,0,      //     114   r
24,112, 8, 8,0,      //     115   s
32,112, 8, 8,0,      //     116   t
40,112, 8, 8,0,      //     117   u
48,112, 8, 8,0,      //     118   v
56,112, 8, 8,0,      //     119   w

//0,120, 8, 8,0,      //     120   x
0,120, 7, 8,0,      //     120   x

8,120, 8, 8,0,      //     121   y
16,120, 8, 8,0,      //     122   z
24,120, 8, 8,0,      //     123   {
32,120, 8, 8,0,      //     124   |
40,120, 8, 8,0,      //     125   }
48,120, 8, 8,0,      //     126   ~
56,120, 8, 8,0,      //     127 
0,128, 8, 8,0,      //     128 
8,128, 8, 8,0,      //     129
16,128, 8, 8,0,      //     130
24,128, 8, 8,0,      //     131
32,128, 8, 8,0,      //     132
40,128, 8, 8,0,      //     133
48,128, 8, 8,0,      //     134
56,128, 8, 8,0,      //     135
0,136, 8, 8,0,      //     136 
8,136, 8, 8,0,      //     137
16,136, 8, 8,0,      //     138
24,136, 8, 8,0,      //     139
32,136, 8, 8,0,      //     140
40,136, 8, 8,0,      //     141
48,136, 8, 8,0,      //     142
56,136, 8, 8,0,      //     143
0,144, 8, 8,0,      //     144 
8,144, 8, 8,0,      //     145 
16,144, 8, 8,0,      //     146
24,144, 8, 8,0,      //     147
32,144, 8, 8,0,      //     148
40,144, 8, 8,0,      //     149
48,144, 8, 8,0,      //     150
56,144, 8, 8,0,      //     151
0,152, 8, 8,0,      //     152 
8,152, 8, 8,0,      //     153
16,152, 8, 8,0,      //     154
24,152, 8, 8,0,      //     155
32,152, 8, 8,0,      //     156
40,152, 8, 8,0,      //     157
48,152, 8, 8,0,      //     158
56,152, 8, 8,0,      //     159
0,160, 8, 8,0,      //     160
8,160, 8, 8,0,      //     161   ¡
16,160, 8, 8,0,      //     162   ¢
24,160, 8, 8,0,      //     163   £
32,160, 8, 8,0,      //     164   ¤
40,160, 8, 8,0,      //     165   ¥
48,160, 8, 8,0,      //     166   ¦
56,160, 8, 8,0,      //     167   §
0,168, 8, 8,0,      //     168   ¨
8,168, 8, 8,0,      //     169   ©
16,168, 8, 8,0,      //     170   ª
24,168, 8, 8,0,      //     171   «
32,168, 8, 8,0,      //     172   ¬
40,168, 8, 8,0,      //     173   ­
48,168, 8, 8,0,      //     174   ®
56,168, 8, 8,0,      //     175   ¯
0,176, 8, 8,0,      //     176   °
8,176, 8, 8,0,      //     177   ±
16,176, 8, 8,0,      //     178   ²
24,176, 8, 8,0,      //     179   ³
32,176, 8, 8,0,      //     180   ´
40,176, 8, 8,0,      //     181   µ
48,176, 8, 8,0,      //     182   ¶
56,176, 8, 8,0,      //     183   ·
0,184, 8, 8,0,      //     184   ¸
8,184, 8, 8,0,      //     185   ¹
16,184, 8, 8,0,      //     186   º
24,184, 8, 8,0,      //     187   »
32,184, 8, 8,0,      //     188   ¼
40,184, 8, 8,0,      //     189   ½
48,184, 8, 8,0,      //     190   ¾
56,184, 8, 8,0,      //     191   ¿
0,192, 8, 8,0,      //     192   À
8,192, 8, 8,0,      //     193   Á
16,192, 8, 8,0,      //     194   Â
24,192, 8, 8,0,      //     195   Ã
32,192, 8, 8,0,      //     196   Ä
40,192, 8, 8,0,      //     197   Å
48,192, 8, 8,0,      //     198   Æ
56,192, 8, 8,0,      //     199   Ç
0,200, 8, 8,0,      //     200   È
8,200, 8, 8,0,      //     201   É
16,200, 8, 8,0,      //     202   Ê
24,200, 8, 8,0,      //     203   Ë
32,200, 8, 8,0,      //     204   Ì
40,200, 8, 8,0,      //     205   Í
48,200, 8, 8,0,      //     206   Î
56,200, 8, 8,0,      //     207   Ï
0,208, 8, 8,0,      //     208   Ð
8,208, 8, 8,0,      //     209   Ñ
16,208, 8, 8,0,      //     210   Ò
24,208, 8, 8,0,      //     211   Ó
32,208, 8, 8,0,      //     212   Ô
40,208, 8, 8,0,      //     213   Õ
48,208, 8, 8,0,      //     214   Ö
56,208, 8, 8,0,      //     215   ×
0,216, 8, 8,0,      //     216   Ø
8,216, 8, 8,0,      //     217   Ù
16,216, 8, 8,0,      //     218   Ú
24,216, 8, 8,0,      //     219   Û
32,216, 8, 8,0,      //     220   Ü
40,216, 8, 8,0,      //     221   Ý
48,216, 8, 8,0,      //     222   Þ
56,216, 8, 8,0,      //     223   ß
0,224, 8, 8,0,      //     224   à
8,224, 8, 8,0,      //     225   á
16,224, 8, 8,0,      //     226   â
24,224, 8, 8,0,      //     227   ã
32,224, 8, 8,0,      //     228   ä
40,224, 8, 8,0,      //     229   å
48,224, 8, 8,0,      //     230   æ
56,224, 8, 8,0,      //     231   ç
0,232, 8, 8,0,      //     232   è
8,232, 8, 8,0,      //     233   é
16,232, 8, 8,0,      //     234   ê
24,232, 8, 8,0,      //     235   ë
32,232, 8, 8,0,      //     236   ì
40,232, 8, 8,0,      //     237   í
48,232, 8, 8,0,      //     238   î
56,232, 8, 8,0,      //     239   ï
0,240, 8, 8,0,      //     240   ð
8,240, 8, 8,0,      //     241   ñ
16,240, 8, 8,0,      //     242   ò
24,240, 8, 8,0,      //     243   ó
32,240, 8, 8,0,      //     244   ô
40,240, 8, 8,0,      //     245   õ
48,240, 8, 8,0,      //     246   ö
56,240, 8, 8,0,      //     247   ÷
0,248, 8, 8,0,      //     248   ø
8,248, 8, 8,0,      //     249   ù
16,248, 8, 8,0,      //     250   ú
24,248, 8, 8,0,      //     251   û
32,248, 8, 8,0,      //     252   ü
40,248, 8, 8,0,      //     253   ý
48,248, 8, 8,0,      //     254   þ
56,248, 8, 8,0,      //     255   ÿ 
];



var Font8x8AsciiExtendedImageData =
"data:image/png;base64,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"+ 
"lFTkSuQmCC" ;

var _text_default_font_info =
[
	"8x8 ascii extended",			// font name
	Font8x8AsciiExtendedMetrics,	// metrics info
	Font8x8AsciiExtendedImageData,	// image data
	0,								// first character index
	255								// last character index.
];


ScrBuffer.prototype.loadFont = function (font_info_array)
{
	var f;
	var name;
	var metrics;
	var b64_img_data;
	var first_idx;
	var last_idx;
	var i;

	f = font_info_array;

	if (f == SCR_DEFAULT_FONT)
	{
		f = _text_default_font_info;
	}
	
	i = 0;
	name = f[i++];
	metrics = f[i++];
	b64_img_data = f[i++];
	first_idx = f[i++];
	last_idx = f[i++];
	
	this.font = new BITMAP_FONT_STRUCT (metrics, first_idx, last_idx, b64_img_data);
}

var aaach = 0;

ScrBuffer.prototype.drawCh = function (x, baseline_y, ch_code, r,g,b,a)
{
		// note that the y coordinate is the BASELINE y coord.

	var tx;
	var ty;
	var w;
	var h;
	var ch;
	
	var tx;
	var ty;
	var width;
	var height;
	var ascent;
	var descent;
	
	var font_height;
	
	var screen_y;

	if (this.font == null)
	{
		console.log ("font not loaded");
		return;
	}
	
	if (this.font.data == null)
	{
//		console.log ("font not loaded");
		return;		// font not yet loaded
	}
	
	if ((ch_code < this.font.first_idx) || (ch_code > this.font.last_idx))
	{
		return;		// character code not supported.
	}

	ch = (ch_code - this.font.first_idx) * 5;

	tx = this.font.metrics[ch+0];
	ty = this.font.metrics[ch+1];
	width = this.font.metrics[ch+2];
	ascent = this.font.metrics[ch+3];
	descent= this.font.metrics[ch+4];

	screen_y = baseline_y - ascent;

	height = ascent + descent;	// + 1;

//	height = 21;
	
//	if (ch_code != 65)	return;
	if (aaach < 1)
	{
		aaach++;
		console.log ("code:" + ch_code + " ch:" + ch);
		console.log ("tx:" + tx);
		console.log ("ty:" + ty);
		console.log ("w :" + width);
		console.log ("a :" + ascent);
		console.log ("d :" + descent);
		console.log ("h : " + height);
	}

//204,24,15,18,0,      // 33 A


//	this.drawScaledImage
	this.drawAlphaImage
		(x,screen_y,width,height,	// sx,sy,sw,sh
			tx,ty,width,height,		// tx,ty,tw,th

			this.font.data.data,
			this.font.img_width,
			this.font.img_height);	
}

ScrBuffer.prototype.charWidth = function (ch_code)
{
	var ch;
	var width;

	if ((ch_code < this.font.first_idx) || (ch_code > this.font.last_idx))
	{
		return;		// character code not supported.
	}
	
	ch = (ch_code - this.font.first_idx) * 5;

	width = this.font.metrics[ch+2];

	return width;
}

ScrBuffer.prototype.drawText = function (x, baseline_y, r,g,b,a, str)
{
	var k;
	var ch;
	var sx;
	var spacing;
	
	spacing = 1;

	sx = x;
	for (k = 0; k < str.length; k++)
	{
		ch = str.charCodeAt(k);

		this.drawCh (sx, baseline_y, ch, r,g,b,a);

		sx += this.charWidth(ch);
	}
}

ScrBuffer.prototype.textWidth = function (str)
{
	// returns the width of the text in pixels.
	var w;
	var k;
	var ch;
	
	w = 0;
	for (k = 0; k < str.length; k++)
	{
		ch = str.charCodeAt(k);
		w = w + this.charWidth(ch);
	}
	
	return w;
}

ScrBuffer.prototype.textHeight = function (str)
{
	// returns the height of string of text in pixels.
	
	console.log ("text.js : .textHeight: ** TO DO **");
	return 0;
}

/*
function _TextCh (scr, x, y, bitmap_font_info, ch_code)
{
		// raw text drawing code

	var idx;

	var tx;
	var ty;
	var iw;
	var ih;
	var img;
	var code;
	var width;
	var ascent;
	var descent;
	var screen_y;
	
	idx = IMG_FONT_GFX;
	if (Raw_GetImageData(idx) == null)	return;

	iw = Raw_GetImageData(idx).width;
	ih = Raw_GetImageData(idx).height;
	img = Raw_GetImageData(idx).data.data;

	code = ch_code * 5;
	
	font_height = 8;			// need to get this from the metrics really..
	
	tx = bitmap_font_info [idx + 0];			// (tx,ty) = (left,top) of character data.
	ty = bitmap_font_info [idx + 1];
	width = bitmap_font_info [idx + 2];		// width in pixels.
	ascent = bitmap_font_info [idx + 3];		// ascent from base line
	descent= bitmap_font_info [idx + 4];		// descent from base line.
	
	screen_y = y + font_height - ascent;
	
	ty += (font_height - ascent);
	
	height = ascent + descent + 1;

	_Scr.drawScaledImage
		(x,screen_y,width,height,	// sx,sy,sw,sh
			tx,ty,width,height,		// tx,ty,tw,th
			img,
			iw,
			ih);
}
*/

/*
var TEXT_FONT_CHAR_WIDTH = 8;		// for now, just do fixed width.
var TEXT_FONT_CHAR_HEIGHT = 8;

var TEXT_FLAGS_WRAP = 1;
var TEXT_FLAGS_CENTERED = 2;

var TEXT_FONT_MAX_CHARS = 128;
var TEXT_FONT_FIRST_VISIBLE_CHAR = 32;

function TEXT_FONT_CHAR()
{
	this.width = TEXT_FONT_CHAR_WIDTH;
	this.height = TEXT_FONT_CHAR_HEIGHT;
	this.tx;
	this.tw;
}

function TEXT_FONT()
{
	var i;

	this.ch = [];
	
	for (i  = 0; i < 
}

function TEXT_STRUCT()
{
	this.flags = 0;

	this.x = 0;
	this.y = 0;
	this.str = "";

	this.left = 0;
	this.right = 0;
}


function Text_DrawCh (font_info, x, y, ascii_code)
{
	var font_height;
	var height;
	var width;
	var tx;
	var ty;
	var ascent;
	var descent;
	var screen_y;

	var idx;
	idx = ascii_code - " ".charCodeAt(0);
	
	idx = idx * 5;
	
	font_height = 32;
	
	tx = MedFontInfo [idx + 0];			// (tx,ty) = (left,top) of character data.
	ty = MedFontInfo [idx + 1];
	width = MedFontInfo [idx + 2];		// width in pixels.
	ascent = MedFontInfo [idx + 3];		// ascent from base line
	descent= MedFontInfo [idx + 4];		// descent from base line.
	
	screen_y = y + font_height - ascent;
	
	ty += (font_height - ascent);
	
	height = ascent + descent + 1;
	
	Ctx.drawImage (FontM, tx,ty,width,height, x, screen_y,width,height);
	
}




function DrawCh (x, y, ascii_code)
{
	var font_height;
	var height;
	var width;
	var tx;
	var ty;
	var ascent;
	var descent;
	var screen_y;

	var idx;
	idx = ascii_code - " ".charCodeAt(0);
	
	idx = idx * 5;
	
	font_height = 32;
	
	tx = MedFontInfo [idx + 0];			// (tx,ty) = (left,top) of character data.
	ty = MedFontInfo [idx + 1];
	width = MedFontInfo [idx + 2];		// width in pixels.
	ascent = MedFontInfo [idx + 3];		// ascent from base line
	descent= MedFontInfo [idx + 4];		// descent from base line.
	
	screen_y = y + font_height - ascent;
	
	ty += (font_height - ascent);
	
	height = ascent + descent + 1;
	
	Ctx.drawImage (FontM, tx,ty,width,height, x, screen_y,width,height);
	
}

function DrawString (left_x, top_y, str)
{
	var x;
	var y;
	var ch_width;
	var ch_code;
	var spacing;
	var i;
	var idx;
	
	spacing = FONT_SPACING;
	x = left_x;
	y = top_y;
	for (i = 0; i < str.length; i++)
	{
		ch_code = str.charCodeAt(i);
		
		DrawCh (x,y, ch_code);
		
		idx = (ch_code-32) * 5;
		ch_width = MedFontInfo [ idx + 2];
		x += ch_width + spacing;
	}
}

function CalcStringWidth(str)
{
	var w;
	var ch;
	var i;
	var idx;
	
	if (str.length < 1)
	{
		return 0;
	}

	w = 0;
	for (i = 0; i < str.length; i++)
	{
		ch = str.charCodeAt(i) - " ".charCodeAt(0);
		idx = ch * 5;
		w = w + MedFontInfo [idx + 2];
	}
	
	w = w + (FONT_SPACING * (str.length-1));
	
	return w;
}

function DrawCenteredString (y, str)
{
	var w;
	var x;

	w = CalcStringWidth (str);
	x = Math.floor ((Cvs.width - w)/2);
	
	DrawString (x,y, str);
}

*/
