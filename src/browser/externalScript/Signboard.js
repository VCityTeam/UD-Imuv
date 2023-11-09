import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';
import * as THREE from 'three';
import { ID } from '../../shared/constant';

export class Signboard extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.defaultMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
    });

    this.renderPlane = null;
    this.renderFrame = null;
    this.planeFrontBuilded = null;
    this.frameBuilded = null;
    this.defaultImageURL = this.createDefaultImageURL();
    this.sizeFactor = null;
  }

  init() {
    this.renderPlane = this.object3D.getComponent(RenderComponent.TYPE);
    this.renderFrame = this.object3D.children[0].getComponent(
      RenderComponent.TYPE
    );
    if (!this.renderFrame) {
      console.error(
        'No render component found for the first child of the game object'
      );
    }

    this.buildMesh();
  }

  /**
   * It loads the image from the URL, then creates the signboard and frame
   * @param {Boolean} [bDefaultUrl=false] - If true, the default image will be used.
   */
  buildMesh(bDefaultUrl = false) {
    /* Removing the previous signboard and frame. */
    if (this.planeFrontBuilded) {
      this.planeFrontBuilded.removeFromParent();
      this.planeFrontBuilded = null;
    }
    if (this.frameBuilded) {
      this.frameBuilded.removeFromParent();
      this.frameBuilded = null;
    }

    const imageURL = bDefaultUrl
      ? this.defaultImageURL
      : this.variables.imageURL || this.defaultImageURL;
    this.sizeFactor = this.variables.sizeFactor || 1;

    /* Loading the image from the url and then using the image to create the signboard. */
    new THREE.TextureLoader().load(imageURL, (texture) => {
      const heightImage = texture.image.height;
      const widthImage = texture.image.width;
      const sF = this.sizeFactor;

      const h = heightImage > widthImage ? sF : (heightImage / widthImage) * sF;
      const w = widthImage > heightImage ? sF : (widthImage / heightImage) * sF;

      this.planeFrontBuilded = this.buildPlaneFront(texture, h, w);
      this.renderPlane.getController().addObject3D(this.planeFrontBuilded);
      this.frameBuilded = this.buildSignboardFrame(h, w);
      this.renderFrame.getController().addObject3D(this.frameBuilded);
    });
  }

  /**
   * It creates a plane with the same dimensions as the video frame, and applies the video texture to it
   * @param {THREE.Texture} textureLoaded - The texture that will be applied to the plane.
   * @param {number} h - height of the plane
   * @param {number} w - width of the plane
   * @returns {THREE.Object3D} A plane object with a texture.
   */
  buildPlaneFront(textureLoaded, h, w) {
    const geometryPlaneFront = new THREE.PlaneGeometry(w, h);
    const planeFrontObject = new THREE.Mesh(
      geometryPlaneFront,
      this.defaultMaterial
    );
    planeFrontObject.name = 'planeFront';
    planeFrontObject.material = new THREE.MeshBasicMaterial({
      map: textureLoaded,
    });
    planeFrontObject.castShadow = true;
    return planeFrontObject;
  }

  /**
   * It creates a frame for the signboard
   * @param {number} hPlane - height of the plane
   * @param {number} wPlane - width of the plane
   * @param sizeFactor - the size factor used for signboard.
   * @returns {THREE.Object3D} A THREE.Object3D()
   */

  buildSignboardFrame(hPlane, wPlane) {
    const sF = this.sizeFactor;
    const defaultMaterial = this.defaultMaterial;

    const frameObject = new THREE.Object3D();

    const geometryPlaneBG = new THREE.PlaneGeometry(wPlane, hPlane);
    const planeBG = new THREE.Mesh(geometryPlaneBG, defaultMaterial);
    planeBG.name = 'planeBG';
    planeBG.rotation.y = Math.PI;
    frameObject.add(planeBG);

    const b = sF / 20; // breadth
    const geometryFrameLeft = new THREE.BoxGeometry(b, hPlane + b * 2, b);
    const geometryFrameRight = new THREE.BoxGeometry(b, hPlane + b * 2, b);
    const frameLeft = new THREE.Mesh(geometryFrameLeft, defaultMaterial);
    const frameRight = new THREE.Mesh(geometryFrameRight, defaultMaterial);
    frameLeft.translateX(-wPlane / 2 - b / 2);
    frameRight.translateX(wPlane / 2 + b / 2);
    frameLeft.name = 'frameLeft';
    frameRight.name = 'frameRight';
    frameObject.add(frameLeft);
    frameObject.add(frameRight);

    const geometryFrameTop = new THREE.BoxGeometry(wPlane, b, b);
    const geometryFrameBottom = new THREE.BoxGeometry(wPlane, b, b);
    const frameTop = new THREE.Mesh(geometryFrameTop, defaultMaterial);
    const frameBottom = new THREE.Mesh(geometryFrameBottom, defaultMaterial);
    frameTop.translateY(hPlane / 2 + b / 2);
    frameBottom.translateY(-hPlane / 2 - b / 2);
    frameTop.name = 'frameTop';
    frameBottom.name = 'frameBottom';
    frameObject.add(frameTop);
    frameObject.add(frameBottom);

    const bSup = b / 2;
    const hSup = 1.5 * hPlane;
    const geometrySupportLeft = new THREE.BoxGeometry(bSup, hSup, b);
    const geometrySupportRight = new THREE.BoxGeometry(bSup, hSup, b);
    const supportLeft = new THREE.Mesh(geometrySupportLeft, defaultMaterial);
    const supportRight = new THREE.Mesh(geometrySupportRight, defaultMaterial);
    supportLeft.translateX(-wPlane / 2 - b - bSup / 2);
    supportRight.translateX(wPlane / 2 + b + bSup / 2);
    supportLeft.translateY(-(hSup / 2 - (hPlane / 2 + b)));
    supportRight.translateY(-(hSup / 2 - (hPlane / 2 + b)));
    supportLeft.name = 'supportLeft';
    supportRight.name = 'supportRight';
    frameObject.add(supportLeft);
    frameObject.add(supportRight);

    frameObject.castShadow = true;

    return frameObject;
  }

  /**
   * It changes the color of the render frame
   * @param {string | hex} newColor - The new color to set the render frame to.
   */
  changeColorRenderFrame(newColor) {
    this.renderFrame.setColor(new THREE.Color(newColor));
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

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.SIGNBOARD;
  }
}
