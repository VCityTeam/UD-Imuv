const { ScriptBase, ExternalScriptComponent } = require('@ud-viz/game_shared');
const { COMMAND, ID } = require('../constant');

module.exports = class CityMap extends ScriptBase {
  tick() {
    const externalScriptCompCityMap = this.object3D.getComponent(
      ExternalScriptComponent.TYPE
    );

    // clear array
    externalScriptCompCityMap.getModel().variables.city_map_ping.length = 0;

    this.applyCommandCallbackOf(COMMAND.TELEPORT, (data) => {
      if (data.object3DUUID != this.object3D.uuid) return false;

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

      return true;
    });

    this.applyCommandCallbackOf(COMMAND.PING, (data) => {
      if (data.object3DUUID != this.object3D.uuid) return false;

      externalScriptCompCityMap.getModel().variables.city_map_ping.push(data);
      this.object3D.setOutdated(true);

      return true;
    });
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.CITY_MAP;
  }
};
