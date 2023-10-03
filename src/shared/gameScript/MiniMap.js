const { Game } = require('@ud-viz/shared');
const Constant = require('../Constant');
const AbstractMap = require('@ud-viz/shared/src/Game/ScriptTemplate/AbstractMap');

module.exports = class MiniMap extends Game.ScriptBase {
  onCommand(type, data) {
    const extScriptComp = this.object3D.getComponent(
      Game.Component.ExternalScript.TYPE
    );

    /* Clearing the array of text that is displayed when a teleport command is rejected. */
    extScriptComp.getModel().getVariables().mini_map_no_teleport.length = 0;
    // clear array
    extScriptComp.getModel().getVariables().mini_map_ping.length = 0;

    const scriptMap = this.context.findGameScriptWithID(AbstractMap.ID_SCRIPT);
    if (!scriptMap) throw new Error('no map world script');

    switch (type) {
      case Constant.COMMAND.TELEPORT:
        if (isNaN(scriptMap.getHeightValue(data.position.x, data.position.y))) {
          extScriptComp
            .getModel()
            .getVariables()
            .mini_map_no_teleport.push(data);
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
        break;
      case Constant.COMMAND.PING:
        extScriptComp.getModel().getVariables().mini_map_ping.push(data);
        this.object3D.setOutdated(true);
        break;
    }
  }

  static get ID_SCRIPT() {
    return 'mini_map_id_script';
  }
};
