/** @format */

let Shared = null;
let udviz = null;

module.exports = class SpriteName {
  constructor(config, udvizBundle) {
    this.config = config;

    udviz = udvizBundle;
    Shared = udviz.Game.Shared;

    //THREE.Object3D
    this.sprite = null;
  }

  init() {
    const go = arguments[0];
    this.updateSprite(go);
  }

  createSprite(label) {
    const texture = this.createLabelTexture(label, 'rgba(255, 255, 255, 0)');
    const material = new Shared.THREE.SpriteMaterial({
      map: texture,
    });
    material.alphaTest = 0.5;
    const result = new Shared.THREE.Sprite(material);
    result.scale.set(1, 0.3, 1);
    return result;
  }

  createLabelTexture(text, clearColor) {
    //create texture with name on it
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';
    const wT = ctx.measureText(text).width;
    ctx.fillText(text, (canvas.width - wT) * 0.5, canvas.height * 0.5);

    const texture = new Shared.THREE.TextureLoader().load(
      canvas.toDataURL('image/png')
    );
    texture.flipY = true;
    texture.flipX = true;

    return texture;
  }

  updateSprite(go) {
    if (this.sprite && this.sprite.parent) {
      this.sprite.parent.remove(this.sprite);
    }

    const renderComp = go.getComponent(Shared.Render.TYPE);
    const bb = renderComp.computeBoundingBox();
    const sprite = this.createSprite(this.config.name);
    const bbSprite = new Shared.THREE.Box3().setFromObject(sprite);
    sprite.position.z = bb.max.z + 0.5 * (bbSprite.max.y - bbSprite.min.y);
    sprite.position.z -= bb.min.z;
    renderComp.addObject3D(sprite);

    this.sprite = sprite;
  }

  update() {
    const go = arguments[0];
    this.updateSprite(go);
  }
};
