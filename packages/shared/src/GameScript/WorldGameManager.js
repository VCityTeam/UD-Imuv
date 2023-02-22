const { Game } = require('@ud-viz/shared');

module.exports = class WorldGameManager extends Game.ScriptBase {
  init() {
    this.map = this.context.object3D.getObjectByProperty(
      'uuid',
      this.variables.mapUUID
    );
  }

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

  getMap() {
    return this.map;
  }
};
