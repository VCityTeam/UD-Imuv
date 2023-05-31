const { Game } = require('@ud-viz/shared');

//this script is just here to help identify cityAvatarNotAllowArea GameObject
//TODO use userdata of object3D instead of a script
module.exports = class CityAvatarNotAllowArea extends Game.ScriptBase {
  static get ID_SCRIPT() {
    return 'avatar_not_allow_id_script';
  }
};
