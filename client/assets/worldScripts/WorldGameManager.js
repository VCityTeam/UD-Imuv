/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class WorldGameManager {
  constructor(conf, GameBundle) {
    this.conf = conf;

    Game = GameBundle;

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
