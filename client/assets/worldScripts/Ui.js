/** @format */

const sharedType = require('ud-viz/src/Game/Shared/Shared');
/** @type {sharedType} */
let Shared = null;

module.exports = class Ui {
  constructor(conf, SharedModule) {
    this.conf = conf;

    Shared = SharedModule;
  }

  tick() {
    const worldContext = arguments[1];
    const dt = worldContext.getDt();
    const go = arguments[0];

    const localScript = go.getComponent(Shared.LocalScript.TYPE);
    localScript.conf.world_computer_dt = dt;
    go.setOutdated(true);
  }
};
