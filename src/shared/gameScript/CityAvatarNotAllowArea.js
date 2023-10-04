const { ScriptBase } = require('@ud-viz/game_shared');

// this script is just here to help identify cityAvatarNotAllowArea GameObject
// TODO use userdata of object3D instead of a script
module.exports = class CityAvatarNotAllowArea extends ScriptBase {
  static get ID_SCRIPT() {
    return 'avatar_not_allow_id_script';
  }
};
