/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const sharedType = require('ud-viz/src/Game/Shared/Shared');
/** @type {sharedType} */
let Shared = null;

const RADIUS_MAP = 20;

//Coordinates Image map path. src  https://commons.wikimedia.org/wiki/File:Lyon_et_ses_arrondissements_map.svg
const topIP = 45.81186;
const bottomIP = 45.70455;
const leftIP = 4.76623;
const rightIP = 4.90291;

module.exports = class Image {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;

    this.imagePlane = null;

    this.mapImg = null;

    this.popupUI = null;
    this.popupMapGPS = null;
  }

  createImagePlane() {
    //image
    if (this.imagePlane && this.imagePlane.parent) {
      this.imagePlane.parent.remove(this.imagePlane);
    }

    const texture = new Shared.THREE.TextureLoader().load(this.conf.path);
    const material = new Shared.THREE.MeshBasicMaterial({ map: texture });
    const geometry = new Shared.THREE.PlaneGeometry(
      this.conf.width,
      this.conf.height,
      32
    );
    this.imagePlane = new Shared.THREE.Mesh(geometry, material);
  }

  init() {
    console.log('init image localscript', this);
    this.go = arguments[0];
    this.gV = arguments[1].getGameView();
    this.createImagePlane();
    const r = this.go.getComponent(Shared.Render.TYPE);
    r.addObject3D(this.imagePlane);

    this.initRaycaster();
  }

  //CreateOrUpdatePopUp
  createPopupGPS() {
    if (this.popupMapGPS) {
      this.popupMapGPS.remove();
    }
    if (!this.conf.GPS_Coord.checked) return;
    const mapImg = document.createElement('img');
    const _this = this;
    mapImg.addEventListener('load', function () {
      const canvas = _this.createCanvasDrawed(mapImg);
      _this.popupMapGPS = document.createElement('img');
      _this.popupMapGPS.src = canvas.toDataURL();
      _this.popupMapGPS.classList.add('popup_ui');

      _this.gV.appendToUI(_this.popupMapGPS);
    });
    mapImg.src = this.conf.map_path;
  }

  displayPopupMapGPS(value, playSound = true) {
    if (value) {
      this.createPopupGPS();
    } else {
      if (this.popupMapGPS) this.popupMapGPS.remove();
    }
    if (!playSound) return;

    const audioComp = this.go.getComponent(Shared.Audio.TYPE);
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

  initRaycaster() {
    const gV = this.gV;
    const go = this.go;
    const _this = this;
    const manager = gV.getInputManager();
    const raycaster = new udviz.THREE.Raycaster();
    manager.addMouseInput(gV.getRootWebGL(), 'mousedown', function (event) {
      if (event.button != 0) return;
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
        _this.displayPopupMapGPS(true);
        go.computeRoot().traverse(function (g) {
          if (g == go) return false;
          const ls = g.fetchLocalScripts();
          if (ls && ls['image']) {
            ls['image'].displayPopupMapGPS(false);
          }
        });
      } else {
        _this.displayPopupMapGPS(false);
      }
    });

    manager.addKeyInput('Escape', 'keyup', function () {
      _this.displayPopupMapGPS(false);
    });
  }

  createCanvasDrawed(img, ratioX = null, ratioY = null) {
    const lat = this.conf.GPS_Coord.Lat || 0;
    const lng = this.conf.GPS_Coord.Lng || 0;

    ratioX = ratioX || (lng - leftIP) / (rightIP - leftIP);
    ratioY = ratioY || 1 - (lat - bottomIP) / (topIP - bottomIP);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
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

    return canvas;
  }

  ratioToCoordinates(ratioX, ratioY) {
    const Lng = leftIP + ratioX * (rightIP - leftIP);
    const Lat = bottomIP + ratioY * (topIP - bottomIP);
    return {
      Lng: Lng,
      Lat: Lat,
    };
  }

  update() {
    const go = arguments[0];
    console.log('update image', go);
    const texture = new Shared.THREE.TextureLoader().load(this.conf.path);
    const material = new Shared.THREE.MeshBasicMaterial({ map: texture });

    this.imagePlane.material = material;

    this.displayPopupMapGPS(this.popupMapGPS != null);
  }
};
