/** @format */

import './MenuAvatar.css';

const GameObject = require('ud-viz/src/Game/Shared/GameObject/GameObject');

import { THREE, OrbitControls } from 'ud-viz';
import { THREEUtils } from 'ud-viz/src/Game/Components/THREEUtils';
import Data from 'ud-viz/src/Game/Shared/Components/Data';
import { Shared } from 'ud-viz/src/Game/Shared/Shared';
import RenderModule from 'ud-viz/src/Game/Shared/GameObject/Components/Render';

export class MenuAvatarView {
  constructor(webSocketService, config, assetsManager) {
    this.config = config;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_MenuAvatar');

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_MenuAvatar');
    this.rootHtml.appendChild(this.ui);

    //where to render
    const canvas = document.createElement('canvas');
    canvas.classList.add('canvas_MenuAvatar');
    this.canvas = canvas;
    this.rootHtml.appendChild(canvas);

    //html
    this.inputNameUser = null;
    this.saveButton = null;

    //manager
    this.assetsManager = assetsManager;

    //service
    this.webSocketService = webSocketService;

    //renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    THREEUtils.initRenderer(
      this.renderer,
      new THREE.Color(0.4, 0.6, 0.8),
      true
    );

    //camera
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
    this.camera.up.set(0, 0, 1);

    //controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    //scene
    this.scene = new THREE.Scene();

    //avatar go
    this.avatarGO = null;

    this.init();
  }

  focusGameObject() {
    const obj = this.avatarGO.fetchObject3D();

    const bbox = new THREE.Box3().setFromObject(obj);
    if (!bbox) return;

    //set target
    const center = bbox.max.clone().lerp(bbox.min, 0.5);
    this.controls.target = center.clone();

    const p = new THREE.Vector3(
      1.0145610218904488,
      -1.6820840951413623,
      1.9057700262812416
    );

    const rot = new THREE.Euler(
      1.0403166821823782,
      0.47972544795032884,
      0.26438188967348636
    );

    this.camera.position.copy(p);
    this.camera.rotation.copy(rot);

    this.onResize();
  }

  init() {
    const _this = this;

    this.initUI();
    this.initCallbacks();
    THREEUtils.addLights(this.scene);

    this.webSocketService.emit(Data.WEBSOCKET.MSG_TYPES.QUERY_AVATAR_GO);

    this.webSocketService.on(
      Data.WEBSOCKET.MSG_TYPES.ON_AVATAR_GO,
      function (data) {
        _this.avatarGO = new GameObject(data);
        _this.avatarGO.initAssetsComponents(_this.assetsManager, Shared, false);
        const object = _this.avatarGO.fetchObject3D();
        _this.scene.add(object);
        _this.focusGameObject();
      }
    );

    this.tick();

    window.addEventListener('resize', this.onResize.bind(this));
    setTimeout(this.onResize.bind(this), 100);
  }

  onResize() {
    const w = this.rootHtml.clientWidth - this.ui.clientWidth;
    const h = this.rootHtml.clientHeight - this.rootHtml.offsetTop;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  }

  tick() {
    requestAnimationFrame(this.tick.bind(this));

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  initUI() {
    const labelNameUser = document.createElement('div');
    labelNameUser.innerHTML = "Nom d'utilisateur";
    this.ui.appendChild(labelNameUser);

    this.inputNameUser = document.createElement('input');
    this.inputNameUser.type = 'text';
    this.ui.appendChild(this.inputNameUser);

    this.saveButton = document.createElement('div');
    this.saveButton.classList.add('button_MenuAvatar');
    this.saveButton.innerHTML = 'Save';
    this.ui.appendChild(this.saveButton);
  }

  dispose() {
    this.rootHtml.remove();
  }

  initCallbacks() {
    const _this = this;

    this.inputNameUser.onchange = function () {
      const r = _this.avatarGO.getComponent(RenderModule.TYPE);
      if (!r) throw new Error('no render component');
      _this.scene.remove(_this.avatarGO.fetchObject3D());
      r.setName(this.value, _this.assetsManager);
      _this.scene.add(_this.avatarGO.fetchObject3D());
    };

    this.saveButton.onclick = function () {
      const avatarJSON = _this.avatarGO.toJSON(true);
      _this.webSocketService.emit(
        Data.WEBSOCKET.MSG_TYPES.SAVE_AVATAR_GO,
        avatarJSON
      );
    };
  }

  html() {
    return this.rootHtml;
  }
}
