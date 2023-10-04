const { ScriptBase, Command } = require('@ud-viz/game_shared');
const THREE = require('three');

const AVATAR_SPEED_MOVE = 0.03;
const AVATAR_SPEED_ROTATION_Z = 0.00001;
const AVATAR_SPEED_ROTATION_X = 0.00001;
const AVATAR_ANGLE_MIN = Math.PI / 5;
const AVATAR_ANGLE_MAX = 2 * Math.PI - Math.PI / 10;

module.exports = class CityAvatar extends ScriptBase {
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
          case Command.TYPE.MOVE_FORWARD:
            go.move(
              go.computeForwardVector().setLength(dt * AVATAR_SPEED_MOVE)
            );
            go.getPosition().z = oldZ; // freeze z
            go.setOutdated(true);
            break;
          case Command.TYPE.MOVE_BACKWARD:
            go.move(
              go.computeBackwardVector().setLength(dt * AVATAR_SPEED_MOVE * 0.3)
            );
            go.getPosition().z = oldZ; // freeze z
            go.setOutdated(true);
            break;
          case Command.TYPE.MOVE_LEFT:
            go.move(
              go
                .computeForwardVector()
                .applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.5)
                .setLength(dt * AVATAR_SPEED_MOVE * 0.5)
            );
            go.getPosition().z = oldZ; // freeze z
            go.setOutdated(true);
            break;
          case Command.TYPE.MOVE_RIGHT:
            go.move(
              go
                .computeForwardVector()
                .applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5)
                .setLength(dt * AVATAR_SPEED_MOVE * 0.5)
            );
            go.getPosition().z = oldZ; // freeze z
            go.setOutdated(true);
            break;
          case Command.TYPE.ROTATE:
            go.rotate(
              new THREE.Vector3(
                cmd.getData().vector.x * AVATAR_SPEED_ROTATION_X,
                cmd.getData().vector.y,
                cmd.getData().vector.z * AVATAR_SPEED_ROTATION_Z
              ).multiplyScalar(dt)
            );
            this.clampRotation(go);
            go.setOutdated(true);
            commands.unshift(); // remove one by one
            break;
          case Command.TYPE.Z_UPDATE:
            if (!cmd.getData()) break;
            go.setPosition(
              new THREE.Vector3(
                go.getPosition().x,
                go.getPosition().y,
                cmd.getData()
              )
            );
            go.setOutdated(true);
            break;
          default:
            console.warn('command not handle ', cmd.getType());
        }
        commands.splice(index, 1);
      }
    }
  }

  clampRotation(gameObject) {
    // clamp
    const rotation = gameObject.getRotation();
    rotation.y = 0;
    // borne between 0 => 2pi
    const angle1 = AVATAR_ANGLE_MIN;
    const angle2 = AVATAR_ANGLE_MAX;
    if (rotation.x > Math.PI) {
      rotation.x = Math.max(rotation.x, angle2);
    } else {
      rotation.x = Math.min(angle1, rotation.x);
    }
  }

  static get ID_SCRIPT() {
    return 'city_avatar_id_script';
  }
};
