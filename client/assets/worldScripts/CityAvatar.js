/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

const AVATAR_SPEED_MOVE = 0.03;
const AVATAR_SPEED_ROTATION_Z = 0.00001;
const AVATAR_SPEED_ROTATION_X = 0.00001;
const AVATAR_ANGLE_MIN = Math.PI / 5;
const AVATAR_ANGLE_MAX = 2 * Math.PI - Math.PI / 10;

module.exports = class CityAvatar {
  constructor(conf, GameModule) {
    this.conf = conf;

    Game = GameModule;
  }

  tick() {
    const go = arguments[0];

    const worldContext = arguments[1];
    const dt = worldContext.getDt();
    const commands = worldContext.getCommands();

    for (let index = commands.length - 1; index >= 0; index--) {
      const cmd = commands[index];
      if (cmd.getGameObjectUUID() == go.getUUID()) {
        const oldZ = go.getPosition().z;
        switch (cmd.getType()) {
          case Game.Command.TYPE.MOVE_FORWARD:
            go.move(
              go.computeForwardVector().setLength(dt * AVATAR_SPEED_MOVE)
            );
            go.getPosition().z = oldZ; //freeze z
            break;
          case Game.Command.TYPE.MOVE_BACKWARD:
            go.move(
              go.computeBackwardVector().setLength(dt * AVATAR_SPEED_MOVE * 0.3)
            );
            go.getPosition().z = oldZ; //freeze z
            break;
          case Game.Command.TYPE.MOVE_LEFT:
            go.move(
              go
                .computeForwardVector()
                .applyAxisAngle(new Game.THREE.Vector3(0, 0, 1), Math.PI * 0.5)
                .setLength(dt * AVATAR_SPEED_MOVE * 0.5)
            );
            go.getPosition().z = oldZ; //freeze z
            break;
          case Game.Command.TYPE.MOVE_RIGHT:
            go.move(
              go
                .computeForwardVector()
                .applyAxisAngle(new Game.THREE.Vector3(0, 0, 1), -Math.PI * 0.5)
                .setLength(dt * AVATAR_SPEED_MOVE * 0.5)
            );
            go.getPosition().z = oldZ; //freeze z
            break;
          case Game.Command.TYPE.ROTATE:
            const vectorJSON = cmd.getData().vector;
            const vector = new Game.THREE.Vector3(
              vectorJSON.x * AVATAR_SPEED_ROTATION_X,
              vectorJSON.y,
              vectorJSON.z * AVATAR_SPEED_ROTATION_Z
            );
            go.rotate(vector.multiplyScalar(dt));
            this.clampRotation(go);
            commands.unshift(); //remove one by one
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
            console.warn('command not handle ', cmd.getType());
        }
        commands.splice(index, 1);
      }
    }
  }

  clampRotation(gameObject) {
    //clamp
    const rotation = gameObject.getRotation();
    rotation.y = 0;
    //borne between 0 => 2pi
    const angle1 = AVATAR_ANGLE_MIN;
    const angle2 = AVATAR_ANGLE_MAX;
    if (rotation.x > Math.PI) {
      rotation.x = Math.max(rotation.x, angle2);
    } else {
      rotation.x = Math.min(angle1, rotation.x);
    }
  }
};
