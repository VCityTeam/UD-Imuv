/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Video {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;

    this.video = null;
    this.videoImageContext = null;
    this.videoTexture = null;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];

    const video = document.createElement('video');
    video.src = localCtx
      .getGameView()
      .getAssetsManager()
      .fetchVideoPath(this.conf.idVideo);
    video.autoplay = true;
    video.muted = true;
    video.load(); // must call after setting/changing source
    video.play();

    const videoImage = document.createElement('canvas');

    videoImage.width = this.conf.size.width;
    videoImage.height = this.conf.size.height;

    const videoImageContext = videoImage.getContext('2d');
    videoImageContext.fillStyle = '#000000';
    videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);

    const videoTexture = new Game.THREE.Texture(videoImage);
    videoTexture.minFilter = Game.THREE.LinearFilter;
    videoTexture.magFilter = Game.THREE.LinearFilter;

    const movieMaterial = new Game.THREE.MeshBasicMaterial({
      map: videoTexture,
      side: Game.THREE.DoubleSide,
    });
    const movieGeometry = new Game.THREE.PlaneGeometry(
      this.conf.width,
      this.conf.height
    );
    const movieScreen = new Game.THREE.Mesh(movieGeometry, movieMaterial);

    const r = go.getComponent(Game.Render.TYPE);
    r.addObject3D(movieScreen);

    this.video = video;
    this.videoImageContext = videoImageContext;
    this.videoTexture = videoTexture;
  }

  tick() {
    if (this.video.ended) this.video.play();
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.videoImageContext.drawImage(this.video, 0, 0);
      if (this.videoTexture) this.videoTexture.needsUpdate = true;
    }
  }
};
