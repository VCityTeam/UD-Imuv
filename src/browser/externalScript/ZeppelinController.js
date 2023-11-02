import { ScriptBase } from '@ud-viz/game_browser';
import {
  addNativeCommands,
  removeNativeCommands,
} from '@ud-viz/game_browser_template';

import { CameraManager } from './CameraManager';
import { ItownsRefine } from './ItownsRefine';

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

    /** @type {CameraManager} */
    const cameraManager = this.context.findExternalScriptWithID(
      CameraManager.ID_SCRIPT
    );

    if (value) {
      cameraManager.followZeppelin();
      const refine = this.context.findExternalScriptWithID(
        ItownsRefine.ID_SCRIPT
      );
      if (refine) refine.zeppelin();
      addNativeCommands(this.context.inputManager, zeppelinGO.uuid, false);
      this.context.inputManager.setPointerLock(false);
    } else {
      cameraManager.stopFollowObject3D();
      removeNativeCommands(this.context.inputManager);
    }

    return true;
  }

  static get ID_SCRIPT() {
    return 'zeppelin_controller_id_ext_script';
  }
}
