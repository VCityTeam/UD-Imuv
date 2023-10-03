// TODO do not use this component but use instaed the camera manager of ud-viz

export class Routine {
  constructor(tick, onEnd) {
    this.tick = tick;
    this.onEnd = onEnd;
  }
}
