import { ScriptBase } from '@ud-viz/game_browser';

export class Visible extends ScriptBase {
  init() {
    this.updateVisible();
  }

  updateVisible() {
    this.object3D.visible = this.variables.visible;
  }

  onOutdated() {
    this.updateVisible();
  }

  static get ID_SCRIPT() {
    return 'visible_id_ext_script';
  }
}
