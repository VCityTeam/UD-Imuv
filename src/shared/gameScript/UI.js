const { Game } = require('@ud-viz/shared');

module.exports = class UI extends Game.ScriptBase {
  tick() {
    const externalScriptComp = this.object3D.getComponent(
      Game.Component.ExternalScript.TYPE
    );

    // change variables of an external script
    externalScriptComp.getModel().getVariables().gameContextDt =
      this.context.dt;
    this.object3D.setOutdated(true); // notify external onOutdated event
  }

  static get ID_SCRIPT() {
    return 'ui_id_script';
  }
};
