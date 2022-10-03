const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

const INIT_CONF = {
  factorHeight: 3,
  factorWidth: 3,
  iframe_src: null,
};

const DEFAULT_IMG_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/3/31/White_paper.jpg';

module.exports = class Whiteboard {
  constructor(conf, udvizBundle) {
    console.log('Whiteboard constructor');
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;

    this.imagePlane = null;
    this.mapImg = null;

    this.conf = Object.assign(this.conf, INIT_CONF);
  }

  init() {
    this.go = arguments[0];
    this.gV = arguments[1].getGameView();
    if (!this.go) return;

    this.wboPort = 5001;
    this.conf.iframe_src =
      window.location.protocol +
      '//' +
      window.location.hostname +
      ':' +
      this.wboPort +
      '/boards/' +
      this.go.uuid;

    this.drawOnWhiteboard();
    this.getImageFromWhitebophir();
  }

  drawOnWhiteboard(url = DEFAULT_IMG_SRC) {
    //image
    if (this.imagePlane && this.imagePlane.parent) {
      this.imagePlane.parent.remove(this.imagePlane);
    }

    const onLoad = function (texture) {
      const image = texture.image;
      const ratio = image.width / image.height;
      const material = new Game.THREE.MeshBasicMaterial({ map: texture });
      const geometry = new Game.THREE.PlaneGeometry(
        ratio > 1 ? this.conf.factorWidth : this.conf.factorWidth * ratio,
        ratio < 1 ? this.conf.factorHeight : this.conf.factorHeight / ratio,
        32
      );
      this.imagePlane = new Game.THREE.Mesh(geometry, material);
      const r = this.go.getComponent(Game.Render.TYPE);
      r.addObject3D(this.imagePlane);
    };

    this.texture = new Game.THREE.TextureLoader().load(url, onLoad.bind(this));
  }

  getImageFromWhitebophir() {
    /* Creating an iframe element and setting its source to the url of the whiteboard. */
    const tempIframe = document.createElement('iframe');
    tempIframe.style.display = 'none';
    tempIframe.sandbox = 'allow-scripts allow-same-origin';
    this.gV.appendToUI(tempIframe);
    tempIframe.onload = function (event) {
      console.log(tempIframe.contentWindow.document);
    };
    tempIframe.src = this.conf.iframe_src;
  }

  onOutdated() {}

  tick() {}
};
