import { ExternalGame, THREE } from '@ud-viz/browser';
import { Game } from '@ud-viz/shared';

export class StaticObject extends ExternalGame.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.staticObject = new THREE.Object3D();
    this.staticObject.name = 'Static_Object';
  }

  init() {
    const cameraManager =
      this.context.findExternalScriptWithID('CameraManager');
    cameraManager.setObstacle(this.staticObject);
  }

  getStaticObject() {
    return this.staticObject;
  }

  onNewGameObject(newGO) {
    //add static object to object
    if (newGO.isStatic()) {
      //register in object
      const r = newGO.getComponent(Game.Component.Render.TYPE);
      if (r) {
        const clone = r.getController().renderData.getObject3D().clone();

        r.getController().object3D.matrixWorld.decompose(
          clone.position,
          clone.quaternion,
          clone.scale
        );
        this.staticObject.add(clone);
        this.staticObject.updateMatrixWorld();
      }
    }
  }
}
