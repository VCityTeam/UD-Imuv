/** @format */

let udviz = null;

module.exports = class AvatarSound {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.walkSound = null;
    this.oldPosition = new udviz.THREE.Vector3();
  }

  isMoving(go) {
    const currentPosition = go.getPosition();
    const epsilon = 0.0001;
    let result = true;
    if (currentPosition.distanceTo(this.oldPosition) < epsilon) {
      result = false;
    }
    this.oldPosition.copy(currentPosition);
    return result;
  }

  init() {
    const go = arguments[0];

    this.walkSound = go.getComponent(udviz.Game.Shared.Audio.TYPE).getSounds()[
      'walk'
    ];
    this.walkSound.play();
  }

  tick() {
    const go = arguments[0];
    if (this.isMoving(go)) {
      if (!this.walkSound.playing()) this.walkSound.play();
    } else {
      this.walkSound.pause();
    }
  }

  update() {}
};
