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
    this.imgMapGPS = null;

    if (!this.conf.GPS_Coord) {
      this.conf.GPS_Coord = {};
    }
  }

  createImagePlane() {
    //image
    if (this.imagePlane && this.imagePlane.parent) {
      this.imagePlane.parent.remove(this.imagePlane);
    }

    const onLoad = function (texture) {
      const image = texture.image;
      const ratio = image.width / image.height;
      const material = new Shared.THREE.MeshBasicMaterial({ map: texture });
      const geometry = new Shared.THREE.PlaneGeometry(
        this.conf.factorWidth * ratio,
        this.conf.factorHeight / ratio,
        32
      );
      this.imagePlane = new Shared.THREE.Mesh(geometry, material);
      const r = this.go.getComponent(Shared.Render.TYPE);
      r.addObject3D(this.imagePlane);
    };

    const texture = new Shared.THREE.TextureLoader().load(
      this.conf.path,
      onLoad.bind(this)
    );
  }

  init() {
    console.log('init image localscript', this);
    this.go = arguments[0];
    this.gV = arguments[1].getGameView();
    this.createImagePlane();

    this.initRaycaster();
  }

  //CreateOrUpdate
  createImgElementMapGPS() {
    if (this.imgMapGPS) {
      this.imgMapGPS.remove();
    }
    if (!this.conf.GPS_Coord.checked) return;
    const mapImg = document.createElement('img');
    const _this = this;
    mapImg.addEventListener('load', function () {
      const figureMap = document.createElement('figure');
      figureMap.classList.add('grid_item--map');

      const canvas = _this.createCanvasDrawed(mapImg);
      _this.imgMapGPS = document.createElement('img');
      _this.imgMapGPS.src = canvas.toDataURL();
      _this.imgMapGPS.classList.add('popup_gps');
      figureMap.appendChild(_this.imgMapGPS);
      _this.popupUI.appendChild(figureMap);
    });
    mapImg.src = this.conf.map_path;
  }

  createPopup() {
    if (this.popupUI) {
      this.popupUI.remove();
      this.popupUI = null;
    }
    this.popupUI = document.createElement('div');
    this.popupUI.classList.add('popup_wrapper');
    this.createImgElementMapGPS();

    const figureImage = document.createElement('figure');
    figureImage.classList.add('grid_item--image');

    const fullscreenImg = document.createElement('img');
    fullscreenImg.classList.add('popup_fullscreen');
    fullscreenImg.src = this.conf.path;
    figureImage.appendChild(fullscreenImg);

    const figureDescr = document.createElement('figure');
    figureDescr.classList.add('grid_item--descr');

    const descriptionText = document.createElement('div');
    descriptionText.classList.add('popup_descr');
    descriptionText.innerHTML =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam sollicitudin posuere massa ut bibendum. Etiam nunc massa, eleifend in elit eget, hendrerit auctor quam. Vestibulum luctus nulla a orci viverra placerat. Duis tincidunt rhoncus ante. Donec bibendum neque eget mollis pretium. In efficitur et sem non bibendum. Quisque ac euismod nibh. Aliquam mattis, urna sed pharetra lobortis, tellus elit efficitur mauris, sit amet interdum ex lorem tempus massa. Sed porta, mi at efficitur dictum, nulla felis interdum ante, quis rhoncus ex quam eget lectus. Sed interdum neque at iaculis molestie. Sed sodales, diam ac scelerisque ultrices, quam turpis tristique dui, sit amet placerat ante felis nec nisl. Curabitur lacinia in tortor sit amet imperdiet. Curabitur laoreet quam ac erat pulvinar, sed pulvinar lacus maximus. Pellentesque et tortor et felis dapibus tempus. Curabitur feugiat leo ut velit pharetra, nec posuere libero bibendum. In dapibus velit vitae dapibus mollis. ';
    figureDescr.appendChild(descriptionText);

    const figureClose = document.createElement('figure');
    figureClose.classList.add('grid_item--close');

    const closeButton = document.createElement('button');
    closeButton.classList.add('popup_close_button');
    closeButton.innerHTML = 'Close';
    figureClose.appendChild(closeButton);
    closeButton.onclick = this.displayPopup.bind(this, false);

    this.popupUI.appendChild(figureImage);
    this.popupUI.appendChild(figureDescr);
    this.popupUI.appendChild(figureClose);
    this.gV.appendToUI(this.popupUI);
  }

  displayPopup(value, playSound = true) {
    if (value) {
      this.createPopup();
    } else {
      if (this.popupUI) this.popupUI.remove();
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
    manager.addMouseInput(gV.getRootWebGL(), 'dblclick', function (event) {
      if (gV.constructor.name != 'GameView') return;
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
        _this.displayPopup(true);
        go.computeRoot().traverse(function (g) {
          if (g == go) return false;
          const ls = g.fetchLocalScripts();
          if (ls && ls['image']) {
            ls['image'].displayPopup(false);
          }
        });
      } else {
        _this.displayPopup(false);
      }
    });

    manager.addKeyInput('Escape', 'keyup', function () {
      _this.displayPopup(false);
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
    this.createImagePlane();

    this.displayPopup(this.imgMapGPS != null);
  }
};
