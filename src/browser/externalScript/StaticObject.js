import * as THREE from 'three';
import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';

import { CameraManager } from './CameraManager';
import { ID } from '../../shared/constant';

export class StaticObject extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.staticObject = new THREE.Object3D();
    this.staticObject.name = 'Static_Object';
  }

  init() {
    const cameraManager = this.context.findExternalScriptWithID(
      CameraManager.ID_SCRIPT
    );
    cameraManager.setObstacle(this.staticObject);
  }

  getStaticObject() {
    return this.staticObject;
  }

  onNewGameObject(newGO) {
    // add static object to object
    if (newGO.isStatic()) {
      // register in object
      const r = newGO.getComponent(RenderComponent.TYPE);
      if (r) {
        const clone = r.getController().renderData.object3D.clone();

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

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.STATIC_OBJECT;
  }
}
