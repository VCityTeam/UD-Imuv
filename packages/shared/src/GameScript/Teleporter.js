const { Game } = require('@ud-viz/shared');

module.exports = class Teleporter extends Game.ScriptBase {
  onAvatar(avatarGO) {
    avatarGO.setFromTransformJSON(this.conf.destinationTransform);
  }
};
