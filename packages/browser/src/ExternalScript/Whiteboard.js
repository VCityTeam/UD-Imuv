import { Game, THREE, Shared } from '@ud-viz/browser';
import { Constant } from '@ud-imuv/shared';

const DEFAULT_IMG_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/3/31/White_paper.jpg';

export class Whiteboard extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.imagePlane = null;
    this.mapImg = null;
    this.content = null;
    this.texture = null;
  }

  init() {
    this.createWhiteboardPlane();
  }

  createWhiteboardPlane(url = DEFAULT_IMG_SRC) {
    //image
    if (this.imagePlane && this.imagePlane.parent) {
      this.imagePlane.parent.remove(this.imagePlane);
    }
    const factorWidth = this.variables.factorWidth || 3;
    const factorHeight = this.variables.factorHeight || 3;

    const onLoad = (texture) => {
      const image = texture.image;
      const ratio = image.width / image.height;
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const geometry = new THREE.PlaneGeometry(
        ratio > 1 ? factorWidth : factorWidth * ratio,
        ratio < 1 ? factorHeight : factorHeight / ratio,
        32
      );
      this.imagePlane = new THREE.Mesh(geometry, material);
      const r = this.object3D.getComponent(Shared.Game.Component.Render.TYPE);
      r.getController().addObject3D(this.imagePlane);
    };

    this.texture = new THREE.TextureLoader().load(url, onLoad);
  }

  onClick() {
    const scriptUI = this.context.findExternalScriptWithID('UI');
    scriptUI.displayIframe(Constant.WBO.PUBLIC_URL + '/' + this.object3D.uuid);
  }
}
