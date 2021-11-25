/**@format */

let Shared;

module.exports = class InteractionZone {
  constructor(conf, SharedModule) {
    this.conf = conf;
    Shared = SharedModule;
  }

  init() {
    this.go = arguments[0];
    this.localScript = this.go.getComponent(Shared.LocalScript.TYPE);
    if (!this.localScript || !this.localScript.idScripts.includes('local_interactions')) {
      console.error(
        this.go.name,
        'Prefab needs *local_interactions* local Script'
      );
    }
    console.log('Init Interaction Zone', this.go.name);
  }

  onAvatarEnter() {
    const confLS = this.localScript.conf;

    confLS.onLeave = false;
    confLS.isColliding = false;

    confLS.onEnter = true;
    this.go.setOutdated(true);
  }

  onAvatarColliding() {
    const confLS = this.localScript.conf;

    confLS.onEnter = false;
    confLS.onLeave = false;
    if (confLS.isColliding === true) return;
    confLS.isColliding = true;
    this.go.setOutdated(true);
  }

  onAvatarLeave() {
    const confLS = this.localScript.conf;

    confLS.onEnter = false;
    confLS.isColliding = false;

    confLS.onLeave = true;
    this.go.setOutdated(true);
  }
};
