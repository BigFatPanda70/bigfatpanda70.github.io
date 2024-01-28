/*

	Title	:	Some Audio Stuff

	Info	:	Version 0.0	26th May 2023

	Author	:	Nick Fleming

	Updated	:	26th May 2023

	 Notes:
	--------
		Just some bits of code for doing various beeps, clicks and bangs...
	based around my old audio experiments..

	 Limits : 
	-----------
		Audio contexts take a lot of resources.. so try to only use one
	if at all possible.

Guitar String Notes:

//https://en.wikipedia.org/wiki/Guitar_tunings

1 (E) 	329.63 Hz 	E4
2 (B) 	246.94 Hz 	B3
3 (G) 	196.00 Hz 	G3
4 (D) 	146.83 Hz 	D3
5 (A) 	110.00 Hz 	A2
6 (E) 	82.41 Hz 	E2

*/

var _actx;

var _sample = [];

var audio_notes = 
[
	// note name, frequency (Hz)

	"A0",	27.50000,	//  1	A0
	"A#0",	29.13524,	//  2	A#0
	"B0",	30.86771,	//  3	B0				B (5 string) 	
	"C1",	32.70320,	//  4 C1				Pedal C
	"C#1",	34.64783,	//  5	C#1
	"D1",	36.70810,	//  6	D1
	"D#1",	38.89087,	//  7	D#1
	"E1",	41.20344,	//  8	E1
	"F1",	43.65353,	//  9	F1
	"F#1",	46.24930,	// 10	F#1
	"G1",	48.99943,	// 11	G1
	"G#1",	51.91309,	// 12	G#1
	"A1",	55.00000,	// 13	A1				// good luck hearing any notes below this frequency on cheap speakers!!
	"A#1",	58.27047,	// 14	A#1				
	"B1",	61.73541,	// 15	B1
	"C2",	65.40639,	// 16 C2				Deep C
	"C#2",	69.29566,	// 17	C#2
	"D2",	73.41619,	// 18	D2
	"D#2",	77.78175,	// 19	D#2
	"E2",	82.40689,	// 20	E2
	"F2",	87.30706,	// 21	F2
	"F#2",	92.49861,	// 22	F#2
	"G2",	97.99886,	// 23	G2 	
	"G#2",	103.8262,	// 24	G#2
	"A2",	110.0000,	// 25	A2
	"A#2",	116.5409,	// 26	A#2
	"B2",	123.4708,	// 27	B2
	"C3",	130.8128,	// 28 C3 			
	"C#3",	138.5913,	// 29	C#3
	"D3",	146.8324,	// 30	D3
	"D#3",	155.5635,	// 31	D#3
	"E3",	164.8138,	// 32 	E3
	"F3",	174.6141,	// 33 	F3
	"F#3",	184.9972,	// 34 	F#3
	"G3",	195.9977,	// 35	G3
	"G#3",	207.6523,	// 36 	G#3
	"A3",	220.0000,	// 37	A3
	"A#3",	233.0819,	// 38 	A#3
	"B3",	246.9417,	// 39	B3
	"C4",	261.6256,	// 40 C4		 Middle C
	"C#4",	277.1826,	// 41
	"D4",	293.6648,	// 42		D
	"D#4",	311.1270,	// 43
	"E4",	329.6276,	// 44		High E
	"F4",	349.2282,	// 45
	"F#4",	369.9944,	// 46
	"G4",	391.9954,	// 47		//392 ??
	"G#4",	415.3047,	// 48
	"A4",	440.0000,	// 49			// 49 	A
	"A#4",	466.1638,	// 50
	"B4",	493.8833,	// 51
	"C5",	523.2511,	// 52 C5		// 52 Tenor C
	"C#5",	554.3653,	// 53
	"D5",	587.3295,	// 54
	"D#5",	622.2540,	// 55
	"E5",	659.2551, 	// 56	E5
	"F5",	698.4565,	// 57	F5
	"F#5",	739.9888,	// 58
	"G5",	783.9909,	// 59	G5
	"G#5",	830.6094,	// 60
	"A5",	880.0000, 	// 61	A5			// 61
	"A#5",	932.3275,	// 62	A#5
	"B5",	987.7666,	// 63	B5
	"C6",	1046.502,	// 64 C6
	"C#6",	1108.731,	// 65
	"D6",	1174.659,	// 66
	"D#6",	1244.508,	// 67
	"E6",	1318.510,	// 68
	"F6",	1396.913,	// 69
	"F#6",	1479.978,	// 70
	"G6",	1567.982,	// 71
	"G#6",	1661.219,	// 72
	"A6",	1760.000,	// 73	A6
	"A#6",	1864.655,	// 74
	"B6",	1975.533,	// 75
	"C7",	2093.005,	// 76 C7
	"C#7",	2217.461,	// 77
	"D7",	2349.318,	// 78
	"D#7",	2489.016,	// 79
	"E7",	2637.020,	// 80
	"F7",	2793.826,	// 81
	"F#7",	2959.955, 	// 82	#					
	"G7",	3135.963, 	// 83
	"G#7",	3322.438,	// 84	#
	"A7",	3520.000,	// 85	A7
	"A#7",	3729.310,	// 86 	A#7
	"B7",	3951.066,	// 87	B7
	"C8",	4186.009,	// 88 C8
	"C#8",	4434.922,	// 89
	"D8",	4698.636,	// 90
	"D#8",	4978.032,	// 91
	"E8",	5274.041,	// 92
	"F8",	5587.652,	// 93
	"F#8",	5919.911,	// 94
	"G8",	6271.927,	// 95
	"G#8",	6644.875,	// 96
	"A8",	7040.000,	// 97
	"A#8",	7458.620,	// 98
	"B8",	7902.133,	// 99
];

function Audio_Note_To_Hz (note_name)
{
	// returns the hz value of the note name
	// returns null if not found

	var i;
	var hz;
	
	i = 0;
	for (i = 0; i < audio_notes.length; i += 2)
	{
		if (audio_notes[i] == note_name)
		{
			hz = audio_notes[i+1];
			return hz;
		}
	}
	return null;
}


function AudioLoadSample (filename)
{
	var i;

	i = _sample.length;
	_sample[i] = new Audio(filename);
	
	_sample[i].loop = false;
	return i;
}

function AudioPlaySample (sample_idx)
{
	_sample[sample_idx].play();
}

function IsAudioAvailable()
{
	var tmp;

	tmp = new (AudioContext || webkitAudioContext)();		// legacy support!
	if (!tmp)
	{
		console.log ("audio not supported");
		return false;
	}
	tmp = null;
	return true;	// for now, it is !
}

function AudioBeep (frequency_Hz, start_delay, duration, envelope)
{
	// start_delay and duration are in seconds.
	// note : seconds can be fractional !

	var b = _actx.createOscillator();
//	b.type = "sawtooth";
//	b.type = "sine";
//	b.type = "square";
	b.type = "triangle";

//	if (envelope != null)
//	{
//		b.connect (envelope);
//		envelope.connect (_actx.destination);
//	}

	b.frequency.value = frequency_Hz;

	if (envelope != null)
	{
		b.connect (envelope);
		envelope.connect (_actx.destination);
	}
	else
	{
		b.connect (_actx.destination);
	}

	
	b.start(_actx.currentTime + start_delay);
	b.stop(_actx.currentTime + start_delay + duration*2);
}




function audioEnvelope (delay, peak_level, sustain_level, attack, decay, sustain, release)
{
	// delay = initial delay before playing anything from current time.
	// attack.. decay.. sustain.. release.. time offset values.
	// peak_level 0..1
	// sustain_level 0..1

	var gain;
	var t;
	var e;
	
	e = 0;
	
//	t = _actx.currentTime + delay;

	gain = _actx.createGain();

	t = _actx.currentTime + delay;

	if (e == 0)
	{
		gain.gain.setValueAtTime (0, _actx.currentTime);						// initial = zero volume.
		gain.gain.linearRampToValueAtTime (peak_level, t + attack);								// attack = go to peak volume
		gain.gain.linearRampToValueAtTime (sustain_level, t + attack + decay);				// decay	 = go to sustain volume
		gain.gain.linearRampToValueAtTime (sustain_level, t + attack + decay + sustain);	// sustain= sustain volume 
		gain.gain.linearRampToValueAtTime (0, t + attack + decay + sustain + release);	// release= zero volume (to prevent clicks)
	}
	else
	{
		gain.gain.setValueAtTime (0.0001, _actx.currentTime);						// initial = zero volume.
		gain.gain.exponentialRampToValueAtTime (peak_level, t + attack);								// attack = go to peak volume
		gain.gain.exponentialRampToValueAtTime (sustain_level, t + attack + decay);				// decay	 = go to sustain volume
		gain.gain.exponentialRampToValueAtTime (sustain_level, t + attack + decay + sustain);	// sustain= sustain volume 
		gain.gain.exponentialRampToValueAtTime (0.0001, t + attack + decay + sustain + release);	// release= zero volume (to prevent clicks)
		gain.gain.setValueAtTime (0, t + attack + decay + sustain + release + 0.00001);						// initial = zero volume.
	}

	return gain;
}


function AudioInit()
{
	_actx = new (AudioContext || webkitAudioContext)();		// legacy support!
	if (!_actx)
	{
		console.log ("audio not supported");
		return;
	}

	console.log ("sample rate:" + _actx.sampleRate);
	
	console.log ("channels:" + _actx.destination.channelCount);
}

