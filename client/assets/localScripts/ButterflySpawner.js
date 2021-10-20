/** @format */

let udviz = null;
let Shared = null;

module.exports = class ButterflySpawner {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
  }

  init() {
    const localCtx = arguments[1];
  }

  tick() {}
};
