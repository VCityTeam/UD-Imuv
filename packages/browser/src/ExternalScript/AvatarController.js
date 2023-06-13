import { Game, Shared, THREE } from '@ud-viz/browser';

export class AvatarController extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    //Avatar controller
    this.avatarControllerMode = false;
  }

  init() {
    this.context.inputManager.addKeyInput('p', 'keydown', () => {
      console.log(this.context);
    });

    //exit pointer lock method
    this.context.inputManager.addMouseInput(
      this.context.frame3D.rootHtml,
      'click',
      () => {
        this.context.inputManager.setPointerLock(false);
      }
    );

    if (!this.context.userData.firstGameObject) {
      //work with camera localscript
      this.setAvatarControllerMode(true);
    }
  }

  setAvatarControllerMode(value) {
    if (value == this.avatarControllerMode) {
      console.warn('same value');
      return false;
    }

    this.avatarControllerMode = value;

    //FORWARD
    const commandIdForward = 'cmd_forward';
    const commandIdBackward = 'cmd_backward';
    const commandIdLeft = 'cmd_left';
    const commandIdRight = 'cmd_right';
    const commandIdRotate = 'cmd_rotate';

    const scriptUI = this.context.findExternalScriptWithID('UI');

    /** @type {CameraManager} */
    const cameraManager =
      this.context.findExternalScriptWithID('CameraManager');

    if (value) {
      const miniMapScript = this.context.findExternalScriptWithID('MiniMap');
      if (miniMapScript) {
        //add mini map
        scriptUI.addToMapUI(miniMapScript);
      }

      const refine = this.context.findExternalScriptWithID('ItownsRefine');
      if (refine) refine.avatar();

      cameraManager.followAvatar();

      console.warn('add avatar control');

      //forward
      let forwardStart = false;
      this.context.inputManager.addKeyCommand(
        commandIdForward,
        ['z', 'ArrowUp'],
        () => {
          const forwardDown =
            this.context.inputManager.isKeyDown('z') ||
            this.context.inputManager.isKeyDown('ArrowUp');
          if (forwardDown != forwardStart) {
            forwardStart = forwardDown;
            if (forwardStart) {
              this.context.inputManager.setPointerLock(true);

              return new Shared.Command({
                type: Shared.Game.ScriptTemplate.Constants.COMMAND
                  .MOVE_FORWARD_START,
                data: { object3DUUID: this.context.userData.avatarUUID },
              });
            }
          }

          const forwardEnd =
            this.context.inputManager.isKeyUp('z') ||
            this.context.inputManager.isKeyUp('ArrowUp') ||
            this.context.inputManager.isKeyUp('s') ||
            this.context.inputManager.isKeyUp('ArrowDown');
          if (forwardEnd) {
            return new Shared.Command({
              type: Shared.Game.ScriptTemplate.Constants.COMMAND
                .MOVE_FORWARD_END,
              data: { object3DUUID: this.context.userData.avatarUUID },
            });
          }
        }
      );

      //backward
      let backwardStart = false;
      this.context.inputManager.addKeyCommand(
        commandIdBackward,
        ['s', 'ArrowDown'],
        () => {
          const backwardDown =
            this.context.inputManager.isKeyDown('s') ||
            this.context.inputManager.isKeyDown('ArrowDown');
          if (backwardDown != backwardStart) {
            backwardStart = backwardDown;
            if (backwardStart) {
              this.context.inputManager.setPointerLock(true);
              return new Shared.Command({
                type: Shared.Game.ScriptTemplate.Constants.COMMAND
                  .MOVE_BACKWARD_START,
                data: { object3DUUID: this.context.userData.avatarUUID },
              });
            }
          }

          const backwardEnd =
            this.context.inputManager.isKeyUp('z') ||
            this.context.inputManager.isKeyUp('ArrowUp') ||
            this.context.inputManager.isKeyUp('s') ||
            this.context.inputManager.isKeyUp('ArrowDown');
          if (backwardEnd) {
            return new Shared.Command({
              type: Shared.Game.ScriptTemplate.Constants.COMMAND
                .MOVE_BACKWARD_END,
              data: { object3DUUID: this.context.userData.avatarUUID },
            });
          }
        }
      );

      //left
      let leftStart = false;
      this.context.inputManager.addKeyCommand(
        commandIdLeft,
        ['q', 'ArrowLeft'],
        () => {
          const leftDown =
            this.context.inputManager.isKeyDown('q') ||
            this.context.inputManager.isKeyDown('ArrowLeft');
          if (leftDown != leftStart) {
            leftStart = leftDown;
            if (leftStart) {
              this.context.inputManager.setPointerLock(true);
              return new Shared.Command({
                type: Shared.Game.ScriptTemplate.Constants.COMMAND
                  .MOVE_LEFT_START,
                data: { object3DUUID: this.context.userData.avatarUUID },
              });
            }
          }

          const leftEnd =
            this.context.inputManager.isKeyUp('d') ||
            this.context.inputManager.isKeyUp('ArrowRight') ||
            this.context.inputManager.isKeyUp('q') ||
            this.context.inputManager.isKeyUp('ArrowLeft');
          if (leftEnd) {
            return new Shared.Command({
              type: Shared.Game.ScriptTemplate.Constants.COMMAND.MOVE_LEFT_END,
              data: { object3DUUID: this.context.userData.avatarUUID },
            });
          }
        }
      );

      //right
      let rightStart = false;
      this.context.inputManager.addKeyCommand(
        commandIdRight,
        ['d', 'ArrowRight'],
        () => {
          const rightDown =
            this.context.inputManager.isKeyDown('d') ||
            this.context.inputManager.isKeyDown('ArrowRight');
          if (rightDown != rightStart) {
            rightStart = rightDown;
            if (rightStart) {
              this.context.inputManager.setPointerLock(true);
              return new Shared.Command({
                type: Shared.Game.ScriptTemplate.Constants.COMMAND
                  .MOVE_RIGHT_START,
                data: { object3DUUID: this.context.userData.avatarUUID },
              });
            }
          }

          const rightEnd =
            this.context.inputManager.isKeyUp('d') ||
            this.context.inputManager.isKeyUp('ArrowRight') ||
            this.context.inputManager.isKeyUp('q') ||
            this.context.inputManager.isKeyUp('ArrowLeft');
          if (rightEnd) {
            return new Shared.Command({
              type: Shared.Game.ScriptTemplate.Constants.COMMAND.MOVE_RIGHT_END,
              data: { object3DUUID: this.context.userData.avatarUUID },
            });
          }
        }
      );

      //ROTATE

      this.context.inputManager.addMouseCommand(
        commandIdRotate,
        'mousemove',
        (event) => {
          if (
            this.context.inputManager.getPointerLock() ||
            (this.context.inputManager.mouseState.isDragging() &&
              !this.context.inputManager.getPointerLock())
          ) {
            if (event.movementX != 0 || event.movementY != 0) {
              let pixelX = -event.movementX;
              let pixelY = -event.movementY;

              const dragRatio = scriptUI
                .getMenuSettings()
                .getMouseSensitivityValue();

              pixelX *= dragRatio;
              pixelY *= dragRatio;

              return new Shared.Command({
                type: Shared.Game.ScriptTemplate.Constants.COMMAND.ROTATE,
                data: {
                  object3DUUID: this.context.userData.avatarUUID,
                  vector: new THREE.Vector3(pixelY, 0, pixelX),
                },
              });
            }
          }
          return null;
        }
      );
    } else {
      console.warn('remove avatar command');

      cameraManager.stopFollowObject3D();

      this.context.inputManager.removeKeyCommand(commandIdForward, [
        'z',
        'ArrowUp',
      ]);
      this.context.inputManager.removeKeyCommand(commandIdBackward, [
        's',
        'ArrowDown',
      ]);
      this.context.inputManager.removeKeyCommand(commandIdRight, [
        'd',
        'ArrowRight',
      ]);
      this.context.inputManager.removeKeyCommand(commandIdLeft, [
        'q',
        'ArrowLeft',
      ]);
      this.context.inputManager.removeMouseCommand(
        commandIdRotate,
        'mousemove'
      );
      this.context.inputManager.setPointerLock(false);

      scriptUI.clearMapUI();
    }

    return true;
  }

  getAvatarControllerMode() {
    return this.avatarControllerMode;
  }

  static get ID_SCRIPT() {
    return 'avatar_controller_id_ext_script';
  }
}
