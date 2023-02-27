const { Game } = require('@ud-viz/shared');
const Constant = require('../Constant');

module.exports = class CityMap extends Game.ScriptBase {
  tick() {
    const teleportCmds = [];
    const pingCmds = [];
    const externalScriptCompCityMap = this.object3D.getComponent(
      Game.Component.ExternalScript.TYPE
    );

    //clear array
    externalScriptCompCityMap
      .getModel()
      .getVariables().city_map_ping.length = 0;

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

    teleportCmds.forEach((tpCmd) => {
      const data = tpCmd.getData();

      const cityAvatarUUID = data.cityAvatarUUID;
      const newPosition = data.position;

      const cityAvatar = this.context.object3D.getObjectByProperty(
        'uuid',
        cityAvatarUUID
      );

      if (!cityAvatar) {
        console.warn('no cityAvatar with UUID', cityAvatarUUID);
      }

      cityAvatar.position.copy(newPosition);
      cityAvatar.setOutdated(true);
    });

    pingCmds.forEach((pingCmd) => {
      const data = pingCmd.getData();
      externalScriptCompCityMap
        .getModel()
        .getVariables()
        .city_map_ping.push(data);
      this.object3D.setOutdated(true);
    });
  }
};
