import { Game } from '@ud-viz/browser';

export class Rotate extends Game.External.ScriptBase {
  tick() {
    let speed = this.variables.speed;
    if (!speed) speed = 0.01;
    this.object3D.rotation.z -= speed * this.context.dt;
    this.object3D.updateMatrix(true);
  }

  static get ID_SCRIPT() {
    return 'rotate_id_ext_script';
  }
}