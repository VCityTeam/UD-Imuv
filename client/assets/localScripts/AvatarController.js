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

module.exports = class Controller {
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

    manager.listenKeys(['c']);

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

    if (value) {
      console.warn('add avatar control');

      const userID = gameView.getUserData('userID');
      const gameObjectToCtrlUUID = gameView.getUserData('avatarUUID');

      //forward
      let forwardStart = false;
      let forwardEnd = false;
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

        const forwardUp = manager.isKeyUp('z') || manager.isKeyUp('ArrowUp');
        if (forwardUp != forwardEnd) {
          forwardEnd = forwardUp;
          if (forwardEnd) {
            return new Command({
              type: Command.TYPE.MOVE_FORWARD_END,
              userID: userID,
              gameObjectUUID: gameObjectToCtrlUUID,
            });
          }
        }
      });

      //backward
      let backwardStart = false;
      let backwardEnd = false;
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

        const backwardUp = manager.isKeyUp('s') || manager.isKeyUp('ArrowDown');
        if (backwardUp != backwardEnd) {
          backwardEnd = backwardUp;
          if (backwardEnd) {
            return new Command({
              type: Command.TYPE.MOVE_BACKWARD_END,
              userID: userID,
              gameObjectUUID: gameObjectToCtrlUUID,
            });
          }
        }
      });

      //left
      let leftStart = false;
      let leftEnd = false;
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

        const leftUp = manager.isKeyUp('q') || manager.isKeyUp('ArrowLeft');
        if (leftUp != leftEnd) {
          leftEnd = leftUp;
          if (leftEnd) {
            return new Command({
              type: Command.TYPE.MOVE_LEFT_END,
              userID: userID,
              gameObjectUUID: gameObjectToCtrlUUID,
            });
          }
        }
      });

      //right
      let rightStart = false;
      let rightEnd = false;
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

        const rightUp = manager.isKeyUp('d') || manager.isKeyUp('ArrowRight');
        if (rightUp != rightEnd) {
          rightEnd = rightUp;
          if (rightEnd) {
            return new Command({
              type: Command.TYPE.MOVE_RIGHT_END,
              userID: userID,
              gameObjectUUID: gameObjectToCtrlUUID,
            });
          }
        }
      });

      //ROTATE
      manager.addMouseCommand('mousemove', function () {
        if (
          manager.getPointerLock() ||
          (this.isDragging() && !manager.getPointerLock())
        ) {
          const event = this.event('mousemove');
          if (event.movementX != 0 || event.movementY != 0) {
            let pixelX = -event.movementX;
            let pixelY = -event.movementY;

            if (this.isDragging()) {
              const dragRatio = 2; //TODO conf ?
              pixelX *= dragRatio;
              pixelY *= dragRatio;
            }

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
