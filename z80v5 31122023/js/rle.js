/*
	Title	:	Run Length Encoder

	Info	:	Version 0.0		24th September 2023

	Author	:	Nick Fleming

	Updated	:	31st December 2023

	 Notes:
	--------
		Encodes a typed array in a simple encoded format.

	 really, really simple rle_decoding
	 data is stored in the following format
	
		 bit 7	 bits 0-6
		+-----+-----------+
		|  T  |  NNNNNNN  |
		+-----+-----------+
	
		T = 0, NNNNNN = number of bytes of data that follow this byte
		T = 1, NNNNNN = the next byte is to be repeated NNNNNN times.
	
		T = 0, NNNNNN = 0, (i.e zero) terminates the decoding.

*/

function RLE_Encode (input_data, output_buffer)
{
	// returns the length of the encoded data.

	// encoding is as follows
	// bit 7 = control bit
	// bits 0-6 = length of run (n)
	// if bit 7 = 1, next byte is byte to repeat n times
	// otherwise n bytes of uncompressed data follow.
	// zero is output at the end of the data to indicate end of data.

	var ptr;
	var ch1;
	var ch2;
	var k;
	var run_length;
	
	var max_run_length;

	ptr = 0;
	
	if (input_data.length == 1)
	{
		// output 0x81, data byte, then output zero and we're done.
		output_buffer[ptr++] = 0x81;
		output_buffer[ptr++] = input_data[0];
		output_buffer[ptr++] = 0
		return;
	}

	max_run_length = 63;
	k = 0;
	while (k < input_data.length)
	{
		run_length = 0;
		ch1 = input_data[k];
		ch2 = input_data[k+1];
//		console.log ("ch1:" + ch1 + " ch2:" + ch2);
		if (ch1 == ch2)
		{
			while ((run_length < max_run_length) && (ch1 == input_data[k]) && (k < input_data.length))
			{
				run_length++;
				k++;
			}
//			console.log ("repeat run k:" + k + " rl:" + run_length);
	
			// output 128 | run_length, followed by ch1 byte
			output_buffer[ptr++] = 128 | run_length;
			output_buffer[ptr++] = ch1;
//			console.log ("rl:" + run_length);

			// k points to next character to decode after run.
		}
		else
		{
			// run of data
			while ((run_length < max_run_length) && (ch1 != ch2)  && (k < input_data.length))
			{
				run_length++;
				k++;
				ch1 = input_data[k];
				ch2 = input_data[k+1];
			}
//			console.log ("data run k:" + k + " rl:" + run_length);
			
			k -= run_length;
			MyZ80.mem[ptr++] = 0 | run_length;
			while (run_length > 0)
			{
				output_buffer[ptr++] = input_data[k];
				k++;
				run_length--;
			}
		}
	}
	
//	console.log ("compressed_size:" + ptr);
	
	return ptr;
}


