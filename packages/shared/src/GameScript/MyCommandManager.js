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

module.exports = class MyCommandManager extends NativeCommandManager {
  constructor(context, object3D, variables) {
    const overWriteVariables = JSON.parse(JSON.stringify(defaultVariables));
    Data.objectOverWrite(overWriteVariables, variables);
    super(context, object3D, overWriteVariables);
  }

  onCommand(type, data) {
    if (!data) return;
    /** @type {Object3D} */
    const updatedObject3D = this.context.object3D.getObjectByProperty(
      'uuid',
      data.object3DUUID
    );

    if (updatedObject3D.userData.isAvatar) {
      this.variables.speedTranslate = this.variables.avatarSpeedTranslate;
      this.variables.speedRotate = this.variables.avatarSpeedRotate;
    }
    if (updatedObject3D.userData.isZeppelin) {
      this.variables.speedTranslate = this.variables.zeppelinSpeedTranslate;
      this.variables.speedRotate = this.variables.zeppelinSpeedRotate;
    }

    super.onCommand(type, data);
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
