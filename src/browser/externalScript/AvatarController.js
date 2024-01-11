import { ScriptBase } from '@ud-viz/game_browser';
import { CameraManager } from './CameraManager';
import { MiniMap } from './MiniMap';
import { ItownsRefine } from './ItownsRefine';
import { UI } from './UI';
import { ID } from '../../shared/constant';
import { ControllerNativeCommandManager } from '@ud-viz/game_browser_template';

export class AvatarController extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    // Avatar controller
    this.avatarControllerMode = false;
  }

  init() {
    this.context.inputManager.addKeyInput('p', 'keydown', () => {
      console.log(this.context);
    });

    // exit pointer lock method
    this.context.inputManager.addMouseInput(
      this.context.frame3D.domElement,
      'click',
      () => {
        this.context.inputManager.setPointerLock(false);
      }
    );

    this.setAvatarControllerMode(true);
  }

  setAvatarControllerMode(value) {
    if (value == this.avatarControllerMode) {
      console.warn('same value');
      return false;
    }

    this.avatarControllerMode = value;

    const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);

    /** @type {CameraManager} */
    const cameraManager = this.context.findExternalScriptWithID(
      CameraManager.ID_SCRIPT
    );
    /** @type {ControllerNativeCommandManager} */
    const controllerManager = this.context.findExternalScriptWithID(
      ControllerNativeCommandManager.ID_SCRIPT
    );

    if (value) {
      const miniMapScript = this.context.findExternalScriptWithID(
        MiniMap.ID_SCRIPT
      );
      if (miniMapScript) {
        // add mini map
        scriptUI.addToMapUI(miniMapScript);
      }

      const refine = this.context.findExternalScriptWithID(
        ItownsRefine.ID_SCRIPT
      );
      if (refine) refine.avatar();

      cameraManager.followAvatar();

      controllerManager.controls(
        this.context.userData.avatar.uuid,
        ControllerNativeCommandManager.MODE[2],
        { withMap: true }
      );
    } else {
      console.warn('remove avatar command');

      cameraManager.stopFollowObject3D();
      controllerManager.removeControls();
      scriptUI.clearMapUI();
    }

    return true;
  }

  getAvatarControllerMode() {
    return this.avatarControllerMode;
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.AVATAR_CONTROLLER;
  }
}
