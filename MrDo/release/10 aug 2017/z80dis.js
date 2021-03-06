//
//		z80 Assembly disassembler / opcode viewer for debugging. 
//
//

var SelectedRegister = 0;

var hex_digit = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
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


function DBG_RegView()
{
	var id;
	var str;
	var i;
	var spc =[32];
	var flags;
	
	for (i = 0; i < 32; i++){spc[i] = "&nbsp";}

	id = document.getElementById ("reg_panel");
	str = "";
	spc[SelectedRegister] = "<b>></b>";

	str += "A&nbsp&nbsp" + spc[0] + "&nbsp&nbsp" + Hex8(MyZ80.A) + "<br>";
	str += "B&nbsp&nbsp" + spc[1] + "&nbsp&nbsp" +Hex8(MyZ80.B) + "<br>";
	str += "C&nbsp&nbsp" + spc[2] + "&nbsp&nbsp" +Hex8(MyZ80.C) + "<br>";
	str += "D&nbsp&nbsp" + spc[3] + "&nbsp&nbsp" +Hex8(MyZ80.D) + "<br>";
	str += "E&nbsp&nbsp" + spc[4] + "&nbsp&nbsp" +Hex8(MyZ80.E) + "<br>";
	str += "H&nbsp&nbsp" + spc[5] + "&nbsp&nbsp" +Hex8(MyZ80.H) + "<br>";
	str += "L&nbsp&nbsp" + spc[6] +"&nbsp&nbsp" + Hex8(MyZ80.L) + "<br>";
	str += "IX&nbsp" + spc[7] + Hex16(MyZ80.IX) + "<br>";
	str += "IY&nbsp" + spc[8] +  Hex16(MyZ80.IY) +"<br>";
	str += "SP&nbsp" + spc[9]+Hex16(MyZ80.SP) + "<br>";
	str += "PC&nbsp" + spc[10]+Hex16(MyZ80.PC) + "<br>";
	str += "I&nbsp&nbsp"+ spc[11]+ "&nbsp&nbsp" +Hex8(MyZ80.I) + "<br>";
	str += "R&nbsp&nbsp"+ spc[12]+ "&nbsp&nbsp" +Hex8(MyZ80.R) + "<br>";
	str += "AF'"+ spc[13]+ Hex16((MyZ80.A_<<8)+MyZ80.F_) + "<br>";
	str += "BC'"+ spc[14]+ Hex16(MyZ80.BC_) + "<br>";
	str += "DE'"+ spc[15]+ Hex16(MyZ80.DE_) + "<br>";
	str += "HL'"+ spc[16]+ Hex16(MyZ80.HL_) + "<br>";

	flags = "";
	if (MyZ80.s != 0)	{flags += "s"} else {flags += "&nbsp"};
	if (MyZ80.z != 0)	{flags += "z"} else {flags += "&nbsp"};
	if (MyZ80.c != 0) {flags += "c"} else {flags += "&nbsp"};	
	str += "F&nbsp&nbsp" + flags;	// + spc[6] + "&nbsp&nbsp" +Hex8(MyZ80.F) + "<br>";
	
	id.innerHTML = str;
}

function DBG_MemView(start_addr)
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

	div = document.getElementById ("mem_panel");
	
	str = "";	//str = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F<br>";	//Addr&nbspmem&nbspascii<br>";
	max_rows = 10;
	max_cols = 16;
	pc = start_addr;

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
		if ((i < 64) || (i > 187))	return "???";
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


function DBG_AsmView()
{
	var div;
	var str;
	var i;
	var offset;
	var addr;
	var max_rows = 10;
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
