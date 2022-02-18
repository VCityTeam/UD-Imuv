/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

const RADIUS_MAP = 20;

module.exports = class Image {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.imagePlane = null;

    this.popupUI = null;
  }

  createImagePlane() {
    //image
    if (this.imagePlane && this.imagePlane.parent) {
      this.imagePlane.parent.remove(this.imagePlane);
    }

    const texture = new Game.THREE.TextureLoader().load(this.conf.path);
    const material = new Game.THREE.MeshBasicMaterial({ map: texture });
    const geometry = new Game.THREE.PlaneGeometry(
      this.conf.width,
      this.conf.height,
      32
    );
    this.imagePlane = new Game.THREE.Mesh(geometry, material);
  }

  init() {
    const go = arguments[0];
    const gV = arguments[1].getGameView();
    const _this = this;

    this.createImagePlane();
    const r = go.getComponent(Game.Render.TYPE);
    r.addObject3D(this.imagePlane);

    //init popup
    const mapImg = document.createElement('img');
    mapImg.src = this.conf.map_path;

    mapImg.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(this, 0, 0);

      const ratioX = _this.conf.popup_position.ratioX;
      const ratioY = _this.conf.popup_position.ratioY;

      ctx.beginPath();
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'red';
      ctx.arc(
        ratioX * canvas.width,
        ratioY * canvas.height,
        RADIUS_MAP,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      _this.popupUI = document.createElement('img');
      _this.popupUI.src = canvas.toDataURL();
      _this.popupUI.classList.add('popup_ui');

      const manager = gV.getInputManager();
      const raycaster = new udviz.THREE.Raycaster();
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

        raycaster.setFromCamera(mouse, gV.getCamera());

        const i = raycaster.intersectObject(_this.imagePlane);

        if (i.length) {
          //image clicked
          _this.displayPopup(true, go, gV);
          go.computeRoot().traverse(function (g) {
            if (g == go) return false;
            const ls = g.fetchLocalScripts();
            if (ls && ls['image']) {
              ls['image'].displayPopup(false, g, gV, false);
            }
          });
        } else {
          _this.displayPopup(false, go, gV);
        }
      });

      manager.addKeyInput('Escape', 'keyup', function () {
        _this.displayPopup(false, go, gV);
      });
    };
  }

  displayPopup(value, go, gV, playSound = true) {
    //if no change nothing
    if (!this.popupUI.parentNode == !value) return;

    if (value) {
      gV.appendToUI(this.popupUI);
    } else {
      this.popupUI.remove();
    }

    if (!playSound) return;

    const audioComp = go.getComponent(Game.Audio.TYPE);
    if (!audioComp) return;

    const sounds = audioComp.getSounds();
    if (!sounds) debugger;
    if (value) {
      //play open sound
      sounds['open_popup'].play();
    } else {
      //play close sound
      sounds['close_popup'].play();
    }
  }

  update() {
    const go = arguments[0];
    const texture = new Game.THREE.TextureLoader().load(this.conf.path);
    const material = new Game.THREE.MeshBasicMaterial({ map: texture });
    this.imagePlane.material = material;
  }
};
