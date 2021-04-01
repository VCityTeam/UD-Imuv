/** @format */
import { THREE, OrbitControls, Game, Components } from 'ud-viz';

import { HeightMapView } from './Heightmap/HeightmapView';
import { BodyView } from './Body/BodyView';

import { JSONEditorView } from '../Components/JSONEditor/JSONEditor';

import './GOEditor.css';
import '../Editor.css';
import { GOEditorModel } from './GOEditorModel';
import RenderComponent from 'ud-viz/src/Game/Shared/GameObject/Components/Render';

const LOCAL_STORAGE_FLAG_JSON = 'GOEditor_bufferJSON';

export class GOEditorView {
  constructor(config, assetsManager) {
    this.config = config;

    //where ui is append
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_GOEditor');

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_GOEditor');
    this.rootHtml.appendChild(this.ui);

    //where to render
    const canvas = document.createElement('canvas');
    canvas.classList.add('canvas_GOEditor');
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

    //json view
    this.jsonEditorView = new JSONEditorView(this);

    //html
    this.input = null; //open a new json
    this.opacitySlider = null; //set opacity go material
    this.checkboxGizmo = null; //display or not gizmo
    this.saveGOButton = null; //save the current go as json
    this.focusGOButton = null; //camera focus current go if render comp
    this.newGOButton = null; //reset scene with new go
    this.addHeightmapButton = null; //add heightmap json in current go
    this.addBodyButton = null; //add body json in current go
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
    if (!bbox) return;

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
        Components.SystemUtils.File.downloadObjectAsJson(goJSON, goJSON.name);
      }
    };

    this.focusGOButton.onclick = this.focusGameObject.bind(this);

    this.newGOButton.onclick = function () {
      const emptyGOJSON = {
        uuid: THREE.MathUtils.generateUUID(),
        name: 'My GameObject',
        static: false,
        type: Game.Shared.GameObject.TYPE,
        components: [],
        children: [],
      };
      _this.onOpenNewJSON(emptyGOJSON);
    };

    let hView;
    this.addHeightmapButton.onclick = function () {
      if (hView) return;

      const go = _this.model.getGameObject();

      if (!go) return;

      const r = go.getComponent(RenderComponent.TYPE);

      if (!r) {
        alert('no render component impossible to add heightmap');
        return;
      }

      //add view
      const wrapper = document.createElement('div');

      hView = new HeightMapView(_this);

      const deleteButton = document.createElement('div');
      deleteButton.classList.add('button_Editor');
      deleteButton.innerHTML = 'delete';
      wrapper.appendChild(deleteButton);

      const bindButton = document.createElement('div');
      bindButton.classList.add('button_Editor');
      bindButton.innerHTML = 'bind';
      wrapper.appendChild(bindButton);

      wrapper.appendChild(hView.html());

      _this.jsonEditorView.onJSON(go.toJSON(true));

      _this.ui.appendChild(wrapper);

      deleteButton.onclick = function () {
        wrapper.remove();
        hView.dispose();
        hView = null;
      };

      bindButton.onclick = function () {
        _this.jsonEditorView.onJSON(go.toJSON(true));
      };
    };

    let bView;
    this.addBodyButton.onclick = function () {
      if (bView) return;

      const go = _this.model.getGameObject();

      if (!go) return;

      //add view
      const wrapper = document.createElement('div');

      bView = new BodyView(_this);

      const deleteButton = document.createElement('div');
      deleteButton.classList.add('button_Editor');
      deleteButton.innerHTML = 'delete';
      wrapper.appendChild(deleteButton);

      const bindButton = document.createElement('div');
      bindButton.classList.add('button_Editor');
      bindButton.innerHTML = 'bind';
      wrapper.appendChild(bindButton);

      wrapper.appendChild(bView.html());

      _this.jsonEditorView.onJSON(go.toJSON(true));

      _this.ui.appendChild(wrapper);

      deleteButton.onclick = function () {
        wrapper.remove();
        bView.dispose();
        bView = null;
      };

      bindButton.onclick = function () {
        _this.jsonEditorView.onJSON(go.toJSON(true));
      };
    };

    this.jsonEditorView.on('onchange', this.jsonOnChange.bind(this));
  }

  jsonOnChange() {
    const buffer = this.model.getGameObject();
    const old = localStorage.getItem(LOCAL_STORAGE_FLAG_JSON);
    try {
      const newString = this.jsonEditorView.computeCurrentString();
      localStorage.setItem(LOCAL_STORAGE_FLAG_JSON, newString);
      this.onGameObjectJSON(JSON.parse(newString));
    } catch (e) {
      console.error(e);
      localStorage.setItem(LOCAL_STORAGE_FLAG_JSON, old);
      if (buffer) this.onGameObjectJSON(buffer.toJSON(true));
    }
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

    const focusGOButton = document.createElement('div');
    focusGOButton.classList.add('button_Editor');
    focusGOButton.innerHTML = 'Focus';
    this.ui.appendChild(focusGOButton);
    this.focusGOButton = focusGOButton;

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

    //new go
    const newGOButton = document.createElement('div');
    newGOButton.classList.add('button_Editor');
    newGOButton.innerHTML = 'New';
    this.ui.appendChild(newGOButton);
    this.newGOButton = newGOButton;

    //new heightmap add button
    const addHeightmapButton = document.createElement('div');
    addHeightmapButton.classList.add('button_Editor');
    addHeightmapButton.innerHTML = 'Add Heightmap Script Component';
    this.ui.appendChild(addHeightmapButton);
    this.addHeightmapButton = addHeightmapButton;

    //new body add button
    const addBodyButton = document.createElement('div');
    addBodyButton.classList.add('button_Editor');
    addBodyButton.innerHTML = 'Add Body Component';
    this.ui.appendChild(addBodyButton);
    this.addBodyButton = addBodyButton;

    //jsoneditor
    this.ui.appendChild(this.jsonEditorView.html());
  }

  onGameObjectJSON(json) {
    console.log('onGameObject => ', json);
    const gameobject = new Game.Shared.GameObject(json);
    gameobject.initAssetsComponents(this.assetsManager, Game.Shared);
    this.model.setGameObject(gameobject);
    this.updateUI();
  }

  updateUI() {
    this.opacitySlider.oninput({ target: this.opacitySlider }); //force update opacity
    this.checkboxGizmo.oninput({ target: this.checkboxGizmo });
  }

  onOpenNewJSON(json) {
    // this.onGameObjectJSON(json);

    //json
    this.jsonEditorView.onJSON(json);
    this.jsonOnChange(); //update localstorage

    this.focusGameObject();
    this.onResize();
  }

  //TODO mettre cette function dans udv.Components.SysteUtils.File
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
        _this.onOpenNewJSON(json);
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

      _this.model.initScene();

      const oldJsonString = localStorage.getItem(LOCAL_STORAGE_FLAG_JSON);
      if (oldJsonString != undefined) {
        try {
          _this.onOpenNewJSON(JSON.parse(oldJsonString));
        } catch (e) {
          console.error(e);
        }
      }

      resolve();
    });
  }
}
