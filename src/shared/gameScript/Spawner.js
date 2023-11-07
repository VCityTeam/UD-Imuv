const { ScriptBase } = require('@ud-viz/game_shared');
const { ID } = require('../constant');

module.exports = class Spawner extends ScriptBase {
  initializeSpawnTransform(object) {
    if (this.variables.spawnTransform) {
      object.position.fromArray(this.variables.spawnTransform.position);
      object.rotation.fromArray(this.variables.spawnTransform.rotation);
      object.setOutdated(true);
      this.context.updateCollisionBuffer();
    }
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.SPAWNER;
  }
};
