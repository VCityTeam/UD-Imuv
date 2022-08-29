/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

module.exports = class GeoProject {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.imagePlane = null;
  }

  init() {
    const go = arguments[0];

    this.createImagePlane(go);
  }

  createImagePlane(go) {
    //image
    if (this.imagePlane && this.imagePlane.parent) {
      this.imagePlane.parent.remove(this.imagePlane);
    }

    //create image conf.image_icon_path on a quad above the pin
    const onLoad = function (texture) {
      const material = new udviz.THREE.MeshBasicMaterial({
        map: texture,
        side: udviz.THREE.DoubleSide,
      });

      const geometry = new udviz.THREE.PlaneGeometry(
        this.conf.image_width,
        this.conf.image_height
      );
      this.imagePlane = new udviz.THREE.Mesh(geometry, material);

      const r = go.getComponent(udviz.Game.Render.TYPE);
      r.addObject3D(this.imagePlane);
    };

    new udviz.THREE.TextureLoader().load(
      this.conf.image_icon_path,
      onLoad.bind(this)
    );
  }

  onOutdated() {
    const go = arguments[0];
    this.createImagePlane(go);
  }

  onClick() {
    //when image is clicked redirection to conf.href
    const a = document.createElement('a');
    a.href = this.conf.href;
    a.target = '_blank';
    a.click();
  }

  tick() {
    const go = arguments[0];

    const camera = arguments[1].getGameView().getCamera();

    const object3D = go.getObject3D();
    object3D.lookAt(camera.getWorldPosition(new udviz.THREE.Vector3()));
  }
};
