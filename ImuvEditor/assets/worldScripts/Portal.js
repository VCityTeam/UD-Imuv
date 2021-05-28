/** @format */

module.exports = class Portal {
  constructor(conf) {
    this.conf = conf;
    this.go = null;
  }

  init() {
    this.go = arguments[0];
  }

  onAvatar(avatarGo, world) {
    world.notify('portalEvent', [
      avatarGo,
      this.conf.worldDestUUID,
      this.conf.portalUUID,
    ]);
  }

  setTransformOf(go) {
    //portal position
    go.setPosition(this.go.getPosition().clone());

    //rotation in config
    const newRotation = go.getRotation();
    newRotation.x = this.conf.spawnRotation.x;
    newRotation.y = this.conf.spawnRotation.y;
    newRotation.z = this.conf.spawnRotation.z;
    go.setRotation(newRotation);
  }
};
