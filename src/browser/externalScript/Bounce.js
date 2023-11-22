/* eslint-disable */

import { ScriptBase } from '@ud-viz/game_browser';
import { ID } from '../../shared/constant';

export class Bounce extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);
    this.currentDt = 0;
  }
  tick() {
    const min = this.variables.min || 0.8;
    const max = this.variables.max || 1;

    this.currentDt += this.context.dt;

    const bounce =
      (max - min) * Math.abs(Math.sin(this.currentDt * 0.001)) + min;
    this.object3D.scale.set(bounce, bounce, bounce);
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.BOUNCE;
  }
}
