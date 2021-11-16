/**@format */
let Shared;

let count = 0
module.exports = class ButterflyTriggerZone {
  constructor(conf, SharedModule) {
    this.conf = conf;
    Shared = SharedModule;
  }

  init() {
    console.log('Init Butterfly Trigger Zone');
    this.go = arguments[0];
  }

  onAvatarEnter() {
    const butterflySpawnerLS = this.go.getComponent(Shared.LocalScript.TYPE);
    butterflySpawnerLS.conf.onEnter = true;
    this.go.setOutdated(true);
    count++
  }

  onAvatarColliding() {
    const butterflySpawnerLS = this.go.getComponent(Shared.LocalScript.TYPE);

    if (butterflySpawnerLS.conf.onEnter === false) return;
    
    //notify only when changes occur
    butterflySpawnerLS.conf.onEnter = false;
    this.go.setOutdated(true);
  }
};
