/**@format */

let Shared;

module.exports = class InteractionZone {
  constructor(conf, SharedModule) {
    this.conf = conf;
    Shared = SharedModule;
  }

  init() {
    this.go = arguments[0];
    if (!this.go.fetchLocalScripts()['local_interactions']) {
      console.error('GameObject needs local_interactions local Script');
    }
    console.log('Init Interaction Zone', this.go.name);
    this.localScript = this.go.getComponent(Shared.LocalScript.TYPE);
  }

  onAvatarEnter() {
    this.localScript.conf.onLeave = false;
    this.localScript.conf.isColliding = false;

    this.localScript.conf.onEnter = true;
    this.go.setOutdated(true);
  }

  onAvatarColliding() {
    if (this.localScript.conf.isColliding === true) return;
    this.localScript.conf.onEnter = false;
    this.localScript.conf.onLeave = false;

    this.localScript.conf.isColliding = true;
    this.go.setOutdated(true);
  }

  onAvatarLeave() {
    this.localScript.conf.onEnter = false;
    this.localScript.conf.isColliding = false;

    this.localScript.conf.onLeave = true;
    this.go.setOutdated(true);
  }
};
