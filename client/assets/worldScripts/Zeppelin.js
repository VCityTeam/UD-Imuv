/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Zeppelin {
  constructor(conf, GameModule) {
    this.conf = conf;

    Game = GameModule;

    this.currentTime = 0;
    this.radius = 82;
  }

  init() {
    const go = arguments[0];
    const worldContext = arguments[1];

    this.centerCircle = new Game.THREE.Vector3(0, 0, 30);
  }

  computePosition(t, result) {
    result.x = this.centerCircle.x + this.radius * Math.cos(t);
    result.y = this.centerCircle.y + this.radius * Math.sin(t);
    result.z = this.centerCircle.z;

    return result;
  }

  tick() {
    const go = arguments[0];

    const worldContext = arguments[1];
    const dt = worldContext.getDt();
    const commands = worldContext.getCommands();
    const speedTranslate = 0.05;
    const speedRotate = 0.001;

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
          default:
            throw new Error('command not handle ', cmd.getType());
        }
        commands.splice(index, 1);
      }
    }
  }
};
