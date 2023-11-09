const { ScriptBase } = require('@ud-viz/game_shared');
const { ID } = require('../constant');

module.exports = class Teleporter extends ScriptBase {
  onAvatar(avatarGO) {
    avatarGO.setFromTransformJSON(this.conf.destinationTransform);
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.TELEPORTER;
  }
};
