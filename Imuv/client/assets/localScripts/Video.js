/** @format */

let Shared = null;

module.exports = class Video {
  constructor(conf, SharedModule) {
    this.conf = conf;

    Shared = SharedModule;

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

    const videoTexture = new Shared.THREE.Texture(videoImage);
    videoTexture.minFilter = Shared.THREE.LinearFilter;
    videoTexture.magFilter = Shared.THREE.LinearFilter;

    const movieMaterial = new Shared.THREE.MeshBasicMaterial({
      map: videoTexture,
      side: Shared.THREE.DoubleSide,
    });
    const movieGeometry = new Shared.THREE.PlaneGeometry(
      this.conf.width,
      this.conf.height
    );
    const movieScreen = new Shared.THREE.Mesh(movieGeometry, movieMaterial);

    const r = go.getComponent(Shared.Render.TYPE);
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
