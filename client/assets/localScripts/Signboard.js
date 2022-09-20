/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;
const threeType = require('three');
/** @type {threeType} */
let THREE = null;

module.exports = class Signboard {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;
    THREE = Game.THREE;
  }

  init() {
    const go = arguments[0];
    const render = go.getComponent(Game.Render.TYPE);

    const objectBuilded = this.buildSignboard();
    render.addObject3D(objectBuilded);
  }

  buildSignboard() {
    const defaultMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
    });

    const result = new THREE.Object3D();

    const geometryPlaneFront = new THREE.PlaneGeometry(1, 1);
    const geometryPlaneBG = new THREE.PlaneGeometry(1, 1);
    const planeFront = new THREE.Mesh(geometryPlaneFront, defaultMaterial);
    const planeBG = new THREE.Mesh(geometryPlaneBG, defaultMaterial);
    planeFront.name = 'planeFront';
    planeFront.material = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load(
        'https://static01.nyt.com/images/2011/01/14/arts/14MOVING-span/MOVING-jumbo.jpg'
      ),
      blendDst: THREE.ZeroFactor,
    });
    planeBG.name = 'planeBG';
    planeBG.rotation.y = Math.PI;
    result.add(planeFront);
    result.add(planeBG);

    const geometryFrameLeft = new THREE.BoxGeometry(0.1, 0.9, 0.1);
    const geometryFrameRight = new THREE.BoxGeometry(0.1, 0.9, 0.1);
    const frameLeft = new THREE.Mesh(geometryFrameLeft, defaultMaterial);
    const frameRight = new THREE.Mesh(geometryFrameRight, defaultMaterial);
    frameLeft.translateX(-0.5);
    frameRight.translateX(0.5);
    frameLeft.name = 'frameLeft';
    frameRight.name = 'frameRight';
    result.add(frameLeft);
    result.add(frameRight);

    const geometryFrameTop = new THREE.BoxGeometry(1.1, 0.1, 0.1);
    const geometryFrameBottom = new THREE.BoxGeometry(1.1, 0.1, 0.1);
    const frameTop = new THREE.Mesh(geometryFrameTop, defaultMaterial);
    const frameBottom = new THREE.Mesh(geometryFrameBottom, defaultMaterial);
    frameTop.translateY(0.5);
    frameBottom.translateY(-0.5);
    frameTop.name = 'frameTop';
    frameBottom.name = 'frameBottom';
    result.add(frameTop);
    result.add(frameBottom);

    const geometrySupportLeft = new THREE.BoxGeometry(0.05, 1.5, 0.1);
    const geometrySupportRight = new THREE.BoxGeometry(0.05, 1.5, 0.1);
    const supportLeft = new THREE.Mesh(geometrySupportLeft, defaultMaterial);
    const supportRight = new THREE.Mesh(geometrySupportRight, defaultMaterial);
    supportLeft.translateX(-0.55);
    supportLeft.translateY(-0.2);
    supportRight.translateX(0.55);
    supportRight.translateY(-0.2);
    supportLeft.name = 'supportLeft';
    supportRight.name = 'supportRight';
    result.add(supportLeft);
    result.add(supportRight);

    result.rotation.x = Math.PI / 2;
    return result;
  }

  onClick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    const renderComp = go.getComponent(Game.Render.TYPE);
    const obj = renderComp.getObject3D();
    console.log('clicked on signboard', obj);
  }

  tick() {}
};
