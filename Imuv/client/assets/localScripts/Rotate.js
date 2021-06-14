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
    go.rotate(
      new Shared.THREE.Vector3(0, 0, -this.conf.speed * localCtx.getDt())
    );
  }
};
