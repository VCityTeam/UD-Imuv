const { ScriptBase, ExternalScriptComponent } = require('@ud-viz/game_shared');
const { COMMAND } = require('../constant');

module.exports = class CityMap extends ScriptBase {
  tick() {
    const teleportCmds = [];
    const pingCmds = [];
    const externalScriptCompCityMap = this.object3D.getComponent(
      ExternalScriptComponent.TYPE
    );

    // clear array
    externalScriptCompCityMap.getModel().variables.city_map_ping.length = 0;

    // teleport
    for (let i = this.context.commands.length - 1; i >= 0; i--) {
      const cmd = this.context.commands[i];
      if (
        cmd.type == COMMAND.TELEPORT &&
        cmd.data.object3DUUID == this.object3D.uuid
      ) {
        teleportCmds.push(cmd);
        this.context.commands.splice(i, 1);
      }
    }

    // ping
    for (let i = this.context.commands.length - 1; i >= 0; i--) {
      const cmd = this.context.commands[i];
      if (
        cmd.type == COMMAND.PING &&
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
      externalScriptCompCityMap.getModel().variables.city_map_ping.push(data);
      this.object3D.setOutdated(true);
    });
  }

  static get ID_SCRIPT() {
    return 'city_map_id_script';
  }
};
