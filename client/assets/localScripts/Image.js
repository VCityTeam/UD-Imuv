/** @format */

let Shared = null;
let udviz = null;

module.exports = class Image {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
  }

  init() {
    const go = arguments[0];
    const texture = new Shared.THREE.TextureLoader().load(this.conf.path);
    const material = new Shared.THREE.MeshBasicMaterial({ map: texture });
    const geometry = new Shared.THREE.PlaneGeometry(
      this.conf.width,
      this.conf.height,
      32
    );
    const plane = new Shared.THREE.Mesh(geometry, material);
    const r = go.getComponent(Shared.Render.TYPE);
    r.addObject3D(plane);
  }
};
