/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class MiniMap {
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
    const lsMiniMap = gameObject.getComponent(Game.LocalScript.TYPE);

    /* Clearing the array of text that is displayed when a teleport command is rejected. */
    lsMiniMap.conf.mini_map_no_teleport.length = 0;
    //clear array
    lsMiniMap.conf.mini_map_ping.length = 0;

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

    const gmGo = gameObject.computeRoot();
    const scriptGM = gmGo.fetchWorldScripts()['worldGameManager'];
    if (!scriptGM) throw new Error('no gm script');
    const mapGo = scriptGM.getMap();
    if (!mapGo) return; //no map => no commands
    const scriptMap = mapGo.fetchWorldScripts()['map'];
    if (!scriptMap) throw new Error('no map world script');

    const _this = this;
    teleportCmds.forEach((tpCmd) => {
      const data = tpCmd.getData();
      const result = scriptMap.getHeightValue(data.position.x, data.position.y);
      if (isNaN(result)) {
        lsMiniMap.conf.mini_map_no_teleport.push(data);
        gameObject.setOutdated(true);
      } else {
        const avatarUUID = data.avatarUUID;
        const newPosition = data.position;

        const avatar = worldContext.getWorld().getGameObject().find(avatarUUID);

        if (!avatar) {
          console.warn('no avatar with UUID', avatarUUID);
        }

        avatar.setPosition(newPosition);
      }
    });

    pingCmds.forEach(function (pingCmd) {
      const data = pingCmd.getData();
      lsMiniMap.conf.mini_map_ping.push(data);
      gameObject.setOutdated(true);
    });
  }
};
