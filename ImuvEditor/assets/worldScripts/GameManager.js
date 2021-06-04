/** @format */

module.exports = class GameManager {
  constructor(conf) {
    this.conf = conf;
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

  load() {
    const _this = this;
    return new Promise((resolve, reject) => {
      const go = arguments[0];
      const gCtx = arguments[1];

      const map = gCtx.assetsManager.fetchPrefab(_this.conf.mapPrefabId);
      gCtx.world.addGameObject(map, gCtx, go, function () {
        _this.map = map;
        resolve();
      });
    });
  }

  getMap() {
    return this.map;
  }
};
