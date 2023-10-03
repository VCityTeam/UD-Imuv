import { Game, Shared, THREE } from '@ud-viz/browser';
import jquery from 'jquery';
import { Constant } from '@ud-imuv/shared';

const RADIUS_MAP = 40;

export class Image extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.imagePlane = null;

    this.mapImg = null;

    this.popupUI = null;
    this.imgMapGPS = null;

    if (!this.variables.gpsCoord) {
      this.variables.gpsCoord = {};
    }
  }

  createImagePlane() {
    // image
    if (this.imagePlane && this.imagePlane.parent) {
      this.imagePlane.parent.remove(this.imagePlane);
    }

    const onLoad = (texture) => {
      const image = texture.image;
      const ratio = image.width / image.height;
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const geometry = new THREE.PlaneGeometry(
        ratio > 1
          ? this.variables.factorWidth
          : this.variables.factorWidth * ratio,
        ratio < 1
          ? this.variables.factorHeight
          : this.variables.factorHeight / ratio,
        32
      );
      this.imagePlane = new THREE.Mesh(geometry, material);
      const r = this.object3D.getComponent(Shared.Game.Component.Render.TYPE);
      r.getController().addObject3D(this.imagePlane);
    };

    new THREE.TextureLoader().load(this.variables.path, onLoad);
  }

  init() {
    this.createImagePlane();
    this.initRaycaster();
  }

  // CreateOrUpdate
  createImgElementMapGPS() {
    if (this.imgMapGPS) {
      this.imgMapGPS.remove();
    }
    if (!this.variables.gpsCoord.checked) return false;
    const mapImg = document.createElement('img');

    mapImg.addEventListener('load', () => {
      const figureMap = document.createElement('figure');
      figureMap.classList.add('grid_item--map');

      const canvas = this.createCanvasDrawed(mapImg);
      this.imgMapGPS = document.createElement('img');
      this.imgMapGPS.src = canvas.toDataURL();
      this.imgMapGPS.classList.add('popup_gps');
      figureMap.appendChild(this.imgMapGPS);
      this.popupUI.appendChild(figureMap);
    });

    mapImg.src = Constant.CITY_MAP.PATH;

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
    fullscreenImg.src = this.variables.path;
    figureImage.appendChild(fullscreenImg);

    const figureDescr = document.createElement('figure');
    figureDescr.classList.add('grid_item--descr');
    if (this.variables.descriptionText) {
      const descriptionText = document.createElement('div');
      descriptionText.classList.add('popup_descr');
      descriptionText.innerHTML = this.variables.descriptionText;
      figureDescr.appendChild(descriptionText);
    } else if (this.variables.descriptionHtml) {
      // load html from distant server
      jquery.ajax({
        type: 'GET',
        url: this.variables.descriptionHtml,
        datatype: 'html',
        success: (data) => {
          const descriptionHtml = document.createElement('div');
          descriptionHtml.classList.add('popup_descr');
          descriptionHtml.innerHTML = data; // add content here
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
    closeButton.title = 'Fermer';
    const closeCross = document.createElement('div');
    closeCross.classList.add('mask_icon', 'close_cross');
    closeButton.appendChild(closeCross);

    figureClose.appendChild(closeButton);
    closeButton.onclick = this.displayPopup.bind(this, false);

    this.popupUI.appendChild(figureImage);
    this.popupUI.appendChild(figureDescr);
    this.popupUI.appendChild(figureClose);
    this.context.frame3D.domElement.appendChild(this.popupUI);
  }

  displayPopup(value, playSound = true) {
    if (value) {
      this.createPopup();
    } else {
      if (this.popupUI) this.popupUI.remove();
    }
    if (!playSound || !value) return;

    const audioComp = this.object3D.getComponent(
      Shared.Game.Component.Audio.TYPE
    );
    audioComp.getController().play('open_popup');
  }

  initRaycaster() {
    const raycaster = new THREE.Raycaster();
    this.context.inputManager.addMouseInput(
      this.context.frame3D.domElementWebGL,
      'dblclick',
      (event) => {
        if (event.button != 0) return;
        const mouse = new THREE.Vector2(
          -1 +
            (2 * event.offsetX) /
              (this.context.frame3D.domElementWebGL.clientWidth -
                parseInt(this.context.frame3D.domElementWebGL.offsetLeft)),
          1 -
            (2 * event.offsetY) /
              (this.context.frame3D.domElementWebGL.clientHeight -
                parseInt(this.context.frame3D.domElementWebGL.offsetTop))
        );

        raycaster.setFromCamera(mouse, this.context.frame3D.camera);

        const i = raycaster.intersectObject(this.imagePlane);
        if (i.length) {
          // image clicked
          this.displayPopup(true);

          this.context.object3D.traverse((child) => {
            if (!child.isImage) return;
            const externalCompChild = child.getComponent(
              Shared.Game.Component.ExternalScript.TYPE
            );
            externalCompChild
              .getController()
              .getScripts()
              [Image.ID_SCRIPT].displayPopup(false, false); // do not play sound when close and another one is open
          });
        } else {
          this.displayPopup(false);
        }
      }
    );

    this.context.inputManager.addKeyInput('Escape', 'keyup', () => {
      this.displayPopup(false);
    });
  }

  createCanvasDrawed(img, ratioX = null, ratioY = null) {
    const lat = this.variables.gpsCoord.lat || 0;
    const lng = this.variables.gpsCoord.lng || 0;

    ratioX =
      ratioX ||
      (lng - Constant.CITY_MAP.LEFT) /
        (Constant.CITY_MAP.RIGHT - Constant.CITY_MAP.LEFT);
    ratioY =
      ratioY ||
      1 -
        (lat - Constant.CITY_MAP.BOTTOM) /
          (Constant.CITY_MAP.TOP - Constant.CITY_MAP.BOTTOM);

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
    const lng =
      Constant.CITY_MAP.LEFT +
      ratioX * (Constant.CITY_MAP.RIGHT - Constant.CITY_MAP.LEFT);
    const lat =
      Constant.CITY_MAP.BOTTOM +
      ratioY * (Constant.CITY_MAP.TOP - Constant.CITY_MAP.BOTTOM);
    return {
      lng: lng,
      lat: lat,
    };
  }

  onOutdated() {
    this.createImagePlane();
    this.displayPopup(this.imgMapGPS != null);
  }

  static get ID_SCRIPT() {
    return 'image_id_ext_script';
  }
}
