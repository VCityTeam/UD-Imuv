const { Game } = require('@ud-viz/shared');
const Constant = require('../Constant');
const AbstractMap = require('@ud-viz/shared/src/Game/ScriptTemplate/AbstractMap');

module.exports = class MiniMap extends Game.ScriptBase {
  tick() {
    const teleportCmds = [];
    const pingCmds = [];
    const lsMiniMap = this.object3D.getComponent(
      Game.Component.ExternalScript.TYPE
    );

    /* Clearing the array of text that is displayed when a teleport command is rejected. */
    lsMiniMap.getModel().getVariables().mini_map_no_teleport.length = 0;
    //clear array
    lsMiniMap.getModel().getVariables().mini_map_ping.length = 0;

    //teleport
    for (let i = this.context.commands.length - 1; i >= 0; i--) {
      const cmd = this.context.commands[i];
      if (
        cmd.type == Constant.COMMAND.TELEPORT &&
        cmd.data.object3DUUID == this.object3D.uuid
      ) {
        teleportCmds.push(cmd);
        this.context.commands.splice(i, 1);
      }
    }

    //ping
    for (let i = this.context.commands.length - 1; i >= 0; i--) {
      const cmd = this.context.commands[i];
      if (
        cmd.type == Constant.COMMAND.PING &&
        cmd.data.object3DUUID == this.object3D.uuid
      ) {
        pingCmds.push(cmd);
        this.context.commands.splice(i, 1);
      }
    }

    const scriptMap = this.context.findGameScriptWithID(AbstractMap.ID_SCRIPT);
    if (!scriptMap) throw new Error('no map world script');

    teleportCmds.forEach((tpCmd) => {
      const data = tpCmd.getData();
      const result = scriptMap.getHeightValue(data.position.x, data.position.y);
      if (isNaN(result)) {
        lsMiniMap.getModel().getVariables().mini_map_no_teleport.push(data);
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
    });

    pingCmds.forEach((pingCmd) => {
      const data = pingCmd.getData();
      lsMiniMap.getModel().getVariables().mini_map_ping.push(data);
      this.object3D.setOutdated(true);
    });
  }
  static get ID_SCRIPT() {
    return 'mini_map_id_script';
  }
};
