import { Game } from '@ud-viz/browser';

export class Visible extends Game.External.ScriptBase {
  init() {
    this.updateVisible();
  }

  updateVisible() {
    this.object3D.visible = this.variables.visible;
  }

  onOutdated() {
    this.updateVisible();
  }
}
