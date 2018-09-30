// Based on David Bau's seedrandom.js library.
// https://github.com/davidbau/seedrandom
//
// David's library uses Johannes Baagøe's Alea algorithm.
// http://baagoe.com/en/RandomMusings/javascript/

const Mash = () => {
  let n = 0xefc8249d;

  let mash = (value) => {
    const data = String(value);

    for (let i = 0; i < data.length; i += 1) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }

    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  return mash;
};

const Alea = (seed = new Date()) => {
  let c = 1;
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;

  const set = (value) => {
    const data = String(value);

    let mash = Mash();

    c = 1;
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    s0 -= mash(data);
    if (s0 < 0) {
      s0 += 1;
    }

    s1 -= mash(data);
    if (s1 < 0) {
      s1 += 1;
    }

    s2 -= mash(data);
    if (s2 < 0) {
      s2 += 1;
    }
  };

  const random = () => {
    const t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
    s0 = s1;
    s1 = s2;
    return s2 = t - (c = t | 0);
  };

  set(seed);

  return {
    set,
    random,
  };
};

export { Alea as default };
