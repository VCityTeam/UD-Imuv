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
    const go = arguments[0];
    console.log('init butterfly ', go);
  }

  tick() {
    console.log('tick');
  }

};
