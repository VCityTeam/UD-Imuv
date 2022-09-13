/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

module.exports = class GeoProject {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.sprite = null;
  }

  init() {
    const go = arguments[0];

    this.updateSprite(go);
  }

  updateSprite(go) {
    //image
    if (this.sprite && this.sprite.parent) {
      this.sprite.parent.remove(this.sprite);
    }

    //create image conf.image_icon_path on a quad above the pin
    const onLoad = function (texture) {
      const material = new udviz.THREE.SpriteMaterial({
        map: texture,
      });

      this.sprite = new udviz.THREE.Sprite(material);
      this.sprite.scale.set(this.conf.image_width, this.conf.image_height, 1);

      const r = go.getComponent(udviz.Game.Render.TYPE);
      r.addObject3D(this.sprite);
    };

    new udviz.THREE.TextureLoader().load(
      this.conf.image_icon_path,
      onLoad.bind(this)
    );
  }

  onOutdated() {
    const go = arguments[0];
    this.updateSprite(go);
  }

  onClick() {
    //when image is clicked redirection to conf.href
    const a = document.createElement('a');
    a.href = this.conf.href;
    a.target = '_blank';
    a.click();
  }
};
