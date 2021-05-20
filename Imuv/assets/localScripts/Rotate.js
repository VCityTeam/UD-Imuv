/** @format */

module.exports = class Rotate {
  constructor(conf) {
    this.conf = conf;
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];
    go.rotate(
      new localCtx.UDVShared.THREE.Vector3(0, 0, this.conf.speed * localCtx.dt)
    );
  }
};
