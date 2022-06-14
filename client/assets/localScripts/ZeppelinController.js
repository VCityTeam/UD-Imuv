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
  }

  getZeppelinControllerMode() {
    return this.zeppelinControllerMode;
  }

  setZeppelinControllerMode(value, localCtx) {
    const zeppelinGO = localCtx.getRootGameObject().findByName('Zeppelin');

    if (!zeppelinGO) return false; //still no zeppelin

    if (value == this.zeppelinControllerMode) {
      console.warn('same value');
      return false;
    }

    this.zeppelinControllerMode = value;

    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();
    const Command = Game.Command;

    if (value) {
      const refine = localCtx.getRootGameObject().fetchLocalScripts()[
        'itowns_refine'
      ];
      if (refine) refine.zeppelin();

      const userID = gameView.getUserData('userID');
      const gameObjectToCtrlUUID = zeppelinGO.getUUID();
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

    return true;
  }
};
