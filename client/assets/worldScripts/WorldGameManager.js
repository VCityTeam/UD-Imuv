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

  tick() {
    const worldContext = arguments[1];
    const dt = worldContext.getDt();
    const go = arguments[0];

    const localScript = go.getComponent(Shared.LocalScript.TYPE);
    localScript.conf.world_computer_dt = dt;
    go.setOutdated(true);
  }

  getMap() {
    return this.map;
  }
};
