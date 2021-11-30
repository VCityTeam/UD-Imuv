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
    if (
      !this.localScript ||
      !this.localScript.idScripts.includes('local_interactions')
    ) {
      console.error(
        this.go.name,
        'Prefab needs *local_interactions* local Script'
      );
    }
    console.log('Init Interaction Zone', this.go.name);
    this.localScript.conf = {
      avatarsOnEnter: [],
      avatarsColliding: [],
      avatarsOnLeave: [],
    };
  }

  onAvatarEnter(avatarGO) {
    console.log('onEnter');
    const confLS = this.localScript.conf;
    const goUUID = avatarGO.getUUID();
    let index;
    if ((index = confLS.avatarsOnLeave.indexOf(goUUID)) >= 0) {
      confLS.avatarsOnLeave.splice(index, 1);
    }
    if ((index = confLS.avatarsColliding.indexOf(goUUID)) >= 0) {
      confLS.avatarsColliding.splice(index, 1);
    }
    if (confLS.avatarsOnEnter.includes(goUUID)) return;
    confLS.avatarsOnEnter.push(goUUID);
    this.go.setOutdated(true);
  }

  onAvatarColliding(avatarGO) {
    const confLS = this.localScript.conf;
    const goUUID = avatarGO.getUUID();
    let index;
    if ((index = confLS.avatarsOnEnter.indexOf(goUUID)) >= 0) {
      console.log(confLS.avatarsOnEnter);
      confLS.avatarsOnEnter.splice(index, 1);
    }
    if ((index = confLS.avatarsOnLeave.indexOf(goUUID)) >= 0) {
      confLS.avatarsOnLeave.splice(index, 1);
    }

    if (confLS.avatarsColliding.includes(goUUID)) return;
    confLS.avatarsColliding.push(goUUID);
    this.go.setOutdated(true);
  }

  onAvatarLeave(avatarGO) {
    console.log('onLeave');
    const confLS = this.localScript.conf;
    const goUUID = avatarGO.getUUID();

    let index;
    if ((index = confLS.avatarsOnEnter.indexOf(goUUID)) >= 0) {
      confLS.avatarsOnEnter.splice(index, 1);
    }
    if ((index = confLS.avatarsColliding.indexOf(goUUID)) >= 0) {
      confLS.avatarsColliding.splice(index, 1);
    }

    if (confLS.avatarsOnLeave.includes(goUUID)) return;
    confLS.avatarsOnLeave.push(goUUID);
    this.go.setOutdated(true);
  }
};
