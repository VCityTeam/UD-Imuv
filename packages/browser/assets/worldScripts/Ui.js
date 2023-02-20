/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Ui {
  constructor(conf, GameModule) {
    this.conf = conf;

    Game = GameModule;
  }

  tick() {
    const worldContext = arguments[1];
    const dt = worldContext.getDt();
    const go = arguments[0];

    const localScript = go.getComponent(Game.LocalScript.TYPE);
    localScript.conf.world_computer_dt = dt;
    go.setOutdated(true); //TODO should be only outdated in DEBUG
  }
};
