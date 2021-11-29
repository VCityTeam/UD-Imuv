/** @format */

const sharedType = require('ud-viz/src/Game/Shared/Shared');
/** @type {sharedType} */
let Shared = null;

module.exports = class Zeppelin {
  constructor(conf, SharedModule) {
    this.conf = conf;

    Shared = SharedModule;

    this.currentTime = 0;
    this.radius = 82;
  }

  init() {
    const go = arguments[0];
    const worldContext = arguments[1];

    this.centerCircle = new Shared.THREE.Vector3(0, 0, 30);
  }

  computePosition(t, result) {
    result.x = this.centerCircle.x + this.radius * Math.cos(t);
    result.y = this.centerCircle.y + this.radius * Math.sin(t);
    result.z = this.centerCircle.z;

    return result;
  }

  tick() {
    const go = arguments[0];
    const worldContext = arguments[1];
    const dt = worldContext.dt;

    this.currentTime += dt;

    let ratio = this.currentTime / this.conf.duration;
    ratio /= 2 * Math.PI;

    const rot = go.getRotation();
    rot.z = ratio - Math.PI * 0.5;

    go.setRotation(rot);
    go.setPosition(this.computePosition(ratio, go.getPosition()));
  }
};
