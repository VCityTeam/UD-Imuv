const { NativeCommandManager } = require('@ud-viz/game_shared_template');
const { objectOverWrite } = require('@ud-viz/utils_shared');
const { ID } = require('../constant');

const defaultVariables = {
  avatarSpeedTranslate: 0.008,
  avatarSpeedRotate: 0.00001,
  cityAvatarSpeedTranslate: 0.08,
  cityAvatarSpeedRotate: 0.001,
  zeppelinSpeedTranslate: 0.1,
  zeppelinSpeedRotate: 0.001,
  angleMin: -Math.PI / 5,
  angleMax: Math.PI / 5,
};

module.exports = class ImuvCommandManager extends NativeCommandManager {
  constructor(context, object3D, variables) {
    const overWriteVariables = JSON.parse(JSON.stringify(defaultVariables));
    objectOverWrite(overWriteVariables, variables);
    super(context, object3D, overWriteVariables);
  }

  computeObjectSpeedTranslate(object) {
    if (object.userData.isAvatar) {
      return this.variables.avatarSpeedTranslate;
    }
    if (object.userData.isZeppelin) {
      return this.variables.zeppelinSpeedTranslate;
    }
    if (object.userData.isCityAvatar) {
      return this.variables.cityAvatarSpeedTranslate;
    }
  }
  computeObjectSpeedRotate(object) {
    if (object.userData.isAvatar) {
      return this.variables.avatarSpeedRotate;
    }
    if (object.userData.isZeppelin) {
      return this.variables.zeppelinSpeedRotate;
    }
    if (object.userData.isCityAvatar) {
      return this.variables.cityAvatarSpeedRotate;
    }
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.IMUV_COMMAND_MANAGER;
  }
};
