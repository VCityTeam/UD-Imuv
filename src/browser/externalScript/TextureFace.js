import * as THREE from 'three';
import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';

export class TextureFace extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.lastPath = null;
    this.lastMaterial = null;
  }

  init() {
    this.setFaceTexture();
  }

  setFaceTexture() {
    this.lastPath = this.variables.path_face_texture;

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
    if (this.lastPath != this.variables.path_face_texture)
      this.setFaceTexture();
  }

  onComponentUpdate() {
    // retreve current material
    let currentMaterial;
    const renderComp = this.object3D.getComponent(RenderComponent.TYPE);
    const renderObject = renderComp.getController().object3D;
    renderObject.traverse(function (o) {
      if (o.name == 'Face') {
        currentMaterial = o.material;
        return o;
      }
    });

    if (this.lastMaterial != currentMaterial) {
      this.setFaceTexture();
    } else {
      console.log('nothing');
    }
  }

  static get ID_SCRIPT() {
    return 'texture_face_id_ext_script';
  }
}