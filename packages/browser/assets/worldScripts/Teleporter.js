/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Teleporter {
  constructor(conf) {
    this.conf = conf;
  }

  init() {}

  onAvatar(avatarGO) {
    avatarGO.setFromTransformJSON(this.conf.destinationTransform);
  }
};
