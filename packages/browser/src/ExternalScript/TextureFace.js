import { ExternalGame, THREE } from '@ud-viz/browser';
import { Game } from '@ud-viz/shared';

export class TextureFace extends ExternalGame.ScriptBase {
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

    const renderComp = this.object3D.getComponent(Game.Component.Render.TYPE);
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
    //retreve current material
    let currentMaterial;
    const renderComp = this.object3D.getComponent(Game.Component.Render.TYPE);
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
}
