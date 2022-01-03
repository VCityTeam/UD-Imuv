/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const sharedType = require('ud-viz/src/Game/Shared/Shared');
/** @type {sharedType} */
let Shared = null;

module.exports = class PortalSweep {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
  }

  init() {
    this.go = arguments[0];
    this.localCtxt = arguments[1];
  }

  onEnter() {
    const go = this.go;
    const audioComp = go.getComponent(Shared.Audio.TYPE);
    if (!audioComp) return;

    const sounds = audioComp.getSounds();
    if (!sounds) debugger;
    sounds['portal_in'].play();

    const gV = this.localCtxt.getGameView();

    const fadeInHtmlEl = document.createElement('div');
    fadeInHtmlEl.classList.add('fadeIn');
    gV.ui.parentElement.parentElement.appendChild(fadeInHtmlEl);
    //fade out when avatar arrived in world  
  }
};
