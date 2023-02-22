export class GeoProject {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.sprite = null;
  }

  init() {
    const go = arguments[0];

    this.updateSprite(go);
  }

  /**
   * It creates a sprite from the image at `conf.image_icon_path` and adds it to the `Render` component
   * of the game object
   * @param {udviz.Game.GameObject} go - the game object that this component is attached to
   */
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

  /**
   * When image is clicked redirection to conf.href
   */
  onClick() {
    const a = document.createElement('a');
    a.href = this.conf.href;
    a.target = '_blank';
    a.click();
  }
};
