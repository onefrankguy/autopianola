// This is a parser for the Music Macro Language as it's described by Toshiaki
// Matsushima in the book _Beyond MIDI_.
//
// The default octave is C4. The default note length is 1/4. The default tempo
// is 120 quarter notes per minute.
//
// note: /[A-G]#?[1-8]:[1-64]/
// rest: /R:[1-64]/
// tempo: /T:[32-256]/

const integer = (digits, min, max) => {
  let value = 0;

  for (let i = 0; i < digits.length; i += 1) {
    const n = parseInt(digits[i], 10);
    if (n >= 0 && n <= 9) {
      value *= 10;
      value += n;
    } else {
      break;
    }
  }

  if (value < min || value > max) {
    value = undefined;
  }

  return value;
};

const duration = (digits) => integer(digits, 1, 64);

const note = (tokens, length, octave) => {
  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  let note = tokens[0];
  let adjust = tokens[1];
  let dx = 0;
  let o;

  if (adjust === '+' || adjust === '#') {
    adjust = '#';
    dx = 1;
  } else if (adjust === '-') {
    adjust = 'b';
    dx = 1;
    const index = flats.indexOf(note + adjust);
    if (index > -1) {
      note = sharps[index].slice(0, 1);
      adjust = shaprs[index].slice(1, 1);
    }
  } else {
    adjust = '';
    dx = 0;
  }

  if (note + adjust === 'E#') {
    note = 'F';
    adjust = '';
  }

  if (note + adjust === 'Fb') {
    note = 'E';
    adjust = '';
  }

  if (note + adjust === 'B#') {
    note = 'C';
    adjust = '';
    o = octave + 1;
    if (o < 1 || o > 8) {
      note = undefined;
      o = undefined;
    }
  }

  if (note + adjust === 'Cb') {
    note = 'B';
    adjust = '';
    o = octave - 1;
    if (o < 1 || o > 8) {
      note = undefined;
      o = undefined;
    }
  }

  if (sharps.indexOf(note + adjust) < 0) {
    note = undefined;
    o = undefined;
  }

  let l = duration(tokens.slice(dx + 1, dx + 3));
  if (l === undefined) {
    l = length;
  }

  const results = [];

  if (o !== undefined) {
    results.push(`O${o}`);
  }

  if (note !== undefined) {
    results.push(`${note}${adjust}${l}`);
  }

  if (o !== undefined) {
    results.push(`O${octave}`);
  }

  return results;
};

const tokenize = (data) => {
  let octave = 4;
  let length = 4;
  let tokens = ['T120', `O${octave}`, `L${length}`];

  const symbols = (data || '').toUpperCase().split('');

  for (let i = 0; i < symbols.length; i += 1) {
    const c = symbols[i];

    if (c === 'T') {
      const t = integer(symbols.slice(i + 1, i + 4), 32, 256);
      if (t !== undefined) {
        tokens.push(`T${t}`);
      }
    }

    if (c === 'O') {
      const o = parseInt(symbols[i + 1], 10);
      if (o >= 1 && o <= 8) {
        octave = o;
        tokens.push(`O${octave}`);
      }
    }

    if (c === 'L') {
      const l = duration(symbols.slice(i + 1, i + 3));
      if (l !== undefined) {
        length = l;
      }
    }

    if (c === '>') {
      const o = octave + 1;
      if (o >= 1 && o <= 8) {
        octave = o;
        tokens.push(`O${octave}`);
      }
    }

    if (c === '<') {
      const o = octave - 1;
      if (o >= 1 && o <= 8) {
        octave = o;
        tokens.push(`O${octave}`);
      }
    }

    if (c === 'R') {
      let l = duration(symbols.slice(i + 1, i + 3));
      if (l === undefined) {
        l = length;
      }
      tokens.push(`R${l}`);
    }

    if (['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(c) > -1) {
      const notes = note(symbols.slice(i, i + 4), length, octave);
      tokens = tokens.concat(notes);
    }
  };

  return tokens;
};


const parse = (data) => {
  let octave = 0;
  let notes = [];

  const tokens = tokenize(data);

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const flag = token.slice(0, 1);

    if (flag === 'O') {
      octave = token.slice(1);
    }

    if (flag === 'T') {
      const length = token.slice(1);
      notes.push(`T:${length}`);
    }

    if (flag === 'R') {
      const length = token.slice(1);
      notes.push(`R:${length}`);
    }

    if (['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(flag)) {
      let note = token.slice(0, 1);
      let length = token.slice(1);

      if (token.slice(1, 2) === '#') {
        note = token.slice(0, 2);
        length = token.slice(2);
      }

      notes.push(`${note}${octave}:${length}`);
    }
  }

  return notes;
};

export { parse as default };
