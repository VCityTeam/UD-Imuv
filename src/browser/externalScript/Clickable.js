import * as THREE from 'three';
import { checkParentChild } from '@ud-viz/utils_browser';
import { ScriptBase } from '@ud-viz/game_browser';
import { Object3D, ExternalScriptComponent } from '@ud-viz/game_shared';
import { ID } from '../../shared/constant';

export class Clickable extends ScriptBase {
  init() {
    const raycaster = new THREE.Raycaster();

    this.context.inputManager.addMouseInput(
      this.context.frame3D.domElement,
      'click',
      (event) => {
        if (this.context.userData.isEditorGameView) return; // TODO should be deprecated

        if (checkParentChild(event.target, this.context.frame3D.domElementUI))
          return; // ui has been clicked

        const mouse = new THREE.Vector2(
          -1 +
            (2 * event.offsetX) /
              (this.context.frame3D.domElementWebGL.clientWidth -
                parseInt(this.context.frame3D.domElementWebGL.offsetLeft)),
          1 -
            (2 * event.offsetY) /
              (this.context.frame3D.domElementWebGL.clientHeight -
                parseInt(this.context.frame3D.domElementWebGL.offsetTop))
        );

        raycaster.setFromCamera(mouse, this.context.frame3D.camera);

        const i = raycaster.intersectObject(this.context.frame3D.scene, true);

        if (i.length) {
          const gameObjectClicked = Object3D.fetchFirstGameObject3D(
            i[0].object
          );
          if (
            gameObjectClicked &&
            gameObjectClicked.uuid == this.object3D.uuid
          ) {
            const externalScriptComp = this.object3D.getComponent(
              ExternalScriptComponent.TYPE
            );
            externalScriptComp.getController().execute('onClick'); // custom external script event could be in ud-viz
          }
        }
      }
    );
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.CLICKABLE;
  }
}
