/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class TextureFace {
  constructor(config, udvizBundle) {
    this.config = config;

    udviz = udvizBundle;
    Game = udviz.Game;
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
    const renderComp = go.getComponent(Game.Render.TYPE);
    const renderObject = renderComp.getObject3D();
    renderObject.traverse(function (o) {
      if (o.name == 'Face') {
        const texture = new Game.THREE.TextureLoader().load(texture_path);
        texture.flipY = false;
        o.material = new Game.THREE.MeshBasicMaterial({ map: texture });
        o.setRotationFromAxisAngle(new Game.THREE.Vector3(0, 0, 0), 10);
        return o;
      }
    });
  }
};
