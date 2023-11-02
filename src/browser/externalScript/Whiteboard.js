import * as THREE from 'three';
import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';

import { UI } from './UI';

// TODO move hardcoded value in config
const DEFAULT_IMG_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/3/31/White_paper.jpg';

export class Whiteboard extends ScriptBase {
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
    // image
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
      const r = this.object3D.getComponent(RenderComponent.TYPE);
      r.getController().addObject3D(this.imagePlane);
    };

    this.texture = new THREE.TextureLoader().load(url, onLoad);
  }

  onClick() {
    const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
    scriptUI.displayIframe(WBO_PUBLIC_URL + '/' + this.object3D.uuid);
  }

  static get ID_SCRIPT() {
    return 'whiteboard_id_ext_script';
  }
}