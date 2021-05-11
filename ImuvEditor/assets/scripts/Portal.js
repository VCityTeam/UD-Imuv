/** @format */

module.exports = class Portal {
  constructor(conf) {
    this.conf = conf;
  }

  onAvatar(avatarGo, world) {
    world.notify('portalEvent', [
      avatarGo,
      this.conf.worldDestUUID,
      this.conf.portalUUID,
    ]);
  }
};
