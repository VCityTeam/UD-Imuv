/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class ColliderSender {
  constructor(conf, GameModule) {
    this.conf = conf;

    Game = GameModule;
  }

  init() {
    const go = arguments[0];
    const worldContext = arguments[1];
    const shapesJson = go
      .getComponent(Game.ColliderModule.TYPE)
      .getShapesJSON();

    const lsJitsiArea = go.getComponent(Game.LocalScript.TYPE);
    lsJitsiArea.conf.shapesJson = shapesJson;
    go.setOutdated(true);
  }
};
