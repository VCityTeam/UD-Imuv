/** @format */

module.exports = class Zeppelin {
  constructor(conf) {
    this.conf = conf;

    this.currentTime = 0;
    this.radius = 82;
  }

  init() {
    const go = arguments[0];
    const gCtx = arguments[1];

    this.centerCircle = new gCtx.UDVShared.THREE.Vector3(
      75,
      98,
      111.3931481757054
    );
  }

  computePosition(t, result) {
    result.x = this.centerCircle.x + this.radius * Math.cos(t);
    result.y = this.centerCircle.y + this.radius * Math.sin(t);
    result.z = this.centerCircle.z;

    return result;
  }

  tick() {
    const go = arguments[0];
    const gCtx = arguments[1];
    const dt = gCtx.dt;

    this.currentTime += dt;

    let ratio = this.currentTime / this.conf.duration;
    ratio /= 2 * Math.PI;

    const rot = go.getRotation();
    rot.z = ratio - Math.PI * 0.5;

    go.setRotation(rot);
    go.setPosition(this.computePosition(ratio, go.getPosition()));
  }
};
