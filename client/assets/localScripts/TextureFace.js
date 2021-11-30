/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const sharedType = require('ud-viz/src/Game/Shared/Shared');
/** @type {sharedType} */
let Shared = null;

module.exports = class TextureFace {
  constructor(config, udvizBundle) {
    this.config = config;

    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
  }

  init() {
    console.log('INIT Texture Face');
    const go = arguments[0];
    const localCtx = arguments[1];
    const conf = this.config;
    const texture_path = conf.face_textures[conf.index_face_texture];
    this.setFaceTexture(go, texture_path);
  }

  setFaceTexture(go, texture_path) {
    const _this = this;
    const renderComp = go.getComponent(Shared.Render.TYPE);
    const renderObject = renderComp.getObject3D();
    renderObject.traverse(function (o) {
      if (o.name == 'Face') {
        const texture = new Shared.THREE.TextureLoader().load(texture_path);
        texture.flipY = false;
        o.material = new Shared.THREE.MeshBasicMaterial({ map: texture });
        o.setRotationFromAxisAngle(new Shared.THREE.Vector3(0, 0, 0), 10);
        return o;
      }
    });
  }
};
