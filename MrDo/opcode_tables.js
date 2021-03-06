var single_opcode_table = 
[
	"nop",			// 0
	"*ld bc,MM",				// 1
	"ld (bc),a",	// 2
	"inc bc",		// 3
	"inc b",			// 4
	"dec b",			// 5
	"*ld b,N",				// 6
	"rlca",			// 7
	"ex af,af'",	// 8
	"add hl,bc",	// 9
	"ld a,(bc)",	// 10
	"dec bc",		// 11
	"inc c",			// 12
	"dec c",			// 13
	"*ld c,N*",				// 14
	"rrca",			// 15
	"*djnz N",				// 16
	"*ld de,MM",				// 17
	"ld (de),a",				// 18
	"inc de",		// 19
	"inc d",			// 20
	"dec d",			// 21
	"*ld d,N",				// 22
	"rla",			// 23
	"*jr N",				// 24
	"add hl,de",	// 25
	"ld a,(de)",	// 26
	"dec de",		// 27
	"inc e",			// 28
	"dec e",			// 29
	"*ld e,N",				// 30
	"rra",			// 31
	"*jr nz,N",				// 32
	"*ld hl,MM",				// 33
	"*ld (MM),hl",				// 34
	"inc hl",		// 35
	"inc h",			// 36
	"dec h",			// 37
	"*ld h,N",				// 38
	"daa",			// 39
	"*jr z,N",				// 40
	"add hl,hl",	// 41
	"*ld hl,(MM)",				// 42
	"dec hl",		// 43
	"inc l",	// 44
	"dec l",	// 45
	"*ld l,N",	// 46
	"cpl",	// 47
	"*jr nc,N",	// 48
	"*ld sp,MM",	// 49
	"*ld (MM),a",	// 50
	"inc sp",	// 51
	"inc (hl)",	// 52
	"dec (hl)",	// 53
	"*ld (hl),N",	// 54
	"scf",	// 55
	"*jr c,N",	// 56
	"add hl,sp",	// 57
	"*ld a,(MM)",	// 58
	"dec sp",	// 59
	"inc a",	// 60
	"dec a",	// 61
	"*ld a,N",	// 62
	"ccf",	// 63
	"ld b,b",	// 64
	"ld b,c",	// 65
	"ld b,d",	// 66
	"ld b,e",	// 67
	"ld b,h",	// 68
	"ld b,l",	// 69
	"ld b,(hl)",	// 70
	"ld b,a",	// 71
	"ld c,b",	// 72
	"ld c,c",	// 73
	"ld c,d",	// 74
	"ld c,e",	// 75
	"ld c,h",	// 76
	"ld c,l",	// 77
	"ld c,(hl)",	// 78
	"ld c,a",	// 79
	"ld d,b",	// 80
	"ld d,c",	// 81
	"ld d,d",	// 82
	"ld d,e",	// 83
	"ld d,h",	// 84
	"ld d,l",	// 85
	"ld d,(hl)",	// 86
	"ld d,a",	// 87
	"ld e,b",	// 88
	"ld e,c",	// 89
	"ld e,d",	// 90
	"ld e,e",	// 91
	"ld e,h",	// 92
	"ld e,l",	// 93
	"ld e,(hl)",	// 94
	"ld e,a",	// 95
	"ld h,b",	// 96
	"ld h,c",	// 97
	"ld h,d",	// 98
	"ld h,e",	// 99
	"ld h,h",	// 100
	"ld h,l",	// 101
	"ld h,(hl)",	// 102
	"ld h,a",	// 103
	"ld l,b",	// 104
	"ld l,c",	// 105
	"ld l,d",	// 106
	"ld l,e",	// 107
	"ld l,h",	// 108
	"ld l,l",	// 109
	"ld l,(hl)",	// 110
	"ld l,a",	// 111
	"ld (hl),b",	// 112
	"ld (hl),c",	// 113
	"ld (hl),d",	// 114
	"ld (hl),e",	// 115
	"ld (hl),h",	// 116
	"ld (hl),l",	// 117
	"halt",	// 118
	"ld (hl),a",	// 119
	"ld a,b",	// 120
	"ld a,c",	// 121
	"ld a,d",	// 122
	"ld a,e",	// 123
	"ld a,h",	// 124
	"ld a,l",	// 125
	"ld a,(hl)",	// 126
	"ld a,a",	// 127
	"add a,b",	// 128
	"add a,c",	// 129
	"add a,d",	// 130
	"add a,e",	// 131
	"add a,h",	// 132
	"add a,l",	// 133
	"add a,(hl)",	// 134
	"add a,a",		// 135
	"adc a,b",	// 136
	"adc a,c",	// 137
	"adc a,d",	// 138
	"adc a,e",	// 139
	"adc a,h",	// 140
	"adc a,l",	// 141
	"adc a,(hl)",	// 142
	"adc a,a",	// 143
	"sub b",	// 144
	"sub c",	// 145
	"sub d",	// 146
	"sub e",	// 147
	"sub h",	// 148
	"sub l",	// 149
	"sub (hl)",	// 150
	"sub a",	// 151
	"sbc a,b",	// 152
	"sbc a,c",	// 153
	"sbc a,d",	// 154
	"sbc a,e",	// 155
	"sbc a,h",	// 156
	"sbc a,l",	// 157
	"sbc a,(hl)",	// 158
	"sbc a,a",	// 159
	"and b",	// 160
	"and c",	// 161
	"and d",	// 162
	"and e",	// 163
	"and h",	// 164
	"and l",	// 165
	"and (hl)",	// 166
	"and a",	// 167
	"xor b",	// 168
	"xor c",	// 169
	"xor d",	// 170
	"xor e",	// 171
	"xor h",	// 172
	"xor l",	// 173
	"xor (hl)",	// 174
	"xor a",	// 175
	"or b",	// 176
	"or c",	// 177
	"or d",	// 178
	"or e",	// 179
	"or h",	// 180
	"or l",	// 181
	"or (hl)",	// 182
	"or a",	// 183
	"cp b",	// 184
	"cp c",	// 185
	"cp d",	// 186
	"cp e",	// 187
	"cp h",	// 188
	"cp l",	// 189
	"cp (hl)",	// 190
	"cp a",	// 191
	"ret nz",	// 192
	"pop bc",	// 193
	"*jp nz,MM",	// 194
	"*jp MM",	// 195
	"*call nz,MM",	// 196
	"push bc",	// 197
	"*add a,N",	// 198
	"rst 00h",	// 199
	"ret z",	// 200
	"ret",	// 201
	"*jp z,MM",	// 202
	"*",	// 203
	"*call z,MM",	// 204
	"*call MM",	// 205
	"*adc a,N",	// 206
	"rst 08",	// 207
	"ret nc",	// 208
	"pop de",	// 209
	"*jp nc,MM",	// 210
	"*out (N),a",	// 211
	"*call nc,MM",	// 212
	"push de",	// 213
	"*sub N",	// 214
	"rst 10h",	// 215
	"ret c",	// 216
	"exx",	// 217
	"*jp c,MM",	// 218
	"*in a,(N)",	// 219
	"*call c,MM",	// 220
	"*",	// 221
	"*sbc a,N",	// 222
	"rst 18h",	// 223
	"ret po",	// 224
	"pop hl",	// 225
	"*jp po,MM",	// 226
	"*ex (sp),hl",	// 227
	"*call po,MM",	// 228
	"push hl",	// 229
	"*and N",	// 230
	"rst 20h",	// 231
	"ret pe",	// 232
	"jp (hl)",	// 233
	"*jp pe,MM",	// 234
	"ex de,hl",	// 235
	"*call pe,MM",	// 236
	"*",	// 237
	"*xor N",	// 238
	"rst 28h",	// 239
	"ret p",	// 240
	"pop af",	// 241
	"*jp p,MM",	// 242
	"di",	// 243
	"*call p,MM",	// 244
	"push af",	// 245
	"*or N",	// 246
	"rst 30h",	// 247
	"ret m",	// 248
	"ld sp,hl",	// 249
	"*jp m,MM",	// 250
	"ei",	// 251
	"*call m,MM",	// 252
	"*",	// 253
	"*cp N",	// 254
	"rst 38h"	// 255
];

var ED_OpcodeTable=
[
/*	"?",			// 0
	"?",				// 1
	"?",	// 2
	"?",		// 3
	"?",			// 4
	"?",			// 5
	"?",				// 6
	"?",			// 7
	"?'",	// 8
	"?",	// 9
	"?",	// 10
	"?",		// 11
	"?",			// 12
	"?",			// 13
	"?",				// 14
	"?",			// 15
	"?",				// 16
	"?",				// 17
	"?",				// 18
	"?",		// 19
	"?",			// 20
	"?",			// 21
	"?",				// 22
	"?",			// 23
	"?",				// 24
	"?",	// 25
	"?",	// 26
	"?",		// 27
	"?",			// 28
	"?",			// 29
	"?",				// 30
	"?",			// 31
	"?",				// 32
	"?",				// 33
	"?",				// 34
	"?",		// 35
	"?",			// 36
	"?",			// 37
	"?",				// 38
	"?",			// 39
	"?",				// 40
	"?",	// 41
	"?",				// 42
	"?",		// 43
	"?",	// 44
	"?",	// 45
	"?",	// 46
	"?",	// 47
	"?",	// 48
	"?",	// 49
	"?",	// 50
	"?",	// 51
	"?",	// 52
	"?",	// 53
	"?",	// 54
	"?",	// 55
	"?",	// 56
	"?",	// 57
	"?",	// 58
	"?",	// 59
	"?",	// 60
	"?",	// 61
	"?",	// 62
	"",	// 63
	*/
	"in b,(c)",	// 64
	"out (c),b",	// 65
	"sbc hl,bc",	// 66
	"*ld (MM),bc",	// 67
	"neg",	// 68
	"retn",	// 69
	"im 0",	// 70
	"ld i,a",	// 71
	"in c,(c)",	// 72
	"out (c),c",	// 73
	"adc hl,bc",	// 74
	"*ld bc,(MM)",	// 75
	"neg",	// 76
	"reti",	// 77
	"im 0/1",	// 78
	"ld r,a",	// 79
	"in d,(c)",	// 80
	"out (c),d",	// 81
	"sbc hl,de",	// 82
	"*ld (MM),de",	// 83
	"neg",	// 84
	"retn",	// 85
	"im 1",	// 86
	"ld a,i",	// 87
	"in e,(c)",	// 88
	"out (c),e",	// 89
	"adc hl,de",	// 90
	"*ld de,(MM)",	// 91
	"neg",	// 92
	"retn",	// 93
	"im 2",	// 94
	"ld a,r",	// 95
	"in h,(c)",	// 96
	"out (c),h",	// 97
	"sbc hl,hl",	// 98
	"*ld (MM),hl",	// 99
	"neg",	// 100
	"retn",	// 101
	"im 0",	// 102
	"rrd",	// 103
	"in l,(c)",	// 104
	"out (c),l",	// 105
	"adc hl,hl",	// 106
	"*ld hl,(MM)",	// 107
	"neg",	// 108
	"retn",	// 109
	"im 0/1",	// 110
	"rld",	// 111
	"in (c)",	// 112
	"out (c),0",	// 113
	"sbc hl.sp",	// 114
	"*ld (MM),sp",	// 115
	"neg",	// 116
	"retn",	// 117
	"im 1",	// 118
	"?",	// 119
	"in a,(c)",	// 120
	"out (c),a",	// 121
	"adc hl,sp",	// 122
	"*ld sp,(MM)",	// 123
	"neg",	// 124
	"retn",	// 125
	"im 2",	// 126
	"?",	// 127

	"?","?","?","?","?","?","?","?","?","?","?","?","?","?","?","?",			// 0x80 - 0x9F	
	"?","?","?","?","?","?","?","?","?","?","?","?","?","?","?","?",			// 128 - 160


	"ldi",	// 160
	"cpi",	// 161
	"ini",	// 162
	"outi",	// 163
	"?",	// 164
	"?",	// 165
	"?",	// 166
	"?",		// 167
	"ldd",	// 168
	"cpd",	// 169
	"ind",	// 170
	"outd",	// 171
	"?",	// 172
	"?",	// 173
	"?",	// 174
	"?",	// 175
	"ldir",	// 176
	"cpir",	// 177
	"inir",	// 178
	"otir",	// 179
	"?",	// 180
	"?",	// 181
	"?",	// 182
	"?",	// 183
	"lddr",	// 184
	"cpdr",	// 185
	"indr",	// 186
	"otdr",	// 187
/*	"?",	// 156
	"?",	// 157
	"?",	// 158
	"?",	// 159
	"?",	// 160
	"and c",	// 161
	"and d",	// 162
	"and e",	// 163
	"and h",	// 164
	"and l",	// 165
	"and (hl)",	// 166
	"and a",	// 167
	"xor b",	// 168
	"xor c",	// 169
	"xor d",	// 170
	"xor e",	// 171
	"xor h",	// 172
	"xor l",	// 173
	"xor (hl)",	// 174
	"xor a",	// 175
	"or b",	// 176
	"or c",	// 177
	"or d",	// 178
	"or e",	// 179
	"or h",	// 180
	"or l",	// 181
	"or (hl)",	// 182
	"or a",	// 183
	"cp b",	// 184
	"cp c",	// 185
	"cp d",	// 186
	"cp e",	// 187
	"cp h",	// 188
	"cp l",	// 189
	"cp (hl)",	// 190
	"cp a",	// 191
	"ret nz",	// 192
	"pop bc",	// 193
	"*jp nz,MM",	// 194
	"*jp MM",	// 195
	"*call nz,MM",	// 196
	"push bc",	// 197
	"*add a,N",	// 198
	"rst 00h",	// 199
	"ret z",	// 200
	"ret",	// 201
	"*jp z,MM",	// 202
	"*",	// 203
	"*call z,MM",	// 204
	"*call MM",	// 205
	"*adc a,N",	// 206
	"rst 08",	// 207
	"ret nc",	// 208
	"pop de",	// 209
	"*jp nc,MM",	// 210
	"*out (N),a",	// 211
	"*call nc,MM",	// 212
	"push de",	// 213
	"*sub N",	// 214
	"rst 10h",	// 215
	"ret c",	// 216
	"exx",	// 217
	"*jp c,MM",	// 218
	"*in a,(N)",	// 219
	"*call c,MM",	// 220
	"*",	// 221
	"*sbc a,N",	// 222
	"rst 18h",	// 223
	"ret po",	// 224
	"pop hl",	// 225
	"*jp po,MM",	// 226
	"*ex (sp),hl",	// 227
	"*call po,MM",	// 228
	"push hl",	// 229
	"*and N",	// 230
	"rst 20h",	// 231
	"ret pe",	// 232
	"jp (hl)",	// 233
	"*jp pe,MM",	// 234
	"ex de,hl",	// 235
	"*call pe,MM",	// 236
	"*",	// 237
	"*xor N",	// 238
	"rst 28h",	// 239
	"ret p",	// 240
	"pop af",	// 241
	"*jp p,MM",	// 242
	"di",	// 243
	"*call p,MM",	// 244
	"push af",	// 245
	"*or N",	// 246
	"rst 30h",	// 247
	"ret m",	// 248
	"ld sp,hl",	// 249
	"*jp m,MM",	// 250
	"ei",	// 251
	"*call m,MM",	// 252
	"*",	// 253
	"*cp N",	// 254
	"rst 38h"	// 255
	*/
];

var CB_OpcodeTable = 
[
	"rlc b",			// 0
	"rlc c",				// 1
	"rlc d",	// 2
	"rlc e",		// 3
	"rlc h",			// 4
	"rlc l",			// 5
	"rlc (hl)",				// 6
	"rlc a",			// 7
	"rrc b",	// 8
	"rrc c",	// 9
	"rrc d",	// 10
	"rrc e",		// 11
	"rrc h",			// 12
	"rrc l",			// 13
	"rrc (hl)",				// 14
	"rrc a",			// 15
	"rl b",				// 16
	"rl c",				// 17
	"rl d",				// 18
	"rl e",		// 19
	"rl h",			// 20
	"rl l",			// 21
	"rl (hl)",				// 22
	"rl a",			// 23
	"rr b",				// 24
	"rr c",	// 25
	"rr d",	// 26
	"rr e",		// 27
	"rr h",			// 28
	"rr l",			// 29
	"rr (hl)",				// 30
	"rr a",			// 31
	"sla b",				// 32
	"sla c",				// 33
	"sla d",				// 34
	"sla e",		// 35
	"sla h",			// 36
	"sla l",			// 37
	"sla (hl)",				// 38
	"sla a",			// 39
	"sra b",				// 40
	"sra c",	// 41
	"sra d",				// 42
	"sra e",		// 43
	"sra h",	// 44
	"sra l",	// 45
	"sra (hl)",	// 46
	"sra a",	// 47
	"sll b",	// 48
	"sll c",	// 49
	"sll d",	// 50
	"sll e",	// 51
	"sll h",	// 52
	"sll l",	// 53
	"sll (hl)",	// 54
	"sll a",	// 55
	"srl b",	// 56
	"srl c",	// 57
	"srl d",	// 58
	"srl e",	// 59
	"srl h",	// 60
	"srl l",	// 61
	"srl (hl)",	// 62
	"srl a",	// 63
	"bit 0,b",	// 64
	"bit 0,c",	// 65
	"bit 0,d",	// 66
	"bit 0,e",	// 67
	"bit 0,h",	// 68
	"bit 0,l",	// 69
	"bit 0,(hl)",	// 70
	"bit 0,a",	// 71
	"bit 1,b",	// 72
	"bit 1,c",	// 73
	"bit 1,d",	// 74
	"bit 1,e",	// 75
	"bit 1,h",	// 76
	"bit 1,l",	// 77
	"bit 1,(hl)",	// 78
	"bit 1,a",	// 79
	"bit 2,b",	// 80
	"bit 2,c",	// 81
	"bit 2,d",	// 82
	"bit 2,e",	// 83
	"bit 2,h",	// 84
	"bit 2,l",	// 85
	"bit 2,(hl)",	// 86
	"bit 2,a",	// 87
	"bit 3,b",	// 88
	"bit 3,c",	// 89
	"bit 3,d",	// 90
	"bit 3,e",	// 91
	"bit 3,h",	// 92
	"bit 3,l",	// 93
	"bit 3,(hl)",	// 94
	"bit 3,a",	// 95
	"bit 4,b",	// 96
	"bit 4,c",	// 97
	"bit 4,d",	// 98
	"bit 4,e",	// 99
	"bit 4,h",	// 100
	"bit 4,l",	// 101
	"bit 4,(hl)",	// 102
	"bit 4,a",	// 103
	"bit 5,b",	// 104
	"bit 5,c",	// 105
	"bit 5,d",	// 106
	"bit 5,e",	// 107
	"bit 5,h",	// 108
	"bit 5,l",	// 109
	"bit 5,(hl)",	// 110
	"bit 5,a",	// 111
	"bit 6,b",	// 112
	"bit 6,c",	// 113
	"bit 6,d",	// 114
	"bit 6,e",	// 115
	"bit 6,h",	// 116
	"bit 6,l",	// 117
	"bit 6,(hl)",	// 118
	"bit 6,a",	// 119
	"bit 7,b",	// 120
	"bit 7,c",	// 121
	"bit 7,d",	// 122
	"bit 7,e",	// 123
	"bit 7,h",	// 124
	"bit 7,l",	// 125
	"bit 7,(hl)",	// 126
	"bit 7,a",	// 127
	"res 0,b",	// 128
	"res 0,c",	// 129
	"res 0,d",	// 130
	"res 0,e",	// 131
	"res 0,h",	// 132
	"res 0,l",	// 133
	"res 0,(hl)",	// 134
	"res 0,a",		// 135
	"res 1,b",	// 136
	"res 1,c",	// 137
	"res 1,d",	// 138
	"res 1,e",	// 139
	"res 1,h",	// 140
	"res 1,l",	// 141
	"res 1,(hl)",	// 142
	"res 1,a",	// 143
	"res 2,b",	// 144
	"res 2,c",	// 145
	"res 2,d",	// 146
	"res 2,e",	// 147
	"res 2,h",	// 148
	"res 2,l",	// 149
	"res 2,(hl)",	// 150
	"res 2,a",	// 151
	"res 3,b",	// 152
	"res 3,,c",	// 153
	"res 3,d",	// 154
	"res 3,e",	// 155
	"res 3,h",	// 156
	"res 3,l",	// 157
	"res 3,(hl)",	// 158
	"res 3,a",	// 159
	"res 4,b",	// 160
	"res 4,c",	// 161
	"res 4,d",	// 162
	"res 4,e",	// 163
	"res 4,h",	// 164
	"res 4,l",	// 165
	"res 4,(hl)",	// 166
	"res 4,a",	// 167
	"res 5,b",	// 168
	"res 5,c",	// 169
	"res 5,d",	// 170
	"res 5,e",	// 171
	"res 5,h",	// 172
	"res 5,l",	// 173
	"res 5,(hl)",	// 174
	"res 5,a",	// 175
	"res 6,b",	// 176
	"res 6,c",	// 177
	"res 6,d",	// 178
	"res 6,e",	// 179
	"res 6,h",	// 180
	"res 6,l",	// 181
	"res 6,(hl)",	// 182
	"res 6,a",	// 183
	"res 7,b",	// 184
	"res 7,c",	// 185
	"res 7,d",	// 186
	"res 7,e",	// 187
	"res 7,h",	// 188
	"res 7,l",	// 189
	"res 7,(hl)",	// 190
	"res 7,a",	// 191
	"set 0,b",	// 192
	"set 0,c",	// 193
	"set 0,d",	// 194
	"set 0,e",	// 195
	"set 0,h",	// 196
	"set 0,l",	// 197
	"set 0,(hl)",	// 198
	"set 0,a",	// 199
	"set 1,b",	// 200
	"set 1,c",	// 201
	"set 1,d",	// 202
	"set 1,e",	// 203
	"set 1,h",	// 204
	"set 1,l",	// 205
	"set 1,(hl)",	// 206
	"set 1,a",	// 207
	"set 2,b",	// 208
	"set 2,c",	// 209
	"set 2,d",	// 210
	"set 2,e",	// 211
	"set 2,h",	// 212
	"set 2,l",	// 213
	"set 2,(hl)",	// 214
	"set 2,a",	// 215
	"set 3,b",	// 216
	"set 3,c",	// 217
	"set 3,d",	// 218
	"set 3,e",	// 219
	"set 3,h",	// 220
	"set 3,l",	// 221
	"set 3,(hl)",	// 222
	"set 3,a",	// 223
	"set 4,b",	// 224
	"set 4,c",	// 225
	"set 4,d",	// 226
	"set 4,e",	// 227
	"set 4,h",	// 228
	"set 4,l",	// 229
	"set 4,(hl)",	// 230
	"set 4,a",	// 231
	"set 5,b",	// 232
	"set 5,c",	// 233
	"set 5,d",	// 234
	"set 5,e",	// 235
	"set 5,h",	// 236
	"set 5,l",	// 237
	"set 5,(hl)",	// 238
	"set 5,a",	// 239
	"set 6,b",	// 240
	"set 6,c",	// 241
	"set 6,d",	// 242
	"set 6,e",	// 243
	"set 6,h",	// 244
	"set 6,l",	// 245
	"set 6,(hl)",	// 246
	"set 6,a",	// 247
	"set 7,b",	// 248
	"set 7,c",	// 249
	"set 7,d",	// 250
	"set 7,e",	// 251
	"set 7,h",	// 252
	"set 7,l",	// 253
	"set 7,(hl)",	// 254
	"set 7,a"	// 255
];

