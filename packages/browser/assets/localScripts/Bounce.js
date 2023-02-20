/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Bounce {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.currentDt = 0;
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    const renderComp = go.getComponent(Game.Render.TYPE);
    const obj = renderComp.getObject3D();

    this.currentDt += localCtx.getDt();

    const min = 0.8;
    const bounce = (1 - min) * Math.abs(Math.sin(this.currentDt * 0.001)) + min;

    obj.scale.set(bounce, bounce, bounce);
  }
};
