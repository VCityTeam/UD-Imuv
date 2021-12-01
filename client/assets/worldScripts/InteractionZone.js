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
    this.localScript.conf.avatarsOnEnter = [];
    this.localScript.conf.avatarsColliding = [];
    this.localScript.conf.avatarsOnLeave = [];
  }

  onAvatarEnter(avatarGO) {
    const confLS = this.localScript.conf;
    const avatarGOUUID = avatarGO.getUUID();
    let index;
    if ((index = confLS.avatarsOnLeave.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsOnLeave.splice(index, 1);
    }
    if ((index = confLS.avatarsColliding.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsColliding.splice(index, 1);
    }
    if (confLS.avatarsOnEnter.includes(avatarGOUUID)) return;
    confLS.avatarsOnEnter.push(avatarGOUUID);
    this.go.setOutdated(true);
  }

  onAvatarColliding(avatarGO) {
    const confLS = this.localScript.conf;
    const avatarGOUUID = avatarGO.getUUID();
    let index;
    if ((index = confLS.avatarsOnEnter.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsOnEnter.splice(index, 1);
    }
    if ((index = confLS.avatarsOnLeave.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsOnLeave.splice(index, 1);
    }

    if (confLS.avatarsColliding.includes(avatarGOUUID)) return;
    confLS.avatarsColliding.push(avatarGOUUID);
    this.go.setOutdated(true);
  }

  onAvatarLeave(avatarGO) {
    const confLS = this.localScript.conf;
    const avatarGOUUID = avatarGO.getUUID();

    let index;
    if ((index = confLS.avatarsOnEnter.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsOnEnter.splice(index, 1);
    }
    if ((index = confLS.avatarsColliding.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsColliding.splice(index, 1);
    }

    if (confLS.avatarsOnLeave.includes(avatarGOUUID)) return;
    confLS.avatarsOnLeave.push(avatarGOUUID);
    this.go.setOutdated(true);
  }
};
