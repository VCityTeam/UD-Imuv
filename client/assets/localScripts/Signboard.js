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
    this.defaultMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
    });

    this.renderPlane = null;
    this.renderFrame = null;
    this.planeFrontBuilded = null;
    this.frameBuilded = null;
    this.sizeFactor = this.conf.sizeFactor || 1;
    this.defaultImageURL = this.createDefaultImageURL();
    this.conf.imageURL = this.defaultImageURL;
  }

  init() {
    const go = arguments[0];

    this.renderPlane = go.getComponent(Game.Render.TYPE);

    if (go.children[0].name === 'Frame') {
      this.renderFrame = go.children[0].getComponent(Game.Render.TYPE);
    } else {
      console.error("Signboard's first child should be a Frame");
    }

    this.buildMesh();
  }

  /**
   * It loads the image from the URL, then creates the signboard and frame
   * @param {Boolean} [defaultUrl=false] - If true, the default image will be used.
   */
  buildMesh(defaultUrl = false) {
    /* Removing the previous signboard and frame. */
    if (this.planeFrontBuilded) {
      this.planeFrontBuilded.removeFromParent();
      this.planeFrontBuilded = null;
    }
    if (this.frameBuilded) {
      this.frameBuilded.removeFromParent();
      this.frameBuilded = null;
    }
    if (defaultUrl) {
      this.conf.imageURL = this.defaultImageURL;
    }
    const _this = this;
    /* Loading the image from the url and then using the image to create the signboard. */
    new THREE.TextureLoader().load(this.conf.imageURL, function (texture) {
      const h = texture.image.height;
      const w = texture.image.width;

      _this.conf.heightFrame =
        h > w ? _this.conf.sizeFactor : (h / w) * _this.conf.sizeFactor;
      _this.conf.widthFrame =
        w > h ? _this.conf.sizeFactor : (w / h) * _this.conf.sizeFactor;

      _this.planeFrontBuilded = _this.buildPlaneFront(texture);
      _this.renderPlane.addObject3D(_this.planeFrontBuilded);
      _this.frameBuilded = _this.buildSignboardFrame();
      _this.renderFrame.addObject3D(_this.frameBuilded);
    });
  }

  /**
   * It creates a plane with the same dimensions as the video frame, and applies the video texture to it
   * @param {THREE.Texture} textureLoaded - The texture that will be applied to the plane.
   * @returns {THREE.Object3D} A plane object with a texture.
   */
  buildPlaneFront(textureLoaded) {
    const h = this.conf.heightFrame;
    const w = this.conf.widthFrame;
    const geometryPlaneFront = new THREE.PlaneGeometry(w, h);
    const planeFrontObject = new THREE.Mesh(
      geometryPlaneFront,
      this.defaultMaterial
    );
    planeFrontObject.name = 'planeFront';
    planeFrontObject.material = new THREE.MeshBasicMaterial({
      map: textureLoaded,
    });
    return planeFrontObject;
  }

  /**
   * It creates a frame for the signboard
   * @returns {THREE.Object3D} A THREE.Object3D()
   */
  buildSignboardFrame() {
    const h = this.conf.heightFrame;
    const w = this.conf.widthFrame;
    const sF = this.conf.sizeFactor;

    const defaultMaterial = this.defaultMaterial;

    const frameObject = new THREE.Object3D();

    const geometryPlaneBG = new THREE.PlaneGeometry(w, h);
    const planeBG = new THREE.Mesh(geometryPlaneBG, defaultMaterial);
    planeBG.name = 'planeBG';
    planeBG.rotation.y = Math.PI;
    frameObject.add(planeBG);

    const b = sF / 20; // breadth
    const geometryFrameLeft = new THREE.BoxGeometry(b, h + b * 2, b);
    const geometryFrameRight = new THREE.BoxGeometry(b, h + b * 2, b);
    const frameLeft = new THREE.Mesh(geometryFrameLeft, defaultMaterial);
    const frameRight = new THREE.Mesh(geometryFrameRight, defaultMaterial);
    frameLeft.translateX(-w / 2 - b / 2);
    frameRight.translateX(w / 2 + b / 2);
    frameLeft.name = 'frameLeft';
    frameRight.name = 'frameRight';
    frameObject.add(frameLeft);
    frameObject.add(frameRight);

    const geometryFrameTop = new THREE.BoxGeometry(w, b, b);
    const geometryFrameBottom = new THREE.BoxGeometry(w, b, b);
    const frameTop = new THREE.Mesh(geometryFrameTop, defaultMaterial);
    const frameBottom = new THREE.Mesh(geometryFrameBottom, defaultMaterial);
    frameTop.translateY(h / 2 + b / 2);
    frameBottom.translateY(-h / 2 - b / 2);
    frameTop.name = 'frameTop';
    frameBottom.name = 'frameBottom';
    frameObject.add(frameTop);
    frameObject.add(frameBottom);

    const bSup = b / 2;
    const hSup = 1.5 * h;
    const geometrySupportLeft = new THREE.BoxGeometry(bSup, hSup, b);
    const geometrySupportRight = new THREE.BoxGeometry(bSup, hSup, b);
    const supportLeft = new THREE.Mesh(geometrySupportLeft, defaultMaterial);
    const supportRight = new THREE.Mesh(geometrySupportRight, defaultMaterial);
    supportLeft.translateX(-w / 2 - b - bSup / 2);
    supportRight.translateX(w / 2 + b + bSup / 2);
    supportLeft.translateY(-(hSup / 2 - (h / 2 + b)));
    supportRight.translateY(-(hSup / 2 - (h / 2 + b)));
    supportLeft.name = 'supportLeft';
    supportRight.name = 'supportRight';
    frameObject.add(supportLeft);
    frameObject.add(supportRight);

    return frameObject;
  }

  /**
   * It changes the color of the render frame
   * @param {string | hex} newColor - The new color to set the render frame to.
   */
  changeColorRenderFrame(newColor) {
    this.renderFrame.setColor(new THREE.Color(newColor));
  }

  onClick() {
    const go = arguments[0];
    // const localCtx = arguments[1];

    const renderComp = go.getComponent(Game.Render.TYPE);
    const obj = renderComp.getObject3D();
    console.log('clicked on signboard', obj);
  }

  /**
   * It creates a canvas element, draws a gradient on it, and then writes the text "Default Texture" on
   * it
   * @returns A data URL representing the image on the canvas.
   */
  createDefaultImageURL() {
    const canvas = document.createElement('canvas');
    canvas.height = 512;
    canvas.width = 512;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();

    const colors = [
      'red',
      'orange',
      'DarkOliveGreen',
      'SpringGreen',
      'cyan',
      'MidnightBlue',
      'MediumVioletRed',
    ];
    for (let i = 0; i < colors.length; i++) {
      ctx.beginPath();
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.width);
      gradient.addColorStop(0, colors[i]);
      gradient.addColorStop(1, 'white');
      ctx.fillStyle = gradient;
      ctx.fillRect(
        (canvas.width / colors.length) * i,
        0,
        (canvas.width / colors.length) * (i + 1),
        canvas.height
      );
    }

    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.font = '70px Arial';
    const stringDefaultTexture = 'Default Texture';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(stringDefaultTexture, canvas.height / 2, canvas.height / 2);

    return canvas.toDataURL();
  }
};
