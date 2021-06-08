/** @format */

module.exports = class Image {
  constructor(conf) {
    this.conf = conf;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const THREE = localCtx.UDVShared.THREE;

    const texture = new THREE.TextureLoader().load(this.conf.path);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(
      this.conf.width,
      this.conf.height,
      32
    );
    const plane = new THREE.Mesh(geometry, material);

    const r = go.getComponent(localCtx.UDVShared.Render.TYPE);
    r.addObject3D(plane);
  }
};
