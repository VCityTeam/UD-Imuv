/** @format */

let Shared;

module.exports = class SpriteName {
  constructor(config, SharedModule) {
    this.config = config;
    Shared = SharedModule;

    //THREE.Object3D
    this.sprite = null;
  }

  init() {
    const go = arguments[0];
    const localContext = arguments[1];
    const assetsManager = localContext.getGameView().getAssetsManager();
    this.createSprite(go, assetsManager);
  }

  createSprite(go, assetsManager) {
    if (this.sprite && this.sprite.parent) {
      this.sprite.parent.remove(this.sprite);
    }

    const renderComp = go.getComponent(Shared.Render.TYPE);
    const bb = renderComp.computeBoundingBox();
    const sprite = assetsManager.createSprite(this.config.name);
    const bbSprite = new Shared.THREE.Box3().setFromObject(sprite);
    sprite.position.z = bb.max.z + 0.5 * (bbSprite.max.y - bbSprite.min.y);
    renderComp.addObject3D(sprite);

    this.sprite = sprite;
  }

  update() {
    const go = arguments[0];
    const newComponentJSON = arguments[1];
    const assetsManager = arguments[2];

    this.config = newComponentJSON.conf;
    this.createSprite(go, assetsManager);
  }
};
