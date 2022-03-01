/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class PortalSweep {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;
  }

  init() {
    this.go = arguments[0];
    this.localCtxt = arguments[1];
  }

  onEnter() {
    const go = this.go;
    const audioComp = go.getComponent(Game.Audio.TYPE);
    if (!audioComp) return;

    const sounds = audioComp.getSounds();
    if (!sounds) debugger;
    sounds['portal_in'].play();

    const gV = this.localCtxt.getGameView();

    const fadeInHtmlEl = document.createElement('div');
    fadeInHtmlEl.classList.add('fadeIn_GameView');
    gV.ui.parentElement.parentElement.appendChild(fadeInHtmlEl);

    //TODO fade out when avatar arrived in world
  }
};
