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

  onEnterCollision(gameObjectCollided) {
    if (gameObjectCollided.userData.isAvatar) {
      let confHasChanged = false;
      const externalScriptComp = this.object3D.getComponent(
        Game.Component.ExternalScript.TYPE
      );
      const modelVariables = externalScriptComp.getModel().getVariables();

      let index;
      if (
        (index = modelVariables.avatarsOnLeave.indexOf(
          gameObjectCollided.uuid
        )) >= 0
      ) {
        modelVariables.avatarsOnLeave.splice(index, 1);
        confHasChanged = true;
      }
      if (
        (index = modelVariables.avatarsColliding.indexOf(
          gameObjectCollided.uuid
        )) >= 0
      ) {
        modelVariables.avatarsColliding.splice(index, 1);
        confHasChanged = true;
      }
      if (!modelVariables.avatarsOnEnter.includes(gameObjectCollided.uuid)) {
        modelVariables.avatarsOnEnter.push(gameObjectCollided.uuid);
        confHasChanged = true;
      }

      if (confHasChanged) {
        this.object3D.setOutdated(true);
        // console.log('ON ENTER conf changed');
      }
    }
  }

  isColliding(gameObjectCollided) {
    if (gameObjectCollided.userData.isAvatar) {
      let confHasChanged = false;
      const externalScriptComp = this.object3D.getComponent(
        Game.Component.ExternalScript.TYPE
      );
      const modelVariables = externalScriptComp.getModel().getVariables();

      let index;
      if (
        (index = modelVariables.avatarsOnLeave.indexOf(
          gameObjectCollided.uuid
        )) >= 0
      ) {
        modelVariables.avatarsOnLeave.splice(index, 1);
        confHasChanged = true;
      }
      if (
        (index = modelVariables.avatarsOnEnter.indexOf(
          gameObjectCollided.uuid
        )) >= 0
      ) {
        modelVariables.avatarsOnEnter.splice(index, 1);
        confHasChanged = true;
      }
      if (!modelVariables.avatarsColliding.includes(gameObjectCollided.uuid)) {
        modelVariables.avatarsColliding.push(gameObjectCollided.uuid);
        confHasChanged = true;
      }

      if (confHasChanged) {
        this.object3D.setOutdated(true);
        // console.log('ON COLLIDING conf changed');
      }
    }
  }

  onLeaveCollision(gameObjectCollided) {
    if (gameObjectCollided.userData.isAvatar) {
      let confHasChanged = false;
      const externalScriptComp = this.object3D.getComponent(
        Game.Component.ExternalScript.TYPE
      );
      const modelVariables = externalScriptComp.getModel().getVariables();

      let index;
      if (
        (index = modelVariables.avatarsColliding.indexOf(
          gameObjectCollided.uuid
        )) >= 0
      ) {
        modelVariables.avatarsColliding.splice(index, 1);
        confHasChanged = true;
      }
      if (
        (index = modelVariables.avatarsOnEnter.indexOf(
          gameObjectCollided.uuid
        )) >= 0
      ) {
        modelVariables.avatarsOnEnter.splice(index, 1);
        confHasChanged = true;
      }
      if (!modelVariables.avatarsOnLeave.includes(gameObjectCollided.uuid)) {
        modelVariables.avatarsOnLeave.push(gameObjectCollided.uuid);
        confHasChanged = true;
      }

      if (confHasChanged) {
        this.object3D.setOutdated(true);
        // console.log('ON LEAVE conf changed');
      }
    }
  }
};