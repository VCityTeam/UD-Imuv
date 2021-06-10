/** @format */

let THREE = null;

module.exports = class Rotate {
  constructor(conf, Shared) {
    this.conf = conf;

    THREE = Shared.THREE;
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];
    go.rotate(new THREE.Vector3(0, 0, -this.conf.speed * localCtx.getDt()));
  }
};
