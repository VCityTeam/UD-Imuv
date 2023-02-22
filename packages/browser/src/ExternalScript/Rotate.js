import { ExternalGame } from '@ud-viz/browser';

export class Rotate extends ExternalGame.ScriptBase {
  tick() {
    let speed = this.variables.speed;
    if (!speed) speed = 0.01;
    this.object3D.rotation.z -= speed * this.context.dt;
  }
}
