/** @format */

let udviz = null;

module.exports = class AvatarSound {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
  }

  init() {
    const go = arguments[0];

    const sound = go.getComponent(udviz.Game.Shared.Audio.TYPE).getSound();
    sound.play();
  }

  tick() {
    // // debugger;
    // if (go.isOutdated()) {
    //     debugger
    // } else {
    //   sound.stop();
    // }
  }

  update() {}
};
