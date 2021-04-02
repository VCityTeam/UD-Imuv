/** @format */

module.exports = class GameManager {
  constructor(conf) {
    this.conf = conf;
  }

  onAvatar(avatarGo, world) {
    console.log('portal collide ', avatarGo);
    world.notify('portal', [avatarGo, this.conf.worldDestUUID]);
  }
};
