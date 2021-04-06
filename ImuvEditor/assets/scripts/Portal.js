/** @format */

module.exports = class GameManager {
  constructor(conf) {
    this.conf = conf;
  }

  onAvatar(avatarGo, world) {
    world.notify('portalEvent', [avatarGo, this.conf.worldDestUUID]);
  }
};
