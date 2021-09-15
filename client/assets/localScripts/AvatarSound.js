/** @format */

let udviz = null;

module.exports = class AvatarSound {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.epicSound = null;
  }

  init() {
    const go = arguments[0];

    this.epicSound = go.getComponent(udviz.Game.Shared.Audio.TYPE).getSounds()[
      'epic'
    ];
    this.epicSound.play();
  }

  tick() {
    const go = arguments[0];
    if (go.isOutdated()) {
      if (!this.epicSound.playing()) this.epicSound.play();
    } else {
      // this.epicSound.pause();
    }
  }

  update() {}
};
