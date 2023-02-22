const { Game } = require('@ud-viz/shared');

module.exports = class Box3DTool extends Game.ScriptBase {
  tick() {
    for (let i = this.context.commands.length - 1; i >= 0; i--) {
      const cmd = this.context.commands[i];
      if (
        cmd.getType() == 'update_transform' // POC style
      ) {
        const box = this.context.object3D.getObjectByProperty(
          'uuid',
          cmd.gameObjectUUID
        );
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
