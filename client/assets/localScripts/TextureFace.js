/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class TextureFace {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;

    this.lastPath = null;
    this.lastMaterial = null;
  }

  init() {
    const go = arguments[0];
    this.setFaceTexture(go);
  }

  setFaceTexture(go) {
    this.lastPath = this.conf.path_face_texture;

    const _this = this;
    const renderComp = go.getComponent(Game.Render.TYPE);
    const renderObject = renderComp.getObject3D();

    renderObject.traverse(function (o) {
      if (o.name == 'Face') {
        const texture = new Game.THREE.TextureLoader().load(
          _this.conf.path_face_texture
        );
        texture.flipY = false;
        o.material = new Game.THREE.MeshBasicMaterial({ map: texture });
        o.setRotationFromAxisAngle(new Game.THREE.Vector3(0, 0, 0), 10);
        return o;
      }
    });
  }

  onOutdated() {
    if (this.lastPath != this.conf.path_face_texture)
      this.setFaceTexture(arguments[0]);
  }

  onComponentUpdate() {
    //retreve current material
    let currentMaterial;
    const renderComp = arguments[0].getComponent(Game.Render.TYPE);
    const renderObject = renderComp.getObject3D();
    renderObject.traverse(function (o) {
      if (o.name == 'Face') {
        currentMaterial = o.material;
        return o;
      }
    });

    if (this.lastMaterial != currentMaterial) {
      this.setFaceTexture(arguments[0]);
    } else {
      console.log('nothing');
    }
  }
};
