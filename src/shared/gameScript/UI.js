const { ScriptBase, ExternalScriptComponent } = require('@ud-viz/game_shared');
const { ID } = require('../constant');
const { throttle } = require('@ud-viz/utils_shared');

module.exports = class UI extends ScriptBase {
  init() {
    const externalScriptComp = this.object3D.getComponent(
      ExternalScriptComponent.TYPE
    );
    this.updateContextDt = throttle(() => {
      externalScriptComp.model.variables.gameContextDt = this.context.dt;
      this.object3D.setOutdated(true); // notify external onOutdated event
    }, 3000);
  }

  tick() {
    this.updateContextDt();
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.UI;
  }
};
