import './autopianola.scss';

import './jquery.js';

if (!Math.clamp) {
  Math.clamp = (value, min, max) => Math.min(Math.max(min, value), max);
}

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

const Renderer = {};

Renderer.render = (controls) => {
  const $ = window.jQuery;
  const play = $('#play');

  if (controls.playing) {
    Audio.on();
    play.addClass('pause');
    play.removeClass('play');
  } else {
    Audio.off();
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
    controls.playing = !controls.playing;
    Renderer.invalidate(controls);
  });
};
