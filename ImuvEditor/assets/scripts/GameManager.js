/** @format */

module.exports = class GameManager {
  constructor(conf) {
    this.conf = conf;
    //go
    this.map = null;
  }

  

  load() {
    const go = arguments[0];
    const gCtx = arguments[1];
    const isServerSide = arguments[2];
    const modules = arguments[3];
    const _this = this;
    return new Promise((resolve, reject) => {
      console.log('GameManager load', arguments);
      _this.map = gCtx.assetsManager.fetchPrefab('flying_campus');
      gCtx.world.addGameObject(_this.map, gCtx, go, function () {
        resolve();
      });
    });
  }

  tick() {
    const go = arguments[0];
    const gCtx = arguments[1];

    //elevation non static object
    const map = this.map;
    const script = map.getScripts()['map'];
    go.traverse(function (g) {
      if (g.isStatic()) return false; //do no stop propagation
      script.updateElevation(g);
    });
  }
};
