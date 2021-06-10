/** @format */

module.exports = class Video {
  constructor(conf) {
    this.conf = conf;

    this.video = null;
    this.videoImageContext = null;
    this.videoTexture = null;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const THREE = localCtx.UDVShared.THREE;

    
    const video = document.createElement('video');
    video.src = localCtx.gameView.assetsManager.fetchVideoPath(this.conf.idVideo);
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

    const videoTexture = new THREE.Texture(videoImage);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const movieMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
    });
    const movieGeometry = new THREE.PlaneGeometry(
      this.conf.width,
      this.conf.height
    );
    const movieScreen = new THREE.Mesh(movieGeometry, movieMaterial);

    const r = go.getComponent(localCtx.UDVShared.Render.TYPE);
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
