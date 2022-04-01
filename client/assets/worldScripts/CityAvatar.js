/** @format */

//scripts are commonJs module witout dependency all game context is pass as ud-viz/Game
//this is due to the fact that the code is import as a string then eval() in code by the AsssetsManager

const AVATAR_SPEED_MOVE = 0.01;
const AVATAR_SPEED_ROTATION_Z = 0.00005;
const AVATAR_SPEED_ROTATION_X = 0.00003;
const AVATAR_ANGLE_MIN = Math.PI / 5;
const AVATAR_ANGLE_MAX = 2 * Math.PI - Math.PI / 10;

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Avatar {
  constructor(conf, GameModule) {
    this.conf = conf;

    Game = GameModule;
  }

  tick() {
    const go = arguments[0];

    const worldContext = arguments[1];
    const dt = worldContext.getDt();
    const commands = worldContext.getCommands();
    const speedTranslate = 0.04;
    const speedRotate = 0.003;

    for (let index = commands.length - 1; index >= 0; index--) {
      const cmd = commands[index];
      if (cmd.getGameObjectUUID() == go.getUUID()) {
        switch (cmd.getType()) {
          case Game.Command.TYPE.MOVE_FORWARD:
            go.move(go.computeForwardVector().setLength(dt * speedTranslate));
            break;
          case Game.Command.TYPE.MOVE_BACKWARD:
            go.move(go.computeBackwardVector().setLength(dt * speedTranslate));
            break;
          case Game.Command.TYPE.MOVE_LEFT:
            go.rotate(new Game.THREE.Vector3(0, 0, speedRotate * dt));
            break;
          case Game.Command.TYPE.MOVE_RIGHT:
            go.rotate(new Game.THREE.Vector3(0, 0, -speedRotate * dt));
            break;
          case Game.Command.TYPE.Z_UPDATE:
            const z = cmd.getData();
            if (!z) break;
            const currentPos = go.getPosition();
            go.setPosition(
              new Game.THREE.Vector3(currentPos.x, currentPos.y, z)
            );
            break;
          default:
            throw new Error('command not handle ', cmd.getType());
        }
        commands.splice(index, 1);
      }
    }
  }
};
