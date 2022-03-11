/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class ZeppelinController {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;

    //Zeppelin controller
    this.zeppelinControllerMode = false;
    this.zeppelinGO = null;
    this.orbitControl = null;
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const camera = gameView.getCamera();
    const manager = gameView.getInputManager();

    //Zeppelin controller
    this.orbitControl = new udviz.OrbitControls(camera, manager.getElement());
    this.orbitControl.enabled = false;
  }

  setZeppelinControllerMode(value, localCtx) {
    if (!this.zeppelinGO) return; //no zeppelin

    if (value == this.zeppelinControllerMode) {
      console.warn('same value');
      return false;
    }

    this.zeppelinControllerMode = value;

    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();
    const Command = Game.Command;

    if (value) {
      const userID = gameView.getUserData('userID');
      const gameObjectToCtrlUUID = this.zeppelinGO.getUUID();
      manager.setPointerLock(false);

      //forward
      manager.addKeyCommand(
        Command.TYPE.MOVE_FORWARD,
        ['z', 'ArrowUp'],
        function () {
          return new Command({
            type: Command.TYPE.MOVE_FORWARD,
            userID: userID,
            gameObjectUUID: gameObjectToCtrlUUID,
          });
        }
      );

      //BACKWARD
      manager.addKeyCommand(
        Command.TYPE.MOVE_BACKWARD,
        ['s', 'ArrowDown'],
        function () {
          return new Command({
            type: Command.TYPE.MOVE_BACKWARD,
            userID: userID,
            gameObjectUUID: gameObjectToCtrlUUID,
          });
        }
      );

      //LEFT
      manager.addKeyCommand(
        Command.TYPE.MOVE_LEFT,
        ['q', 'ArrowLeft'],
        function () {
          return new Command({
            type: Command.TYPE.MOVE_LEFT,
            userID: userID,
            gameObjectUUID: gameObjectToCtrlUUID,
          });
        }
      );

      //RIGHT
      manager.addKeyCommand(
        Command.TYPE.MOVE_RIGHT,
        ['d', 'ArrowRight'],
        function () {
          return new Command({
            type: Command.TYPE.MOVE_RIGHT,
            userID: userID,
            gameObjectUUID: gameObjectToCtrlUUID,
          });
        }
      );
    } else {
      manager.removeKeyCommand(Command.TYPE.MOVE_FORWARD, ['z', 'ArrowUp']);
      manager.removeKeyCommand(Command.TYPE.MOVE_BACKWARD, ['s', 'ArrowDown']);
      manager.removeKeyCommand(Command.TYPE.MOVE_RIGHT, ['d', 'ArrowRight']);
      manager.removeKeyCommand(Command.TYPE.MOVE_LEFT, ['q', 'ArrowLeft']);
    }

    this.orbitControl.enabled = value;

    return true;
  }

  tick() {
    const localCtx = arguments[1];

    if (!this.zeppelinGO) {
      this.zeppelinGO = localCtx.getRootGameObject().findByName('Zeppelin');
    }

    if (this.zeppelinControllerMode) {
      const obj = this.zeppelinGO.getObject3D();
      let position = new Game.THREE.Vector3();
      obj.matrixWorld.decompose(
        position,
        new Game.THREE.Quaternion(),
        new Game.THREE.Vector3()
      );
      this.orbitControl.target.copy(position);
      this.orbitControl.update();
    }
  }
};
