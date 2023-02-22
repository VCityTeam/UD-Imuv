const { Game } = require('@ud-viz/shared');

module.exports = class InteractionZone extends Game.ScriptBase {
  init() {
    const externalScriptComp = this.object3D.getComponent(
      Game.Component.ExternalScript.TYPE
    );

    if (
      !externalScriptComp
        .getModel()
        .getIdScripts()
        .includes('LocalInteractions')
    ) {
      console.error(
        this.object3D.name,
        'Prefab needs *local_interactions* external Script'
      );
    }

    const modelVariables = externalScriptComp.getModel().getVariables();
    modelVariables.avatarsOnEnter = [];
    modelVariables.avatarsColliding = [];
    modelVariables.avatarsOnLeave = [];
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
      this.go.setOutdated(true);
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
      this.go.setOutdated(true);
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
      this.go.setOutdated(true);
      // console.log('ON LEAVE conf changed');
    }
  }
};
