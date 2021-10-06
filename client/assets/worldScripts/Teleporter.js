/** @format */

module.exports = class Teleporter {
  constructor(conf) {
    this.conf = conf;
  }

  init() {}

  onAvatar(avatarGO) {
    avatarGO.setFromTransformJSON(this.conf.destinationTransform);
  }
};
