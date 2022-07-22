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
    const localCtx = arguments[1];

    //create image conf.image_icon on a quad above the pin
    const onLoad = function (texture) {
      const material = new udviz.THREE.MeshBasicMaterial({ map: texture });

      const geometry = new udviz.THREE.PlaneGeometry(
        this.conf.image_width,
        this.conf.image_height
      );
      this.imagePlane = new udviz.THREE.Mesh(geometry, material);

      this.imagePlane.translateZ(this.conf.image_height * 0.5 + 2);
      this.imagePlane.rotateX(Math.PI * 0.5);

      const r = go.getComponent(udviz.Game.Render.TYPE);
      r.addObject3D(this.imagePlane);
    };

    new udviz.THREE.TextureLoader().load(
      this.conf.image_icon,
      onLoad.bind(this)
    );
  }

  onClick() {
    //when image is clicked redirection to conf.href
    const a = document.createElement('a');
    a.href = this.conf.href;
    a.target = '_blank';
    a.click();
  }
};
