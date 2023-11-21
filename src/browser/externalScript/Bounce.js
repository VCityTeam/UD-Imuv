/* eslint-disable */

import { ScriptBase } from '@ud-viz/game_browser';
import { ID } from '../../shared/constant';

export class Bounce extends ScriptBase {
  tick() {
    const min = 0.8;
    const bounce =
      (1 - min) * Math.abs(Math.sin(this.context.dt * 0.001)) + min;

    this.object3D.scale.set(bounce, bounce, bounce);
    this.object3D.updateMatrix(true);
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.BOUNCE;
  }
}
