const { ScriptBase, ExternalScriptComponent } = require('@ud-viz/game_shared');
const { ID } = require('../constant');

module.exports = class UI extends ScriptBase {
  init() {
    this.currentDuration = 0;
  }

  tick() {
    this.currentDuration += this.context.dt;
    if (this.currentDuration > 2000) {
      this.currentDuration = 0;
      const externalScriptComp = this.object3D.getComponent(
        ExternalScriptComponent.TYPE
      );
      externalScriptComp.getModel().variables.gameContextDt = this.context.dt;
      this.object3D.setOutdated(true); // notify external onOutdated event
    }
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.UI;
  }
};
