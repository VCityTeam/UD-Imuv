const { ScriptBase, ExternalScriptComponent } = require('@ud-viz/game_shared');
const { cityAvatar } = require('../prefabFactory');
const ImuvCommandManager = require('./ImuvCommandManager');
const { ID, COMMAND } = require('../constant');
const Spawner = require('./Spawner');

module.exports = class Avatar extends ScriptBase {
  init() {
    this.cityAvatar = null;
    this.canCityAvatar = true;

    /** @type {ImuvCommandManager} */
    const commandManager = this.context.findGameScriptWithID(
      ImuvCommandManager.ID_SCRIPT
    );
    commandManager.addEventListener(
      ImuvCommandManager.EVENT.OBJECT_3D_LEAVE_MAP,
      ({ object3D }) => {
        if (
          !this.canCityAvatar || // inside a cityNotAllowArea
          !commandManager.variables.cityAvatarAllow || // not allow on this game
          this.object3D.uuid != object3D.uuid || // not him
          this.cityAvatar // cityAvatar already created
        )
          return;
        commandManager.stop(this.object3D); // stop movement of the this.object3D
        commandManager.freeze(this.object3D, true); // freeze it
        this.object3D.rotation.set(0, 0, 0); // so city avatar referential is neutral

        const externalComp = this.object3D.getComponent(
          ExternalScriptComponent.TYPE
        );
        externalComp.model.variables.visible = false; // make it invisible
        this.object3D.setOutdated(true);

        this.cityAvatar = cityAvatar(this.object3D);
        this.context.addObject3D(this.cityAvatar, this.object3D.uuid); // add it to this to know which one belong to who
      }
    );
  }

  tick() {
    this.applyCommandCallbackOf(COMMAND.ESCAPE_CITY_AVATAR, (data) => {
      if (data.object3DUUID != this.object3D.uuid || !this.cityAvatar)
        return false;
      /** @type {ImuvCommandManager} */
      const commandManager = this.context.findGameScriptWithID(
        ImuvCommandManager.ID_SCRIPT
      );

      this.context.removeObject3D(this.cityAvatar.uuid);
      this.cityAvatar = null;
      commandManager.freeze(this.object3D, false);
      const externalComp = this.object3D.getComponent(
        ExternalScriptComponent.TYPE
      );
      externalComp.model.variables.visible = true;
      this.object3D.setOutdated(true);

      /** @type {Spawner} */
      const spawner = this.context.findGameScriptWithID(Spawner.ID_SCRIPT);
      spawner.initializeSpawnTransform(this.object3D);

      return true;
    });
  }

  onEnterCollision(object3D) {
    if (object3D.userData.isCityNotAllowArea) this.canCityAvatar = false;
  }

  onLeaveCollision(object3D) {
    if (object3D.userData.isCityNotAllowArea) this.canCityAvatar = true;
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.AVATAR;
  }
};
