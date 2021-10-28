/** @format */

let udviz = null;
let Shared = null;

module.exports = class ButterflySpawner {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
  }

  init() {
    console.log('Init Butterfly Spawner');
    this.go = arguments[0];
    console.log(this.go);
    if (!this.go) return;
  }

  tick() {}

  spawnButterfly(go) {
    const geometry = new Shared.THREE.SphereGeometry(100, 32, 16);
    const material = new Shared.THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sphere = new Shared.THREE.Mesh(geometry, material);
    go.object3D.add(sphere);
    sphere.updateMatrix();
  }

  update() {
    if (this.conf.onEnter) {
      console.log('PAPILLON DE LUMIERE');
    } else {
      console.log('on enter finished');
    }
  }
};
