import { ScriptBase } from '@ud-viz/game_browser';
import { ID } from '../../shared/constant';

export class Rotate extends ScriptBase {
  tick() {
    let speed = this.variables.speed;
    if (!speed) speed = 0.01;
    this.object3D.rotation.z -= speed * this.context.dt;
    this.object3D.updateMatrix(true);
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.ROTATE;
  }
}
