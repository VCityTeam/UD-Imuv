const { ScriptBase, ExternalScriptComponent } = require('@ud-viz/game_shared');
const { ID } = require('../constant');

module.exports = class UI extends ScriptBase {
  tick() {
    const externalScriptComp = this.object3D.getComponent(
      ExternalScriptComponent.TYPE
    );

    // change variables of an external script
    externalScriptComp.getModel().variables.gameContextDt = this.context.dt;
    this.object3D.setOutdated(true); // notify external onOutdated event
  }

  static get ID_SCRIPT() {
    return ID.GAME_SCRIPT.UI;
  }
};
