/** @format */
let Shared = null;
module.exports = class Portal {
  constructor(conf, SharedModule) {
    this.conf = conf;
    this.go = null;
    Shared = SharedModule;
  }

  init() {
    this.go = arguments[0];
    this.worldCtxt = arguments[1];
    this.localScript = this.go.getComponent(Shared.LocalScript.TYPE);
  }

  notifyEnter(avatarGo) {
    const world = this.worldCtxt.getWorld();
    const avatarGo = avatarGo;
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

    if (this.conf.spawnRotation) {
      newRotation.x = this.conf.spawnRotation.x;
      newRotation.y = this.conf.spawnRotation.y;
      newRotation.z = this.conf.spawnRotation.z;
    }

    go.setRotation(newRotation);
  }
};
