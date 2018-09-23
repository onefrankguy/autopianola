import './autopianola.scss';

import './jquery.js';

window.onload = () => {
  const $ = window.jQuery;
  $('#play').click((e) => {
    e.toggleClass('play');
    e.toggleClass('pause');
  });
};
