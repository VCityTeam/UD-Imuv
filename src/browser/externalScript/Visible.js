import { ScriptBase } from '@ud-viz/game_browser';
import { RenderComponent } from '@ud-viz/game_shared';
import { ID } from '../../shared/constant';

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
    return ID.EXTERNAL_SCRIPT.VISIBLE;
  }
}
