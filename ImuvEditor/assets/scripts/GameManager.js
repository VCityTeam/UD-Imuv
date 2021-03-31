/** @format */

module.exports = class GameManager {
  constructor(conf) {
    this.conf = conf;
    //go
    this.map = null;
  }
  init() {
    const go = arguments[0];
    const gCtx = arguments[1];
    const _this = this;

    const map = gCtx.assetsManager.fetchPrefab(this.conf.mapPrefabId);
    gCtx.world.addGameObject(map, gCtx, go, function () {
      _this.map = map; //assign only onload
    });
  }

  tick() {
    const go = arguments[0];
    const gCtx = arguments[1];

    //elevation non static object
    if (this.map) {
      const script = this.map.getScripts()['map'];
      go.traverse(function (g) {
        if (g.isStatic()) return false; //do no stop propagation
        script.updateElevation(g);
      });
    }
  }
};
