import { ScriptBase } from '@ud-viz/game_browser';
import { ControllerNativeCommandManager } from '@ud-viz/game_browser_template';

import { CameraManager } from './CameraManager';
import { ItownsRefine } from './ItownsRefine';

import { Vector3 } from 'three';
import { ID } from '../../shared/constant';

export class ZeppelinController extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    // Zeppelin controller
    this.zeppelinControllerMode = false;
  }

  getZeppelinControllerMode() {
    return this.zeppelinControllerMode;
  }

  setZeppelinControllerMode(value) {
    let zeppelinGO = null;
    this.context.object3D.traverse((child) => {
      if (child.userData.isZeppelin) {
        zeppelinGO = child;
        return true; // stop propagation
      }
      return false; // continue to traverse
    });

    if (!zeppelinGO) throw new Error('no zeppelin');

    if (value == this.zeppelinControllerMode) {
      console.warn('same value');
      return false;
    }

    this.zeppelinControllerMode = value;

    const commandIdUp = 'cmd_up';
    const commandIdDown = 'cmd_down';

    /** @type {CameraManager} */
    const cameraManager = this.context.findExternalScriptWithID(
      CameraManager.ID_SCRIPT
    );

    /** @type {ControllerNativeCommandManager} */
    const controllerManager = this.context.findExternalScriptWithID(
      ControllerNativeCommandManager.ID_SCRIPT
    );

    if (value) {
      cameraManager.followZeppelin();
      const refine = this.context.findExternalScriptWithID(
        ItownsRefine.ID_SCRIPT
      );
      if (refine) refine.zeppelin();

      controllerManager.controls(
        zeppelinGO.uuid,
        ControllerNativeCommandManager.MODE[1].TYPE,
        { withMap: false }
      );

      this.context.inputManager.setPointerLock(false);
    } else {
      cameraManager.stopFollowObject3D();
      controllerManager.removeControls();
    }

    return true;
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.ZEPPELIN_CONTROLLER;
  }
}
