/**@format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class InteractionZone {
  constructor(conf, GameModule) {
    this.conf = conf;
    Game = GameModule;
  }

  init() {
    this.go = arguments[0];
    this.localScript = this.go.getComponent(Game.LocalScript.TYPE);
    if (
      !this.localScript ||
      !this.localScript.idScripts.includes('local_interactions')
    ) {
      console.error(
        this.go.name,
        'Prefab needs *local_interactions* local Script'
      );
    }
    // console.log('Init Interaction Zone', this.go.name);
    this.localScript.conf.avatarsOnEnter = [];
    this.localScript.conf.avatarsColliding = [];
    this.localScript.conf.avatarsOnLeave = [];
  }

  onAvatarEnter(avatarGO) {
    let confHasChanged = false;

    const confLS = this.localScript.conf;
    const avatarGOUUID = avatarGO.getUUID();
    let index;
    if ((index = confLS.avatarsOnLeave.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsOnLeave.splice(index, 1);
      confHasChanged = true;
    }
    if ((index = confLS.avatarsColliding.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsColliding.splice(index, 1);
      confHasChanged = true;
    }
    if (!confLS.avatarsOnEnter.includes(avatarGOUUID)) {
      confLS.avatarsOnEnter.push(avatarGOUUID);
      confHasChanged = true;
    }

    if (confHasChanged) {
      this.go.setOutdated(confHasChanged);
      // console.log('ON ENTER conf changed');
    }
  }

  onAvatarColliding(avatarGO) {
    let confHasChanged = false;

    const confLS = this.localScript.conf;
    const avatarGOUUID = avatarGO.getUUID();
    let index;
    if ((index = confLS.avatarsOnLeave.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsOnLeave.splice(index, 1);
      confHasChanged = true;
    }
    if ((index = confLS.avatarsOnEnter.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsOnEnter.splice(index, 1);
      confHasChanged = true;
    }
    if (!confLS.avatarsColliding.includes(avatarGOUUID)) {
      confLS.avatarsColliding.push(avatarGOUUID);
      confHasChanged = true;
    }

    if (confHasChanged) {
      this.go.setOutdated(confHasChanged);
      // console.log('ON COLLIDING conf changed');
    }
  }

  onAvatarLeave(avatarGO) {
    let confHasChanged = false;

    const confLS = this.localScript.conf;
    const avatarGOUUID = avatarGO.getUUID();
    let index;
    if ((index = confLS.avatarsColliding.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsColliding.splice(index, 1);
      confHasChanged = true;
    }
    if ((index = confLS.avatarsOnEnter.indexOf(avatarGOUUID)) >= 0) {
      confLS.avatarsOnEnter.splice(index, 1);
      confHasChanged = true;
    }
    if (!confLS.avatarsOnLeave.includes(avatarGOUUID)) {
      confLS.avatarsOnLeave.push(avatarGOUUID);
      confHasChanged = true;
    }

    if (confHasChanged) {
      this.go.setOutdated(confHasChanged);
      // console.log('ON LEAVE conf changed');
    }
  }
};
