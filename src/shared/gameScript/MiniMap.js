const { ScriptBase, ExternalScriptComponent } = require('@ud-viz/game_shared');
const { COMMAND, ID } = require('../constant');
const { AbstractMap } = require('@ud-viz/game_shared_template');

module.exports = class MiniMap extends ScriptBase {
  tick() {
    const extScriptComp = this.object3D.getComponent(
      ExternalScriptComponent.TYPE
    );

    /* Clearing the array of text that is displayed when a teleport command is rejected. */
    extScriptComp.getModel().variables.mini_map_no_teleport.length = 0;
    // clear array
    extScriptComp.getModel().variables.mini_map_ping.length = 0;

    const scriptMap = this.context.findGameScriptWithID(AbstractMap.ID_SCRIPT);
    if (!scriptMap) throw new Error('no map world script');

    this.applyCommandCallbackOf(COMMAND.TELEPORT, (data) => {
      if (data.object3DUUID != this.object3D.uuid) return false;

      if (isNaN(scriptMap.getHeightValue(data.position.x, data.position.y))) {
        extScriptComp.getModel().variables.mini_map_no_teleport.push(data);
        this.object3D.setOutdated(true);
      } else {
        const avatarUUID = data.avatarUUID;
        const newPosition = data.position;

        const avatar = this.context.object3D.getObjectByProperty(
          'uuid',
          avatarUUID
        );

        if (!avatar) {
          console.warn('no avatar with UUID', avatarUUID);
        }

        avatar.position.copy(newPosition);
        avatar.setOutdated(true);
      }

      return true;
    });
    this.applyCommandCallbackOf(COMMAND.PING, (data) => {
      if (data.object3DUUID != this.object3D.uuid) return false;

      extScriptComp.getModel().variables.mini_map_ping.push(data);
      this.object3D.setOutdated(true);

      return true;
    });
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.MINI_MAP;
  }
};
