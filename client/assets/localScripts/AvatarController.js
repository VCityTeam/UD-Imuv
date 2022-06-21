/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;
const itownsType = require('itowns');
/** @type {itownsType} */
let itowns = null;

module.exports = class AvatarController {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;

    //Avatar controller
    this.avatarControllerMode = false;
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const camera = gameView.getCamera();
    const manager = gameView.getInputManager();

    manager.addKeyInput('p', 'keydown', function () {
      console.log('DEBUG');
      console.log('Gameview ', gameView);
      console.log('Camera ', camera);
      console.log('uuid ', udviz.THREE.MathUtils.generateUUID());

      const avatar = gameView.getLastState().gameObject.findByName('avatar');
      if (avatar) console.log(avatar.object3D);

      console.log(new Game.GameObject({}).toJSON(true));
    });

    //exit pointer lock method
    manager.addMouseInput(manager.getElement(), 'click', function () {
      manager.setPointerLock(false);
    });

    if (!localCtx.getGameView().getUserData('firstGameView')) {
      //work with camera localscript
      this.setAvatarControllerMode(true, localCtx);
    }
  }

  setAvatarControllerMode(value, localCtx) {
    if (value == this.avatarControllerMode) {
      console.warn('same value');
      return false;
    }

    this.avatarControllerMode = value;

    //FORWARD
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();
    const Command = Game.Command;

    const commandIdForward = 'cmd_forward';
    const commandIdBackward = 'cmd_backward';
    const commandIdLeft = 'cmd_left';
    const commandIdRight = 'cmd_right';

    const switchItowns = localCtx.getRootGameObject().fetchLocalScripts()[
      'switch_itowns'
    ];
    if (switchItowns) {
      switchItowns.setWidgetButtonVisible(value);
    }

    if (value) {
      const refine = localCtx.getRootGameObject().fetchLocalScripts()[
        'itowns_refine'
      ];
      if (refine) refine.avatar();

      console.warn('add avatar control');

      const userID = gameView.getUserData('userID');
      const gameObjectToCtrlUUID = gameView.getUserData('avatarUUID');

      //forward
      let forwardStart = false;
      manager.addKeyCommand(commandIdForward, ['z', 'ArrowUp'], function () {
        const forwardDown =
          manager.isKeyDown('z') || manager.isKeyDown('ArrowUp');
        if (forwardDown != forwardStart) {
          forwardStart = forwardDown;
          if (forwardStart) {
            manager.setPointerLock(true);
            return new Command({
              type: Command.TYPE.MOVE_FORWARD_START,
              userID: userID,
              gameObjectUUID: gameObjectToCtrlUUID,
            });
          }
        }

        const forwardEnd =
          manager.isKeyUp('z') ||
          manager.isKeyUp('ArrowUp') ||
          manager.isKeyUp('s') ||
          manager.isKeyUp('ArrowDown');
        if (forwardEnd) {
          return new Command({
            type: Command.TYPE.MOVE_FORWARD_END,
            userID: userID,
            gameObjectUUID: gameObjectToCtrlUUID,
          });
        }
      });

      //backward
      let backwardStart = false;
      manager.addKeyCommand(commandIdBackward, ['s', 'ArrowDown'], function () {
        const backwardDown =
          manager.isKeyDown('s') || manager.isKeyDown('ArrowDown');
        if (backwardDown != backwardStart) {
          backwardStart = backwardDown;
          if (backwardStart) {
            manager.setPointerLock(true);
            return new Command({
              type: Command.TYPE.MOVE_BACKWARD_START,
              userID: userID,
              gameObjectUUID: gameObjectToCtrlUUID,
            });
          }
        }

        const backwardEnd =
          manager.isKeyUp('z') ||
          manager.isKeyUp('ArrowUp') ||
          manager.isKeyUp('s') ||
          manager.isKeyUp('ArrowDown');
        if (backwardEnd) {
          return new Command({
            type: Command.TYPE.MOVE_BACKWARD_END,
            userID: userID,
            gameObjectUUID: gameObjectToCtrlUUID,
          });
        }
      });

      //left
      let leftStart = false;
      manager.addKeyCommand(commandIdLeft, ['q', 'ArrowLeft'], function () {
        const leftDown =
          manager.isKeyDown('q') || manager.isKeyDown('ArrowLeft');
        if (leftDown != leftStart) {
          leftStart = leftDown;
          if (leftStart) {
            manager.setPointerLock(true);
            return new Command({
              type: Command.TYPE.MOVE_LEFT_START,
              userID: userID,
              gameObjectUUID: gameObjectToCtrlUUID,
            });
          }
        }

        const leftEnd =
          manager.isKeyUp('d') ||
          manager.isKeyUp('ArrowRight') ||
          manager.isKeyUp('q') ||
          manager.isKeyUp('ArrowLeft');
        if (leftEnd) {
          return new Command({
            type: Command.TYPE.MOVE_LEFT_END,
            userID: userID,
            gameObjectUUID: gameObjectToCtrlUUID,
          });
        }
      });

      //right
      let rightStart = false;
      manager.addKeyCommand(commandIdRight, ['d', 'ArrowRight'], function () {
        const rightDown =
          manager.isKeyDown('d') || manager.isKeyDown('ArrowRight');
        if (rightDown != rightStart) {
          rightStart = rightDown;
          if (rightStart) {
            manager.setPointerLock(true);
            return new Command({
              type: Command.TYPE.MOVE_RIGHT_START,
              userID: userID,
              gameObjectUUID: gameObjectToCtrlUUID,
            });
          }
        }

        const rightEnd =
          manager.isKeyUp('d') ||
          manager.isKeyUp('ArrowRight') ||
          manager.isKeyUp('q') ||
          manager.isKeyUp('ArrowLeft');
        if (rightEnd) {
          return new Command({
            type: Command.TYPE.MOVE_RIGHT_END,
            userID: userID,
            gameObjectUUID: gameObjectToCtrlUUID,
          });
        }
      });

      //ROTATE

      //fetch ui script
      let scriptUI = null;
      localCtx.getRootGameObject().traverse(function (child) {
        const scripts = child.fetchLocalScripts();
        if (scripts && scripts['ui']) {
          scriptUI = scripts['ui'];
          return true;
        }
      });

      manager.addMouseCommand('mousemove', function () {
        if (
          manager.getPointerLock() ||
          (this.isDragging() && !manager.getPointerLock())
        ) {
          const event = this.event('mousemove');
          if (event.movementX != 0 || event.movementY != 0) {
            let pixelX = -event.movementX;
            let pixelY = -event.movementY;

            const dragRatio = scriptUI
              .getMenuSettings()
              .getMouseSensitivityValue();

            pixelX *= dragRatio;
            pixelY *= dragRatio;

            return new Command({
              type: Command.TYPE.ROTATE,
              data: {
                vector: new Game.THREE.Vector3(pixelY, 0, pixelX),
              },
              userID: userID,
              gameObjectUUID: gameObjectToCtrlUUID,
            });
          }
        }
        return null;
      });
    } else {
      console.warn('remove avatar command');
      manager.removeKeyCommand(commandIdForward, ['z', 'ArrowUp']);
      manager.removeKeyCommand(commandIdBackward, ['s', 'ArrowDown']);
      manager.removeKeyCommand(commandIdRight, ['d', 'ArrowRight']);
      manager.removeKeyCommand(commandIdLeft, ['q', 'ArrowLeft']);
      manager.removeMouseCommand('mousemove');
      manager.setPointerLock(false);
    }

    return true;
  }

  getAvatarControllerMode() {
    return this.avatarControllerMode;
  }
};
