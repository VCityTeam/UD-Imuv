import { ScriptBase } from '@ud-viz/game_browser';
import { Command } from '@ud-viz/game_shared';
import { constant } from '@ud-viz/game_shared_template';
import {
  computeRelativeElevationFromGround,
  ControllerNativeCommandManager,
} from '@ud-viz/game_browser_template';
import { ID, COMMAND } from '../../shared/constant';
import { AvatarController } from './AvatarController';
import { CameraManager } from './CameraManager';
import { CityMap } from './CityMap';
import { UI } from './UI';

const COMMAND_ID_ESCAPE = 'cmd_id_escape';

export class CityAvatar extends ScriptBase {
  init() {
    // init
    this.isUserCityAvatar =
      this.context.userData.avatar.uuid == this.object3D.parent.uuid;

    if (!this.isUserCityAvatar) {
      // ignore other city avatar other
      return;
    }

    /** @type {AvatarController} */
    const avatarController = this.context.findExternalScriptWithID(
      AvatarController.ID_SCRIPT
    );

    // remove avatar controls
    avatarController.setAvatarControllerMode(false);

    /** @type {CameraManager} */
    const cameraManager = this.context.findExternalScriptWithID(
      CameraManager.ID_SCRIPT
    );

    cameraManager.moveToCityAvatar().then(() => {
      cameraManager.followCityAvatar();
      this.setCityAvatarController(true);
    });
  }

  setCityAvatarController(value) {
    if (!this.isUserCityAvatar) return;
    console.trace('setCityAvatarController', value);

    /** @type {ControllerNativeCommandManager} */
    const controllerManager = this.context.findExternalScriptWithID(
      ControllerNativeCommandManager.ID_SCRIPT
    );

    /** @type {UI} */
    const ui = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
    if (value) {
      ui.addToMapUI(this.context.findExternalScriptWithID(CityMap.ID_SCRIPT));
      ui.getLabelInfo().writeLabel(this.object3D.uuid, 'E');
      // Esc city avatar mode
      this.context.inputManager.addKeyCommand(COMMAND_ID_ESCAPE, ['e'], () => {
        return new Command({
          data: {
            object3DUUID: this.object3D.parent.uuid,
          },
          type: COMMAND.ESCAPE_CITY_AVATAR,
        });
      });

      controllerManager.controls(
        this.object3D.uuid,
        ControllerNativeCommandManager.MODE[2].TYPE,
        { withMap: false }
      );
    } else {
      controllerManager.removeControls();
      this.context.inputManager.removeKeyCommand(COMMAND_ID_ESCAPE, ['e']);
      ui.clearMapUI();
      ui.getLabelInfo().clear(this.object3D.uuid);
    }
  }

  onRemove() {
    if (!this.isUserCityAvatar) return;

    this.setCityAvatarController(false);

    /** @type {AvatarController} */
    const avatarController = this.context.findExternalScriptWithID(
      AvatarController.ID_SCRIPT
    );

    /** @type {CameraManager} */
    const cameraManager = this.context.findExternalScriptWithID(
      CameraManager.ID_SCRIPT
    );

    cameraManager.stopFollowObject3D();

    cameraManager.moveToAvatar().then(() => {
      avatarController.setAvatarControllerMode(true);
    });
  }

  tick() {
    if (!this.isUserCityAvatar) return;

    this.context.sendCommandsToGameContext([
      new Command({
        type: constant.COMMAND.UPDATE_TRANSFORM,
        data: {
          object3DUUID: this.object3D.uuid,
          position: {
            z: computeRelativeElevationFromGround(
              this.object3D,
              this.context.frame3D.itownsView.tileLayer
            ),
          },
        },
      }),
    ]);
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.CITY_AVATAR;
  }
}
