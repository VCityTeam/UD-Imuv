const { NativeCommandManager } = require('@ud-viz/game_shared_template');
const { ID } = require('../constant');

module.exports = class ImuvCommandManager extends NativeCommandManager {
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

  static get DEFAULT_VARIABLES() {
    return {
      avatarSpeedTranslate: 0.008,
      avatarSpeedRotate: 0.00001,
      cityAvatarSpeedTranslate: 0.08,
      cityAvatarSpeedRotate: 0.00001,
      zeppelinSpeedTranslate: 0.1,
      zeppelinSpeedRotate: 0.001,
      angleMin: -Math.PI / 5,
      angleMax: Math.PI / 5,
    };
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.IMUV_COMMAND_MANAGER;
  }
};
