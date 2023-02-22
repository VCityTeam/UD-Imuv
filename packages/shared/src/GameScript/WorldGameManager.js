const { Game } = require('@ud-viz/shared');

module.exports = class WorldGameManager extends Game.ScriptBase {
  init() {
    this.map = this.context.object3D.getObjectByProperty(
      'uuid',
      this.variables.mapUUID
    );
  }

  getSpawnTransform() {
    if (this.variables.spawnTransform) {
      return this.variables.spawnTransform;
    } else {
      return {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };
    }
  }

  getMap() {
    return this.map;
  }
};
