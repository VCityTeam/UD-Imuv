/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Rotate {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    let speed = this.conf.speed;
    if (!speed) speed = 0.01;

    go.rotate(new Game.THREE.Vector3(0, 0, -speed * localCtx.getDt()));
  }
};
