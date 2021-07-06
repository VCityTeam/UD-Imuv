/** @format */

let Shared = null;

module.exports = class Rotate {
  constructor(conf, SharedModule) {
    this.conf = conf;

    Shared = SharedModule;
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    let speed = this.conf.speed;
    if (!speed) speed = 0.01;

    go.rotate(new Shared.THREE.Vector3(0, 0, -speed * localCtx.getDt()));
  }
};
