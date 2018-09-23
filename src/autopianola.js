import './autopianola.scss';

window.onload = function () {
  const play = document.getElementById('play');
  play.onclick = function () {
    play.classList.toggle('play');
    play.classList.toggle('pause');
  };
};
