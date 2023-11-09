import * as THREE from 'three';
import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';
import { ID } from '../../shared/constant';

export class TextureFace extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.currentTextureFacePath = null;
  }

  init() {
    this.createTextureFace();
  }

  createTextureFace() {
    this.currentTextureFacePath = this.variables.path_face_texture;

    const renderComp = this.object3D.getComponent(RenderComponent.TYPE);
    const renderObject = renderComp.getController().object3D;

    renderObject.traverse((o) => {
      if (o.name == 'Face') {
        const texture = new THREE.TextureLoader().load(
          this.variables.path_face_texture
        );
        texture.flipY = false;
        o.material = new THREE.MeshBasicMaterial({ map: texture });
        o.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 0), 10);
        return o;
      }
    });
  }

  onOutdated() {
    if (this.currentTextureFacePath != this.variables.path_face_texture)
      this.createTextureFace();
  }

  onRenderComponentChanged() {
    this.createTextureFace();
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.TEXTURE_FACE;
  }
}
