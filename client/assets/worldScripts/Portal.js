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
    this.conf.delay = 1000; // Test antoher way than a delay :O
  }

  notifyEnter(avatarGo) {
    const conf = this.conf;
    const delayInMilliseconds = conf.delay;
    console.log(delayInMilliseconds);
    const world = this.worldCtxt.getWorld();
    setTimeout(function () {
      console.log('Teleport');
      world.notify('portalEvent', [
        avatarGo,
        conf.worldDestUUID,
        conf.portalUUID,
      ]);
    }, delayInMilliseconds);
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
