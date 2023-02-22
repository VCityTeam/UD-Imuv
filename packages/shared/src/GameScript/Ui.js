const { Game } = require('@ud-viz/shared');

module.exports = class Ui extends Game.ScriptBase {
  tick() {
    const worldContext = arguments[1];
    const dt = worldContext.getDt();
    const go = arguments[0];

    const localScript = go.getComponent(Game.LocalScript.TYPE);
    localScript.conf.world_computer_dt = dt;
    go.setOutdated(true); //TODO should be only outdated in DEBUG
  }
};
