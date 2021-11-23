/** @format */

let Shared;

module.exports = class WorldGameManager {
  constructor(conf, SharedBundle) {
    this.conf = conf;

    Shared = SharedBundle;

    //go
    this.map = null;
  }

  getSpawnTransform() {
    if (this.conf.spawnTransform) {
      return this.conf.spawnTransform;
    } else {
      return {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };
    }
  }

  init() {
    const go = arguments[0];
    this.map = go.find(this.conf.mapUUID);
  }

  getMap() {
    return this.map;
  }
};
