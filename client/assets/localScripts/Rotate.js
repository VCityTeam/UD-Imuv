/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const sharedType = require('ud-viz/src/Game/Shared/Shared');
/** @type {sharedType} */
let Shared = null;

module.exports = class Rotate {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    let speed = this.conf.speed;
    if (!speed) speed = 0.01;

    go.rotate(new Shared.THREE.Vector3(0, 0, -speed * localCtx.getDt()));
  }
};
