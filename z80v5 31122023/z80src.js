// just some test source code to play with to see how the assembler
// works.. hopefully.

var CR = "\n";
var Z80_Test_SourceCode =
" ; test code to clear screen and draw a red dot"+CR+
" ; press assemble, then run."+CR+
" ; "+CR+
"	; screen character row addresses : "+CR+
"SCREEN_ADDR:	equ 0x4000"+CR+
""+CR+


"ink_black:		equ 0"+CR+
"ink_blue:		equ 1"+CR+
"ink_red:		equ 2"+CR+
"ink_magenta:	equ 3"+CR+
"ink_green:		equ 4"+CR+
"ink_cyan:		equ 5"+CR+
"ink_yellow:		equ 6"+CR+
"ink_white:		equ 7"+CR+

"paper_black:	equ 0"+CR+
"paper_blue:		equ 8	;(1<<3)"+CR+
"paper_red:		equ (2<<3)"+CR+
"paper_magenta:	equ (3<<3)"+CR+
"paper_green:	equ (4<<3)"+CR+
"paper_cyan:		equ (5<<3)"+CR+
"paper_yellow:	equ (6<<3)"+CR+
"paper_white:	equ 56	;(7<<3)"+CR+

"	org 24576 "+CR+
"	jp start		; 3 bytes"+CR+
""+CR+
"	defm 5			; add 5 bytes to align bitlist table"+CR+
"BITLIST	:	defm 8	"+CR+
""+CR+
""+CR+
"row_table:	defm (192*2)"+CR+
""+CR+
""+CR+
""+CR+
"InitBitTable:"+CR+
"	; inits the bit table to be somewhere in memory so that the following"+CR+
"	; code will work for reading bit positions as fast as possible:"+CR+
"	;	ld a, x coordinate"+CR+
"	;	ld hl,table"+CR+
"	;	and 7"+CR+
"	;	add a,l"+CR+
"	;	ld l,a"+CR+
"	;	ld a,(hl)"+CR+
"	"+CR+
"	ld hl, BITLIST"+CR+
"	ld b,8"+CR+
"	ld a,0x80"+CR+
"InitBitTable0:"+CR+
"	ld (hl),a"+CR+
"	inc l				; note, only need to inc l as table is within a 256 byte boundry (which is why its here!!)"+CR+
"	srl a"+CR+
"	djnz InitBitTable0"+CR+
"	ret"+CR+
""+CR+
""+CR+
"ClearScreen:"+CR+
"	; call with a = attribute byte."+CR+
"	push af"+CR+
"	xor a"+CR+
"	ld hl,16384"+CR+
"	ld de,16385"+CR+
"	ld (hl),a"+CR+
"	ld a,192"+CR+
"CLS0:"+CR+
"		; repeated ldi instructions apparently faster on real hardware."+CR+
"		; so dumping a line at a time"+CR+
"	ldi		; 0"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
""+CR+
"	ldi		; 8"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
""+CR+
"	ldi		; 16"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
""+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
"	ldi"+CR+
""+CR+
"	dec a"+CR+
"	jr nz,CLS0"+CR+
"	"+CR+
"	pop af"+CR+
"	ld (hl),a"+CR+
"	ld bc,767"+CR+
"	ldir"+CR+
"	ret"+CR+
""+CR+
""+CR+
"IncRow:"+CR+
"	; on entry hl = screen address"+CR+
"	; on exit hl = address of next (pixel) row down."+CR+
"	inc h"+CR+
"	ld a,h"+CR+
"	and 7"+CR+
"	ret nz"+CR+
"	ld a,l"+CR+
"	add a,32"+CR+
"	ld l,a"+CR+
"	ret c"+CR+
"	ld a,h"+CR+
"	sub 8"+CR+
"	ld h,a"+CR+
"	ret"+CR+
""+CR+
""+CR+
"InitRowTable:"+CR+
"	ld bc,192"+CR+
"	ld hl,row_table"+CR+
"	ld de,SCREEN_ADDR			;16384"+CR+
"IRT0:	"+CR+
"	ld (hl),e"+CR+
"	inc hl"+CR+
"	ld (hl),d"+CR+
"	inc hl"+CR+
"	ex de,hl"+CR+
"	call IncRow"+CR+
"	ex de,hl"+CR+
"	dec c"+CR+
"	jp nz, IRT0"+CR+
"	ret"+CR+
""+CR+
"DrawPixel:"+CR+
"	; call with c = x[0..255], e = y[0..191]"+CR+
"	; do tests to see if pixel is on screen "+CR+
""+CR+
"	ld a,e"+CR+
"	cp 192"+CR+
"	ret nc"+CR+
"	"+CR+
"	// get row address row to start drawing at"+CR+
"	ld d,0"+CR+
"	ld hl,row_table"+CR+
"	add hl,de"+CR+
"	add hl,de"+CR+
"	ld e,(hl)"+CR+
"	inc hl"+CR+
"	ld d,(hl)	; de = screen row address."+CR+
""+CR+
"	ld a,c"+CR+
""+CR+
";	srl a		;8		; 24 t states, 6 bytes."+CR+
";	srl a		;8"+CR+
";	srl a		;8"+CR+
"	rrca		;4		; replace slr a * 3, for slight optimisation!"+CR+
"	rrca		;4		; 5 bytes, 19 t states."+CR+
"	rrca		;4"+CR+
"	and 0x1F	;7"+CR+
""+CR+
"	ld h,0"+CR+
"	ld l,a"+CR+
"	add hl,de	;hl = screen address to draw pixel at."+CR+
"	ex de,hl"+CR+
""+CR+
";	ld hl,bit_table	; get bit info"+CR+
";	ld b,0"+CR+
";	ld a,c"+CR+
";	and 7"+CR+
";	ld c,a"+CR+
";	add hl,bc"+CR+
";	ld a,(hl)"+CR+
""+CR+
"	ld hl, BITLIST; BITLIST is a byte aligned table (7 bytes long)"+CR+
"	ld a,c"+CR+
"	and 7"+CR+
"	add a,l"+CR+
"	ld l,a"+CR+
"	ld a,(hl)"+CR+
""+CR+
"	ex de,hl"+CR+
"	or (hl)"+CR+
"	ld (hl),a"+CR+
"	ret"+CR+
""+CR+
"start:	di"+CR+
"	call InitBitTable"+CR+
"	call InitRowTable"+CR+
""+CR+
"	ld a,paper_white + ink_red"+CR+
"	call ClearScreen"+CR+
"	ld c,128"+CR+
"	ld e,96"+CR+
"	call DrawPixel"+CR+
"forever:	jr forever"
;
