/** @format */

let Shared = null;
let udviz = null;

module.exports = class Image {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;

    this.plane = null;
    this.popupPlane = null;
  }

  init() {
    const gV = arguments[1].getGameView();

    if (this.plane && this.plane.parent) {
      this.plane.parent.remove(this.plane);
    }

    const go = arguments[0];
    const texture = new Shared.THREE.TextureLoader().load(this.conf.path);
    const material = new Shared.THREE.MeshBasicMaterial({ map: texture });
    const geometry = new Shared.THREE.PlaneGeometry(
      this.conf.width,
      this.conf.height,
      32
    );
    this.plane = new Shared.THREE.Mesh(geometry, material);
    const r = go.getComponent(Shared.Render.TYPE);
    r.addObject3D(this.plane);

    const manager = gV.getInputManager();
    const raycaster = new udviz.THREE.Raycaster();
    const _this = this;
    //TODO trigger an event onRemove for localscript
    manager.addMouseInput(gV.getRootWebGL(), 'mousedown', function (event) {
      const mouse = new udviz.THREE.Vector2(
        -1 +
          (2 * event.offsetX) /
            (gV.getRootWebGL().clientWidth -
              parseInt(gV.getRootWebGL().offsetLeft)),
        1 -
          (2 * event.offsetY) /
            (gV.getRootWebGL().clientHeight -
              parseInt(gV.getRootWebGL().offsetTop))
      );

      raycaster.setFromCamera(mouse, gV.itownsView.camera.camera3D);

      const i = raycaster.intersectObject(_this.plane);

      if (i.length) {
        //image clicked
        _this.displayPopup(true);
      }
    });

    //init popup
    const mapLyon = new Shared.THREE.TextureLoader().load(this.conf.map_path);
  }

  displayPopup(value) {}

  update() {
    const go = arguments[0];
    const texture = new Shared.THREE.TextureLoader().load(this.conf.path);
    const material = new Shared.THREE.MeshBasicMaterial({ map: texture });
    this.plane.material = material;
  }
};
