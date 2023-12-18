import { ScriptBase } from '@ud-viz/game_browser';
import { ControllerNativeCommandManager } from '@ud-viz/game_browser_template';

import { CameraManager } from './CameraManager';
import { ItownsRefine } from './ItownsRefine';

import { ID } from '../../shared/constant';
import { Command } from '@ud-viz/game_shared';
import { COMMAND } from '@ud-viz/game_shared_template/src/constant';

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

    const commandUpID = 'move_up_zeppelin';
    const commandUpKeys = ['Shift'];
    const commandDownId = 'move_down_zeppelin';
    const commandDownKeys = ['Control'];

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
      this.context.inputManager.addKeyCommand(
        commandUpID,
        commandUpKeys,
        () => {
          return new Command({
            type: COMMAND.MOVE_UP,
            data: { object3DUUID: zeppelinGO.uuid, withMap: null },
          });
        }
      );

      this.context.inputManager.addKeyCommand(
        commandDownId,
        commandDownKeys,
        () => {
          return new Command({
            type: COMMAND.MOVE_DOWN,
            data: { object3DUUID: zeppelinGO.uuid, withMap: null },
          });
        }
      );

      this.context.inputManager.setPointerLock(false);
    } else {
      cameraManager.stopFollowObject3D();
      controllerManager.removeControls();
      this.context.inputManager.removeKeyCommand(commandUpID, commandUpKeys);
      this.context.inputManager.removeKeyCommand(
        commandDownId,
        commandDownKeys
      );
    }

    return true;
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.ZEPPELIN_CONTROLLER;
  }
}
