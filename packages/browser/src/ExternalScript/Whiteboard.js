const DEFAULT_IMG_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/3/31/White_paper.jpg';

export class Whiteboard {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;

    this.imagePlane = null;
    this.mapImg = null;
    this.go = null;
    this.gV = null;
    this.content = null;
    this.texture = null;
  }

  init() {
    this.go = arguments[0];
    this.gV = arguments[1].getGameView();
    if (!this.go) return;

    this.createWhiteboardPlane();
  }

  createWhiteboardPlane(url = DEFAULT_IMG_SRC) {
    //image
    if (this.imagePlane && this.imagePlane.parent) {
      this.imagePlane.parent.remove(this.imagePlane);
    }
    const factorWidth = this.conf.factorWidth || 3;
    const factorHeight = this.conf.factorHeight || 3;

    const onLoad = function (texture) {
      const image = texture.image;
      const ratio = image.width / image.height;
      const material = new Game.THREE.MeshBasicMaterial({ map: texture });
      const geometry = new Game.THREE.PlaneGeometry(
        ratio > 1 ? factorWidth : factorWidth * ratio,
        ratio < 1 ? factorHeight : factorHeight / ratio,
        32
      );
      this.imagePlane = new Game.THREE.Mesh(geometry, material);
      const r = this.go.getComponent(Game.Render.TYPE);
      r.addObject3D(this.imagePlane);
    };

    this.texture = new Game.THREE.TextureLoader().load(url, onLoad.bind(this));
  }

  onClick() {
    const localCtx = arguments[1];

    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    const scriptUI = localCtx.findExternalScriptWithID('ui');
    scriptUI.displayIframe(
      localCtx,
      ImuvConstants.WBO.PUBLIC_URL + '/' + this.go.getUUID()
    );
  }
}
