/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const sharedType = require('ud-viz/src/Game/Game');
/** @type {sharedType} */
let Game = null;

const RADIUS_MAP = 40;

//HARDCODED
//Coordinates Image map path. src  https://commons.wikimedia.org/wiki/File:Lyon_et_ses_arrondissements_map.svg
const CITY_MAP = {
  PATH: './assets/img/citymap.png',
  TOP: 45.81186,
  BOTTOM: 45.70455,
  LEFT: 4.76623,
  RIGHT: 4.90291,
};

module.exports = class Image {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.imagePlane = null;

    this.mapImg = null;

    this.popupUI = null;
    this.imgMapGPS = null;

    if (!this.conf.gpsCoord) {
      this.conf.gpsCoord = {};
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

    const texture = new Game.THREE.TextureLoader().load(
      this.conf.path,
      onLoad.bind(this)
    );
  }

  init() {
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
    if (!this.conf.gpsCoord.checked) return false;
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
    mapImg.src = CITY_MAP.PATH;
    return true;
  }

  createPopup() {
    if (this.popupUI) {
      this.popupUI.remove();
      this.popupUI = null;
    }
    this.popupUI = document.createElement('div');
    this.popupUI.classList.add('popup_wrapper');

    const figureImage = document.createElement('figure');
    figureImage.classList.add('grid_item--image');

    const fullscreenImg = document.createElement('img');
    fullscreenImg.classList.add('popup_fullscreen');
    fullscreenImg.src = this.conf.path;
    figureImage.appendChild(fullscreenImg);

    const figureDescr = document.createElement('figure');
    figureDescr.classList.add('grid_item--descr');
    if (this.conf.descriptionText) {
      const descriptionText = document.createElement('div');
      descriptionText.classList.add('popup_descr');
      descriptionText.innerHTML = this.conf.descriptionText;
      figureDescr.appendChild(descriptionText);
    } else if (this.conf.descriptionHtml) {
      //load html from distant server
      udviz.jquery.ajax({
        type: 'GET',
        url: this.conf.descriptionHtml,
        datatype: 'html',
        success: (data) => {
          const descriptionHtml = document.createElement('div');
          descriptionHtml.classList.add('popup_descr');
          descriptionHtml.innerHTML = data; //add content here
          figureDescr.appendChild(descriptionHtml);
        },
        error: (e) => {
          console.error(e);
        },
      });
    }

    if (!this.createImgElementMapGPS()) {
      figureDescr.style.gridRowEnd = 10;
    }

    const figureClose = document.createElement('figure');
    figureClose.classList.add('grid_item--close');

    const closeButton = document.createElement('button');
    closeButton.classList.add('popup_close_button');
    closeButton.innerHTML = 'Fermer';
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

    const audioComp = this.go.getComponent(Game.Audio.TYPE);
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
    const lat = this.conf.gpsCoord.lat || 0;
    const lng = this.conf.gpsCoord.lng || 0;

    ratioX = ratioX || (lng - CITY_MAP.LEFT) / (CITY_MAP.RIGHT - CITY_MAP.LEFT);
    ratioY =
      ratioY || 1 - (lat - CITY_MAP.BOTTOM) / (CITY_MAP.TOP - CITY_MAP.BOTTOM);

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
    const lng = CITY_MAP.LEFT + ratioX * (CITY_MAP.RIGHT - CITY_MAP.LEFT);
    const lat = CITY_MAP.BOTTOM + ratioY * (CITY_MAP.TOP - CITY_MAP.BOTTOM);
    return {
      lng: lng,
      lat: lat,
    };
  }

  onOutdated() {
    const go = arguments[0];
    console.log('update image', go);
    this.createImagePlane();

    this.displayPopup(this.imgMapGPS != null);
  }
};
