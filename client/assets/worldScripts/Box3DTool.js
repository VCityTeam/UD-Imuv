/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Box3DTool {
  constructor(conf, GameModule) {
    this.conf = conf;

    Game = GameModule;
  }

  tick() {
    const gameObject = arguments[0];
    const worldContext = arguments[1];
    const cmds = worldContext.getCommands();
    for (let i = cmds.length - 1; i >= 0; i--) {
      const cmd = cmds[i];
      if (
        cmd.getType() == 'update_transform' // POC style
      ) {
        const box = gameObject.computeRoot().find(cmd.gameObjectUUID);
        box.getObject3D().position.x = cmd.data.position.x;
        box.getObject3D().position.y = cmd.data.position.y;
        box.getObject3D().position.z = cmd.data.position.z;

        box.getObject3D().scale.x = cmd.data.scale.x;
        box.getObject3D().scale.y = cmd.data.scale.y;
        box.getObject3D().scale.z = cmd.data.scale.z;

        box.getObject3D().quaternion.fromArray(cmd.data.quaternion);

        box.setOutdated(true);
      }
    }
  }
};
