const { ScriptBase } = require('@ud-viz/game_shared');

module.exports = class Teleporter extends ScriptBase {
  onAvatar(avatarGO) {
    avatarGO.setFromTransformJSON(this.conf.destinationTransform);
  }

  static get ID_SCRIPT() {
    return 'teleporter_id_script';
  }
};
