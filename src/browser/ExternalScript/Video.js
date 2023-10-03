import { Game, THREE, Shared } from '@ud-viz/browser';

export class Video extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.video = null;
    this.videoImageContext = null;
    this.videoTexture = null;
  }

  init() {
    const video = document.createElement('video');
    video.src = this.variables.videoPath;
    video.autoplay = true;
    video.muted = true;
    video.load(); // must call after setting/changing source
    video.play();

    const videoImage = document.createElement('canvas');

    videoImage.width = this.variables.size.width;
    videoImage.height = this.variables.size.height;

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
      this.variables.width,
      this.variables.height
    );
    const movieScreen = new THREE.Mesh(movieGeometry, movieMaterial);

    const renderComp = this.object3D.getComponent(
      Shared.Game.Component.Render.TYPE
    );
    renderComp.getController().addObject3D(movieScreen);

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

  static get ID_SCRIPT() {
    return 'video_id_ext_script';
  }
}