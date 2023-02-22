import { ExternalGame, THREE } from '@ud-viz/browser';
import { Game } from '@ud-viz/shared';

export class StaticObject extends ExternalGame.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.object = new THREE.Object3D();
    this.object.name = 'Static_Object';
  }

  init() {
    this.object.position.add(this.context.object3D.position);
  }

  getObject() {
    return this.object;
  }

  onNewGameObject(newGO) {
    //add static object to object
    if (newGO.isStatic()) {
      //register in object
      const r = newGO.getComponent(Game.Component.Render.TYPE);
      if (r) {
        const clone = r.object3D.clone();

        r.object3D.matrixWorld.decompose(
          clone.position,
          clone.quaternion,
          clone.scale
        );
        this.object.add(clone);
        this.object.updateMatrixWorld();
      }
    }
  }
}
