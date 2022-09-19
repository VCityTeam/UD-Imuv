/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class CityMap {
  constructor(conf, GameModule) {
    this.conf = conf;

    Game = GameModule;
  }

  tick() {
    const gameObject = arguments[0];
    const worldContext = arguments[1];
    const cmds = worldContext.getCommands();
    const teleportCmds = [];
    const pingCmds = [];
    const lsCityMap = gameObject.getComponent(Game.LocalScript.TYPE);

    //clear array
    lsCityMap.conf.city_map_ping.length = 0;

    //teleport
    for (let i = cmds.length - 1; i >= 0; i--) {
      const cmd = cmds[i];
      if (
        cmd.getGameObjectUUID() == gameObject.getUUID() &&
        cmd.getType() == Game.Command.TYPE.TELEPORT
      ) {
        teleportCmds.push(cmd);
        cmds.splice(i, 1);
      }
    }

    //ping
    for (let i = cmds.length - 1; i >= 0; i--) {
      const cmd = cmds[i];
      if (
        cmd.getGameObjectUUID() == gameObject.getUUID() &&
        cmd.getType() == Game.Command.TYPE.PING_MINI_MAP
      ) {
        pingCmds.push(cmd);
        cmds.splice(i, 1);
      }
    }

    teleportCmds.forEach((tpCmd) => {
      const data = tpCmd.getData();
      const cityAvatarGO = gameObject.computeRoot().find(data.cityAvatarUUID);
      const oldPos = cityAvatarGO.getPosition();
      cityAvatarGO.setPosition(
        new Game.THREE.Vector3(data.position.x, data.position.y, oldPos.z)
      );
    });

    pingCmds.forEach(function (pingCmd) {
      const data = pingCmd.getData();
      lsCityMap.conf.city_map_ping.push(data);
      gameObject.setOutdated(true);
    });
  }
};
