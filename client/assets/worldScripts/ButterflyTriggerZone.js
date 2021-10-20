/**@format */
let Shared;
module.exports = class ButterflyTriggerZone {
  constructor(conf, SharedModule) {
    this.conf = conf;
    Shared = SharedModule;
  }

  init() {
    console.log('Init Butterfly Trigger Zone');
    const go = arguments[0];
    if (!go) return;
  }

  onAvatarEnter(avatarGO) {
    console.log('Papillon de lumiere');
  }

  onAvatarExit(avatarGO) {
    avatarGO.setFromTransformJSON(this.conf.destinationTransform);
  }
};
