export class SpriteName {
  constructor(config, udvizBundle) {
    this.config = config;

    udviz = udvizBundle;
    Game = udviz.Game;

    //THREE.Object3D
    this.sprite = null;

    this.oldObject = null;
  }

  init() {
    const go = arguments[0];
    this.updateSprite(go);
  }

  createSprite(label) {
    const texture = this.createLabelTexture(label, 'rgba(255, 255, 255, 0)');
    const material = new Game.THREE.SpriteMaterial({
      map: texture,
    });
    material.alphaTest = 0.5;
    const result = new Game.THREE.Sprite(material);
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

    canvas.width = Math.ceil(wT);

    //force to bind it after changing the canvas.width
    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';

    ctx.fillText(text, (canvas.width - wT) * 0.5, canvas.height * 0.5);

    const texture = new Game.THREE.TextureLoader().load(
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

    const renderComp = go.getComponent(Game.Render.TYPE);
    const bb = new Game.THREE.Box3().setFromObject(renderComp.getObject3D());
    const sprite = this.createSprite(this.config.name);
    const bbSprite = new Game.THREE.Box3().setFromObject(sprite);
    sprite.position.z = bb.max.z + 0.5 * (bbSprite.max.y - bbSprite.min.y);
    sprite.position.z -= bb.min.z;
    renderComp.addObject3D(sprite);

    this.sprite = sprite;

    this.oldObject = renderComp.getObject3D();
  }

  onComponentUpdate() {
    const go = arguments[0];
    const renderComp = go.getComponent(Game.Render.TYPE);

    if (renderComp.getObject3D() != this.oldObject) this.updateSprite(go);
  }
}
