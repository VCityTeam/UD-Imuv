import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';

export class Visible extends ScriptBase {
  init() {
    this.updateVisible();
  }

  updateVisible() {
    const renderComp = this.object3D.getComponent(RenderComponent.TYPE);

    renderComp.getController().renderData.object3D.visible =
      this.variables.visible;
  }

  onOutdated() {
    this.updateVisible();
  }

  static get ID_SCRIPT() {
    return 'visible_id_ext_script';
  }
}
