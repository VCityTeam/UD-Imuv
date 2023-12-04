const { ScriptBase, ExternalScriptComponent } = require('@ud-viz/game_shared');
const { COMMAND, ID } = require('../constant');
const { Vector3, Quaternion } = require('three');

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
      const cityAvatar = this.context.object3D.getObjectByProperty(
        'uuid',
        cityAvatarUUID
      );

      if (!cityAvatar) {
        console.warn('no cityAvatar with UUID', cityAvatarUUID);
      }

      const parentWorldPosition = new Vector3();
      cityAvatar.parent.matrixWorld.decompose(
        parentWorldPosition,
        new Quaternion(),
        new Vector3()
      );

      cityAvatar.position
        .set(data.position[0], data.position[1], cityAvatar.position.z)
        .sub(parentWorldPosition);
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
