const { Game } = require('@ud-viz/shared');

module.exports = class Spawner extends Game.ScriptBase {
  /**
   *
   * @param {Game.Object3D} object
   */
  initiazeSpawnTransform(object) {
    if (this.variables.spawnTransform) {
      object.position.fromArray(this.variables.spawnTransform.position);
      object.rotation.fromArray(this.variables.spawnTransform.rotation);
      object.setOutdated(true);
    }
  }
};
