const { Data } = require('@ud-viz/shared');
const {
  NativeCommandManager,
} = require('@ud-viz/shared/src/Game/ScriptTemplate/ScriptTemplate');

const defaultVariables = {
  avatarSpeedTranslate: 0.008,
  avatarSpeedRotate: 0.00001,
  zeppelinSpeedTranslate: 0.08,
  zeppelinSpeedRotate: 0.0001,
};

module.exports = class ImuvCommandManager extends NativeCommandManager {
  constructor(context, object3D, variables) {
    const overWriteVariables = JSON.parse(JSON.stringify(defaultVariables));
    Data.objectOverWrite(overWriteVariables, variables);
    super(context, object3D, overWriteVariables);
  }

  computeObjectSpeedTranslate(object) {
    if (object.userData.isAvatar) {
      return this.variables.avatarSpeedTranslate;
    }
    if (object.userData.isZeppelin) {
      return this.variables.zeppelinSpeedTranslate;
    }
  }
  computeObjectSpeedRotate(object) {
    if (object.userData.isAvatar) {
      return this.variables.avatarSpeedRotate;
    }
    if (object.userData.isZeppelin) {
      return this.variables.zeppelinSpeedRotate;
    }
  }

  static get ID_SCRIPT() {
    return 'my_command_manager_id';
  }
};
