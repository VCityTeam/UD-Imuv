/** @format */
import { THREE, OrbitControls, Game } from 'ud-viz';

import { HeightMapView } from './Heightmap/HeightmapView';
import { BodyView } from './Body/BodyView';
import { JSONEditorView } from '../Components/JSONEditor/JSONEditor';

import './GOEditor.css';
import '../Editor.css';
import { GOEditorModel } from './GOEditorModel';

export class GOEditorView {
  constructor(config, assetsManager) {
    this.config = config;

    //where ui is append
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_GOEditorView');

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_GOEditorView');
    this.rootHtml.appendChild(this.ui);

    //where to render
    const canvas = document.createElement('canvas');
    canvas.classList.add('canvas_GOEditorView');
    this.canvas = canvas;
    this.rootHtml.appendChild(canvas);

    //to access 3D model
    this.assetsManager = assetsManager;

    //model
    this.model = new GOEditorModel(assetsManager);

    this.pause = false;

    //THREE

    //camera

    this.camera = new THREE.OrthographicCamera(0, 0, 0, 0, -3000, 3000);
    this.camera.up.set(0, 0, 1);

    //renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
    //clear color
    this.renderer.setClearColor(0x6699cc, 1);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    //controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    //other view
    this.heightMapView = null;
    this.bodyView = null;

    //json view
    this.jsonEditorView = new JSONEditorView(this);

    //html
    this.input = null;
    this.opacitySlider = null;
    this.checkboxGizmo = null;
    this.saveGOButton = null;
  }

  setPause(value) {
    this.pause = value;
  }

  enableControls(value) {
    this.controls.enabled = value;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  html() {
    return this.rootHtml;
  }

  focusGameObject() {
    const bbox = this.model.getBoundingBox();

    //set target
    const center = bbox.max.clone().lerp(bbox.min, 0.5);
    this.controls.target = center.clone();
    const cameraPos = new THREE.Vector3(center.x, center.y, bbox.max.z);
    this.camera.position.copy(cameraPos);

    this.updateCamera();
  }

  tick() {
    requestAnimationFrame(this.tick.bind(this));

    if (this.pause || !this.model) return;
    this.controls.update();
    this.renderer.render(this.model.getScene(), this.camera);
  }

  onResize() {
    const w = this.rootHtml.clientWidth - this.ui.clientWidth;
    const h = this.rootHtml.clientHeight - this.rootHtml.offsetTop;
    this.renderer.setSize(w, h);
    this.updateCamera();
  }

  updateCamera() {
    const bbox = this.model.getBoundingBox();
    if (!bbox) return;
    const w = bbox.max.x - bbox.min.x;
    const h = bbox.max.y - bbox.min.y;
    const max = Math.max(w, h);

    const aspect = this.canvas.width / this.canvas.height;

    this.camera.left = -max;
    this.camera.right = max;
    this.camera.top = max / aspect;
    this.camera.bottom = -max / aspect;

    this.camera.updateProjectionMatrix();
  }

  getModel() {
    return this.model;
  }

  initCallbacks() {
    const _this = this;

    window.addEventListener('resize', this.onResize.bind(this));

    //input
    this.input.addEventListener(
      'change',
      this.readSingleFile.bind(this),
      false
    );

    //checkbox
    this.checkboxGizmo.oninput = function (event) {
      if (!_this.model) return;
      const value = event.target.checked;
      _this.model.setGizmoVisibility(value);
    };

    //slider
    this.opacitySlider.oninput = function (event) {
      if (!_this.model) return;

      const ratio = parseFloat(event.target.value) / 100;
      const o = _this.model.getGameObject().getObject3D();
      if (!o) return;
      o.traverse(function (child) {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = ratio;
        }
      });
    };

    this.saveGOButton.onclick = function () {
      if (_this.model && _this.model.getGameObject()) {
        const go = _this.model.getGameObject();
        const goJSON = go.toJSON(true); //TODO remove true by changing the default value
      }
    };
  }

  initUI() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    this.ui.appendChild(input);
    this.input = input; //ref

    const saveGOButton = document.createElement('div');
    saveGOButton.classList.add('button_Editor');
    saveGOButton.innerHTML = 'Save';
    this.ui.appendChild(saveGOButton);
    this.saveGOButton = saveGOButton;

    //opacity object slider label
    const labelOpacity = document.createElement('div');
    labelOpacity.innerHTML = 'GameObject opacity';
    this.ui.appendChild(labelOpacity);

    //opacity of the gameobject
    const opacitySlider = document.createElement('input');
    opacitySlider.setAttribute('type', 'range');
    opacitySlider.value = '100';
    this.ui.appendChild(opacitySlider);
    this.opacitySlider = opacitySlider; //ref

    //label checkbox
    const labelCheckboxGizmo = document.createElement('div');
    labelCheckboxGizmo.innerHTML = 'Gizmo Visibility';
    this.ui.appendChild(labelCheckboxGizmo);

    //checkbox
    const checkboxGizmo = document.createElement('input');
    checkboxGizmo.setAttribute('type', 'checkbox');
    this.ui.appendChild(checkboxGizmo);
    this.checkboxGizmo = checkboxGizmo;
  }

  onGameObjectJSON(json) {
    const gameobject = new Game.Shared.GameObject(json);
    gameobject.initAssets(this.assetsManager, Game.Shared);
    this.model.initScene();
    this.model.setGameObject(gameobject);
    this.focusGameObject();
    this.updateUI();
    this.onResize();
  }

  updateUI() {
    this.opacitySlider.oninput({ target: this.opacitySlider }); //force update opacity
    this.checkboxGizmo.oninput({ target: this.checkboxGizmo });
  }

  readSingleFile(e) {
    try {
      var file = e.target.files[0];
      if (!file) {
        return;
      }
      const _this = this;
      var reader = new FileReader();
      reader.onload = function (e) {
        const json = JSON.parse(e.target.result);
        console.log('PREFAB = ', json);
        _this.onGameObjectJSON(json);
      };

      reader.readAsText(file);
    } catch (e) {
      throw new Error(e);
    }
  }

  load() {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.initUI();

      //start tick
      _this.tick();

      _this.initCallbacks();

      resolve();
    });
  }
}
