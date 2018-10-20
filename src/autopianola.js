import './autopianola.scss';
import './jquery.js';
import mml from './mml.js';
import Alea from './alea.js';

if (!Math.clamp) {
  Math.clamp = (value, min, max) => Math.min(Math.max(min, value), max);
}

const PRNG = Alea();

PRNG.pick = (list) => {
  const index = Math.floor(PRNG.random() * list.length);
  return list[index];
};

const Audio = {};

Audio.ctx = () => {
  if (!Audio._ctx) {
    Audio._ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  return Audio._ctx;
};

Audio.now = () => Audio.ctx().currentTime;

Audio.MIN_GAIN = 0.001;
Audio.MAX_GAIN = 1;

Audio.gain = (value = Audio.MIN_GAIN) => {
  const gain = Audio.ctx().createGain();
  gain.gain.setValueAtTime(Math.clamp(value, Audio.MIN_GAIN, Audio.MAX_GAIN), Audio.now());
  return gain;
}

Audio.volume = (value) => {
  if (!Audio._volume) {
    Audio._volume = Audio.gain(1);
    Audio._volume.connect(Audio.ctx().destination);
  }


  if (value !== undefined) {
    Audio._volume.gain.setValueAtTime(Math.clamp(value, Audio.MIN_GAIN, Audio.MAX_GAIN), Audio.now());
  }

  return Audio._volume;
};

Audio.on = () => Audio.volume(1);
Audio.off = () => Audio.volume(0);

Audio.filter = (type) => {
  const filter = Audio.ctx().createBiquadFilter();
  filter.type = type;
  return filter;
}

Audio.output = () => {
  if (!Audio._lowpass) {
    Audio._lowpass = Audio.filter('lowpass');
    Audio._lowpass.frequency.setValueAtTime(20000, Audio.now());
    Audio._lowpass.connect(Audio.volume());
  }

  if (!Audio._highpass) {
    Audio._highpass = Audio.filter('highpass');
    Audio._highpass.frequency.setValueAtTime(20, Audio.now());
    Audio._highpass.connect(Audio._lowpass);
  }

  return Audio.volume();
}

Audio.oscillator = (hertz, type) => {
  const osc = Audio.ctx().createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(hertz, Audio.now());
  return osc;
};

const Note = {};

Note.semitone = (hertz, steps) => Math.round((hertz * (2 ** (steps / 12))) * 100) / 100;

Note.frequency = (note) => {
  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  const name = note.slice(0, 1).toUpperCase();
  let index = sharps.indexOf(name);

  const adjust = note.slice(1, 2).toLowerCase();
  if (adjust === '#') {
    index = sharps.indexOf(name + adjust);
  }
  if (adjust === 'b') {
    index = flats.indexOf(name + adjust);
  }

  const octave = parseInt(note.slice(-1), 10);
  const steps = (octave * 12) + index;

  // C0 is 16.35 Hz
  return Note.semitone(16.35, steps);
};

const Scale = {};

Scale.up = (intervals, index, octave) => {
  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  let notes = [];

  notes.push(`${sharps[index]}${octave}`);

  intervals.forEach((step) => {
    index += step;
    while (index >= sharps.length) {
      index -= sharps.length;
      octave += 1;
    }
    octave = Math.clamp(octave, 1, 8);
    notes.push(`${sharps[index]}${octave}`);
  });

  return notes;
};

Scale.down = (intervals, index, octave) => {
  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  let notes = [];

  notes.push(`${sharps[index]}${octave}`);

  intervals.slice().reverse().forEach((step) => {
    index -= step;
    while (index < 0) {
      index += sharps.length;
      octave -= 1;
    }
    octave = Math.clamp(octave, 1, 8);
    notes.push(`${sharps[index]}${octave}`);
  });

  return notes;
};

Scale.notes = (root, type, direction) => {
  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  const name = root.slice(0, 1).toUpperCase();
  let index = sharps.indexOf(name);

  const adjust = root.slice(1, 2).toLowerCase();
  if (adjust === '#') {
    index = sharps.indexOf(name + adjust);
  }
  if (adjust === 'b') {
    index = flats.indexOf(name + adjust);
  }

  // Chromatic - random, atonal
  let intervals = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  // Major - classic, happy
  if (type === 'major') {
    intervals = [2, 2, 1, 2, 2, 2, 1];
  }

  // Harmonic Minor - hunting, creepy
  if (type === 'harmonic-minor') {
    intervals = [2, 1, 2, 2, 1, 3, 1];
  }

  // Minor Pentatonic - blues, rock
  if (type === 'minor-pentatonic') {
    intervals = [3, 2, 2, 3, 2];
  }

  // Natural Minor - scary, epic
  if (type === 'natural-minor') {
    intervals = [2, 1, 2, 2, 1, 2, 2];
  }

  // Melodic Minor Up - wistful, mysterious
  if (type === 'melodic-minor-up') {
    intervals = [2, 1, 2, 2, 2, 2, 1];
  }

  // Melodic Minor Down = sombre, soulful
  if (type === 'melodic-minor-down') {
    intervals = [2, 2, 1, 2, 2, 1, 2];
  }

  // Dorian - cool, jazzy
  if (type === 'dorian') {
    intervals = [2, 1, 2, 2, 2, 1, 2];
  }

  // Mixolydian - progressive, complex
  if (type === 'mixolydian') {
    intervals = [2, 2, 1, 2, 2, 1, 2];
  }

  // Ahava Raba - exotic, unfamiliar
  if (type === 'ahava-raba') {
    intervals = [1, 3, 1, 2, 1, 2, 2];
  }

  // Major Pentatonic - country, gleeful
  if (type === 'major-pentatonic') {
    intervals = [2, 2, 3, 2, 3];
  }

  // Diatonic - bizarre, symmetrical
  if (type === 'diatonic') {
    intervals = [2, 2, 2, 2, 2, 2];
  }

  const octave = parseInt(root.slice(-1), 10);
  let notes = [];

  if (direction === 'up') {
    notes = Scale.up(intervals, index, octave);
  }

  if (direction === 'down') {
    notes = Scale.down(intervals, index, octave);
  }

  return notes;
};

const Synth = {};

Synth.MIN_ATTACK = 0.001;
Synth.MAX_ATTACK = 20;
Synth.MIN_DECAY = 0.001;
Synth.MAX_DECAY = 60;
Synth.MIN_RELEASE = 0.001;
Synth.MAX_RELEASE = 60;

Synth.play = (hertz, attack, decay, sustain, hold, release, time, type) => {
  const osc = Audio.oscillator(hertz, type);
  const gain = Audio.gain();

  osc.connect(gain);
  gain.connect(Audio.output());

  const a = Math.clamp(attack, Synth.MIN_ATTACK, Synth.MAX_ATTACK);
  const d = Math.clamp(decay, Synth.MIN_DECAY, Synth.MAX_DECAY);
  const s = Math.clamp(sustain, Audio.MIN_GAIN, Audio.MAX_GAIN);
  const h = Math.abs(hold);
  const r = Math.clamp(release, Synth.MIN_RELEASE, Synth.MAX_RELEASE);
  const t = Math.abs(time);

  // Attack
  gain.gain.exponentialRampToValueAtTime(Audio.MAX_GAIN, t + a);

  // Decay
  gain.gain.exponentialRampToValueAtTime(s, t + a + d);

  // Sustain
  // gain.gain.exponentialRampToValueAtTime(s, t + a + d + h);

  // Release
  gain.gain.exponentialRampToValueAtTime(Audio.MIN_GAIN, t + a + d + h + r);

  // Play
  osc.start(t);
  osc.stop(t + a + d + h + r);
};

Synth.flute = (hertz, sustain, duration, time) => {
  const attack = duration * (1/8);
  const decay = duration * (1/8);
  // sustain = 3/4;
  const release = duration * (1/8);

  const hold = duration - attack - decay - release;
  Synth.play(hertz, attack, decay, sustain, hold, release, time, 'sine');
};

Synth.strings = (hertz, sustain, duration, time) => {
  const attack = duration * (1/16);
  const decay = 0;
  // sustain = 1;
  const release = duration * (1/32);

  const hold = duration - attack - decay - release;
  Synth.play(hertz, attack, decay, sustain, hold, release, time, 'sine');
};

Synth.piano = (hertz, sustain, duration, time) => {
  const attack = duration * (1/32);
  const decay = duration * (1/2);
  // sustain = 1/2;
  const release = duration * (1/2);

  const hold = duration - attack - decay - release;
  Synth.play(hertz, attack, decay, sustain, hold, release, time, 'sine');
};

Synth.percussion = (hertz, sustain, duration, time) => {
  const attack = duration * (1/32);
  const decay = duration * (1/8);
  // sustain = 0;
  const release = 0;

  const hold = duration - attack - decay - release;
  Synth.play(hertz, attack, decay, 0, hold, release, time, 'sine');
};

// The kick drum sound comes from Aqilah Misuary's article on synthesising
// sounds with the Web Audio API.
//
// https://sonoport.github.io/synthesising-sounds-webaudio.html

Synth.kick = (duration, time) => {
  const attack = 0;
  const decay = duration * 2;
  const sustain = 0;
  const release = duration - decay;

  const hold = duration - attack - decay - release;
  Synth.play(Note.frequency('B2'), attack, decay, sustain, hold, release, time, 'sine');
  Synth.play(Note.frequency('G#1'), attack, decay, sustain, hold, release, time, 'triangle');
};

// This implementation of Bjorklund's algorithm is based on Brian House's work.
// https://github.com/brianhouse/bjorklund

Synth.bjorklund = (pulses, steps) => {
  const pattern = [];
  const counts = [];
  const remainders = [];
  remainders.push(pulses);

  let divisor = steps - pulses;
  let level = 0;

  while (true) {
    counts.push(Math.floor(divisor / remainders[level]));
    remainders.push(divisor % remainders[level]);
    divisor = remainders[level];
    level += 1;
    if (remainders[level] <= 1) {
      break;
    }
  }

  counts.push(divisor);

  const build = (lvl) => {
    if (lvl === -1) {
      pattern.push('.');
    } else if (lvl === -2) {
      pattern.push('x');
    } else if (lvl > -1) {
      for (let i = 0; i < counts[lvl]; i += 1) {
        build(lvl - 1);
      }
      if (remainders[lvl] !== 0) {
        build(lvl - 2);
      }
    }
  };

  build(level);

  const i = pattern.indexOf('x');
  const first = pattern.slice(i);
  const rest = pattern.slice(0, i);
  return first.concat(rest);
};

Synth._time = 0;
Synth._note = 0;
Synth._beat = 0;
Synth._tick = 0;
Synth._song = [];
Synth._kick = [];
Synth.tempo = 120; // quarter notes per minute
Synth.length = 8; // default note type, 1 = whole, 2 = half, 4 = quarter, etc.
Synth.measure = [];
Synth.root = 'D4';
Synth.scale = 'ahava-raba';

Synth.rules = [
  'rhythm',
  'emphasis',
  'palette',
  'interpolate',
  'groups',
  'dynamics',
  'spaces',
  'bass',
  // 'song',
];

// Return a scale of size `length` centered around the last note played.
// If nothing's been played, the scale is centered around the root note.
Synth.interpolate = (root, type, played, length) => {
  const lower = Scale.notes(root, type, 'down').slice(1).reverse();
  const upper = Scale.notes(root, type, 'up');
  let notes = [].concat(lower, upper);

  const [last] = played.filter(note => note !== 'R').reverse();
  let index = notes.indexOf(last);
  if (index < 0) {
    index = notes.indexOf(root);
  }

  let step = Math.floor(length / 2);
  index -= step;

  if (index + length > notes.length) {
    step = notes.length - (index + length);
    index += step;
  }

  if (index < 0) {
    index = 0;
  }

  return notes.slice(index, index + length);
};

Synth.schedule = () => {
  const $ = window.jQuery;

  let notes = [Synth.root];

  if (Synth.rules.includes('palette')) {
    notes = Scale.notes(Synth.root, Synth.scale, 'up');
  }

  if (Synth.rules.includes('interpolate')) {
    notes = Synth.interpolate(Synth.root, Synth.scale, Synth.measure, 7);
  }

  if (Synth.rules.includes('song') && Synth._song.length <= 0) {
    // From Act 1, Scene 9, of Handel's opera _Ottone_.
    Synth._song = mml('T120O4L8AAR4RA>C<BGGR4RGBGEER4EE16E16F+GDDR4GD16D16FE');
    Synth._song.reverse();
  }

  if (Synth.rules.includes('groups') && Synth._song.length <= 0) {
    const measures = 4;
    let measure = [];
    let length = 0;
    let rests = 0;

    while (length < measures) {
      let action = 'skip';

      if (Synth.rules.includes('dynamics')) {
        action = PRNG.pick(['skip', 'combine', 'split']);
      }

      let duration = Synth.length;

      if (action === 'combine') {
        if (length + (duration / 2) <= measures) {
          duration /= 2;
        }
      }

      let ticks = 1;

      if (action === 'split') {
        duration *= 2;
        ticks = 2;
      }

      for (let i = 0; i < ticks; i += 1) {
        let note = PRNG.pick(notes);

        if (Synth.rules.includes('spaces') && PRNG.pick([0, 1]) === 1) {
          if (rests + (1 / duration) <= measures * 0.3125) {
            note = 'R';
          }
        }

        measure.push(`${note}:${duration}`);
        length += 1 / duration;

        if (note === 'R') {
          rests += 1 / duration;
        }
      }
    }

    const loops = PRNG.pick([4, 6, 8]);
    for (let i = 0; i < loops; i += 1) {
      Synth._song = Synth._song.concat(measure);
    }
  }

  const now = Audio.now();
  const lookahead = 0.1;
  const interval = 0.025;

  if (Synth._time <= 0 || Math.abs(now - Synth._time) > 1) {
    Synth._time = now;
    Synth._note = now;
    Synth._beat = now;
    Synth._tick = 0;
  }

  if (Synth._kick.length <= 0) {
    Synth._kick = Synth.bjorklund(3, Synth.length);
  }

  while (Synth._time < Audio.now() + lookahead) {
    if (Synth._note < Synth._time + interval) {
      let duration = Synth.length;
      let sustain = 1/2;

      if (Synth.rules.includes('emphasis')) {
        if (Synth._kick[Synth._tick] === 'x') {
          sustain = 1;
        }
      }

      let note = PRNG.pick(notes);

      if (Synth._song.length > 0) {
        const data = Synth._song.pop();
        [note, duration] = data.split(':');
        duration = parseInt(duration, 10);
      }

      if (note === 'T') {
        Synth.tempo = duration;
        continue;
      }

      // Tempo is in quarter notes per minute and there are sixty seconds in a
      // minute. So the length of a quarter note in seconds is `60 / tempo`.
      // `duration` is 1 for a whole note, 2 for a half, 4 for a quarter, etc.
      // There are four quarter notes in a whole note, so the length of this note
      // is `(4 / duration) * (60 / tempo)` seconds.
      duration = (4 / duration) * (60 / Synth.tempo);

      if (note !== 'R') {
        const hertz = Note.frequency(note);
        Synth.piano(hertz, sustain, duration, Synth._note);
      }

      Synth.measure = Synth.measure.concat(note).slice(-4);

      Synth._note += duration;
    }

    if (Synth._beat < Synth._time + interval) {
      const duration = (4 / Synth.length) * (60 / Synth.tempo);

      if (Synth.rules.includes('bass')) {
        if (Synth._kick[Synth._tick] === 'x') {
          Synth.kick(duration, Synth._beat);
        }
      }

      Synth._beat += duration;

      Synth._tick = (Synth._tick + 1) % Synth.length;
    }


    if (!Synth.rules.includes('rhythm')) {
      break;
    }

    Synth._time += interval;
  }

  let html = '';
  Synth.measure.forEach((note) => {
    html += `<div>${note}</div>`;
  });
  $('#measure').html(html);

  if (Synth._playing && Synth.rules.includes('rhythm')) {
    Synth._raf = requestAnimationFrame(Synth.schedule);
  }
};

Synth.on = () => {
  Synth._playing = true;
  if (Synth._raf === undefined) {
    Synth._raf = requestAnimationFrame(Synth.schedule);
  }
};

Synth.off = () => {
  Synth._playing = false;
  if (Synth._raf !== undefined) {
    cancelAnimationFrame(Synth._raf);
    Synth._raf = undefined;
  }
};

const Renderer = {};

Renderer.render = (controls) => {
  const $ = window.jQuery;
  const play = $('#play');

  if (controls.playing) {
    Synth.on();
    play.addClass('pause');
    play.removeClass('play');
  } else {
    Synth.off();
    play.addClass('play');
    play.removeClass('pause');
  }
};

Renderer.invalidate = (controls) => {
  requestAnimationFrame(() => Renderer.render(controls));
};

window.onload = () => {
  const controls = {
    playing: false
  };

  const $ = window.jQuery;

  $('#play').click(() => {
    Synth.play(Note.frequency('C0'), 1/32, 1/8, 0, 1/8, 0, Audio.now(), 'sine');
    controls.playing = !controls.playing;
    Renderer.invalidate(controls);
  });
};
