import { ScriptBase } from '@ud-viz/game_browser';
import { ExternalScriptComponent, Command } from '@ud-viz/game_shared';
import { constant } from '@ud-viz/game_shared_template';
import * as THREE from 'three';
import { postIt } from '../../shared/prefabFactory';

import { AvatarController } from './AvatarController';
import { StaticObject } from './StaticObject';
import { UI } from './UI';

export class PlacePostIt extends ScriptBase {
  init() {
    // controller
    const avatarController = this.context.findExternalScriptWithID(
      AvatarController.ID_SCRIPT
    );

    // add tool
    const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);

    const menuPostIt = new MenuPostIt(this.context, this.fetchStaticObject());

    scriptUI.addTool(
      './assets/img/ui/icon_post_it.png',
      'Post-it',
      (resolve, reject, onClose) => {
        avatarController.setAvatarControllerMode(onClose);
        resolve(true);
      },
      menuPostIt
    );
  }

  fetchStaticObject() {
    const scriptStaticObject = this.context.findExternalScriptWithID(
      StaticObject.ID_SCRIPT
    );
    return scriptStaticObject.object3D;
  }

  static get ID_SCRIPT() {
    return 'place_post_it_id_ext_script';
  }
}

class MenuPostIt {
  /**
   *
   * @param {ExternalGame.Context} externalContext
   * @param {object} objectStatic
   */
  constructor(externalContext, objectStatic) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('contextual_menu');

    const postitHtml = document.createElement('div');
    postitHtml.classList.add('post-it');
    this.domElement.appendChild(postitHtml);

    // input
    const textAreaMessage = document.createElement('textarea');
    textAreaMessage.placeholder = 'Post-it message...';
    postitHtml.appendChild(textAreaMessage);

    // create button
    const placePostItImage = document.createElement('img');
    placePostItImage.src = './assets/img/ui/icon_drag_post_it.png';
    placePostItImage.classList.add('draggable');
    this.domElement.appendChild(placePostItImage);

    // callbacks
    const raycaster = new THREE.Raycaster();

    externalContext.inputManager.addMouseInput(
      externalContext.frame3D.domElementUI,
      'dragend',
      (event) => {
        if (event.target != placePostItImage) return;

        // TODO maybe this is not working in editor cause of the left bar ui but for some reason offsetY is not working in that case
        const mouse = new THREE.Vector2(
          -1 +
            (2 * event.clientX) /
              (externalContext.frame3D.domElementWebGL.clientWidth -
                parseInt(externalContext.frame3D.domElementWebGL.offsetLeft)),
          1 -
            (2 * event.clientY) /
              (externalContext.frame3D.domElementWebGL.clientHeight -
                parseInt(externalContext.frame3D.domElementWebGL.offsetTop))
        );

        raycaster.setFromCamera(mouse, externalContext.frame3D.camera);

        const i = raycaster.intersectObject(objectStatic, true);

        if (i.length) {
          const closestI = i[0];
          const point = closestI.point;

          const quaternionObj = new THREE.Quaternion();
          closestI.object.matrixWorld.decompose(
            new THREE.Vector3(),
            quaternionObj,
            new THREE.Vector3()
          );
          const normal = closestI.face.normal.applyQuaternion(quaternionObj);

          const postitGo = postIt();

          // rotate
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            normal
          );
          postitGo.quaternion.multiply(quaternion);

          // avoid z fighting
          postitGo.position.copy(
            point
              .sub(externalContext.object3D.position)
              .add(normal.clone().setLength(0.08))
          );

          // write message
          const message = textAreaMessage.value;
          const externalScriptComp = postitGo.getComponent(
            ExternalScriptComponent.TYPE
          );
          externalScriptComp.getModel().getVariables().content = message;

          externalContext.sendCommandsToGameContext([
            new Command({
              type: constant.COMMAND.ADD_OBJECT3D,
              data: { object3D: postitGo.toJSON() },
            }),
          ]);
        }
      }
    );
  }

  html() {
    return this.domElement;
  }

  dispose() {
    this.domElement.remove();
  }
}
