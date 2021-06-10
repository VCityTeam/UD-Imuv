/** @format */

let THREE;

module.exports = class SpriteName {
  constructor(config, Shared) {
    this.config = config;

    THREE = Shared.THREE;
  }

  init() {
    const go = arguments[0];
    const localContext = arguments[1];
    const Render = localContext.getSharedModule().Render;
    const assetsManager = localContext.getGameView().getAssetsManager();

    const renderComp = go.getComponent(Render.TYPE);
    const bb = renderComp.computeBoundingBox();
    const sprite = assetsManager.createSprite(this.config.name);
    const bbSprite = new THREE.Box3().setFromObject(sprite);
    sprite.position.z = bb.max.z + 0.5 * (bbSprite.max.y - bbSprite.min.y);
    renderComp.addObject3D(sprite);
  }
};
