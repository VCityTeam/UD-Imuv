/** @format */
import { THREE, OrbitControls, Game, Components } from 'ud-viz';

import { HeightMapView } from './Heightmap/HeightmapView';
import { ColliderView } from './Collider/ColliderView';

import { JSONEditorView } from '../Components/JSONEditor/JSONEditor';

import './GOEditor.css';
import '../Editor.css';
import { GOEditorModel } from './GOEditorModel';
import RenderComponent from 'ud-viz/src/Game/Shared/GameObject/Components/Render';
import ScriptModule from 'ud-viz/src/Game/Shared/GameObject/Components/Script';
import { THREEUtils } from 'ud-viz/src/Game/Components/THREEUtils';

const LOCAL_STORAGE_FLAG_JSON = 'GOEditor_bufferJSON';
const LOCAL_STORAGE_FLAG_PREFABS = 'GOEditor_bufferPrefabs';

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
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    THREEUtils.initRenderer(this.renderer, new THREE.Color(0.4, 0.6, 0.8));

    //controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    //other view
    this.heightMapView = null;

    //json view
    this.jsonEditorView = new JSONEditorView(this);

    //prefabs
    this.prefabs = {};

    //html
    this.input = null; //open a new prefab json
    this.prefabsList = null; //list prefabs openend
    this.opacitySlider = null; //set opacity go material
    this.checkboxGizmo = null; //display or not gizmo
    this.inputTag = null; //trigger name of meshes
    this.makeVisibleButton = null; //make the triggered meshes visible
    this.makeInvisibleButton = null; //make the triggered meshes invisible
    this.resetVisibility = null; //all meshes are visible
    this.saveGOButton = null; //save the current go as json
    this.focusGOButton = null; //camera focus current go if render comp
    this.newGOButton = null; //reset scene with new go
    this.addHeightmapButton = null; //add heightmap json in current go
    this.addColliderButton = null; //add collider json in current go
    this.addRenderButton = null; //add render json in current go
    this.addScriptButton = null; //add Script json in current go
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
      const o = _this.model.getGameObject().fetchObject3D();
      if (!o) return;
      o.traverse(function (child) {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = ratio;
        }
      });
    };

    const applyVisibility = function (visible) {
      const text = _this.inputTag.value;
      if (_this.model && _this.model.getGameObject()) {
        const object3D = _this.model.getGameObject().fetchObject3D();
        if (!object3D) return;
        object3D.traverse(function (child) {
          const name = child.name.toLowerCase();
          const tag = text.toLowerCase();

          // console.log(name);

          if (name.includes(tag)) child.visible = visible;
        });
      }
    };

    this.makeVisibleButton.onclick = applyVisibility.bind(this, true);
    this.makeInvisibleButton.onclick = applyVisibility.bind(this, false);
    this.resetVisibility.onclick = function () {
      if (_this.model && _this.model.getGameObject()) {
        const object3D = _this.model.getGameObject().fetchObject3D();
        if (!object3D) return;
        object3D.traverse(function (child) {
          child.visible = true;
        });
      }
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
      deleteButton.innerHTML = 'close';
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
        _this.jsonEditorView.onJSON(_this.model.getGameObject().toJSON(true));
      };
    };

    let bView;
    this.addColliderButton.onclick = function () {
      if (bView) return;

      const go = _this.model.getGameObject();

      if (!go) return;

      //add view
      const wrapper = document.createElement('div');

      bView = new ColliderView(_this);

      const deleteButton = document.createElement('div');
      deleteButton.classList.add('button_Editor');
      deleteButton.innerHTML = 'close';
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
        _this.jsonEditorView.onJSON(_this.model.getGameObject().toJSON(true));
      };
    };

    this.addRenderButton.onclick = function () {
      const go = _this.model.getGameObject();

      if (!go) return;

      const r = go.getComponent(RenderComponent.TYPE);

      if (r) return;

      go.setComponent(
        RenderComponent.TYPE,
        new RenderComponent(go, { idModel: 'cube' })
      );

      _this.jsonEditorView.onJSON(go.toJSON(true));
      _this.focusGameObject();
    };

    this.addScriptButton.onclick = function () {
      const go = _this.model.getGameObject();

      if (!go) return;

      const r = go.getComponent(ScriptModule.TYPE);

      if (r) return;

      go.setComponent(ScriptModule.TYPE, new ScriptModule(go, {}));

      _this.jsonEditorView.onJSON(go.toJSON(true));
      // _this.focusGameObject();
    };

    this.jsonEditorView.onChange(this.jsonOnChange.bind(this));
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

    const prefabsList = document.createElement('ul');
    this.ui.appendChild(prefabsList);
    this.prefabsList = prefabsList;

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

    const inputTag = document.createElement('input');
    inputTag.type = 'text';
    this.ui.appendChild(inputTag);
    this.inputTag = inputTag;

    const makeVisibleButton = document.createElement('div');
    makeVisibleButton.classList.add('button_Editor');
    makeVisibleButton.innerHTML = 'Visible';
    this.ui.appendChild(makeVisibleButton);
    this.makeVisibleButton = makeVisibleButton;

    const makeInvisibleButton = document.createElement('div');
    makeInvisibleButton.classList.add('button_Editor');
    makeInvisibleButton.innerHTML = 'Invisible';
    this.ui.appendChild(makeInvisibleButton);
    this.makeInvisibleButton = makeInvisibleButton;

    const resetVisibility = document.createElement('div');
    resetVisibility.classList.add('button_Editor');
    resetVisibility.innerHTML = 'Reset Visibility';
    this.ui.appendChild(resetVisibility);
    this.resetVisibility = resetVisibility;

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

    //new collider add button
    const addColliderButton = document.createElement('div');
    addColliderButton.classList.add('button_Editor');
    addColliderButton.innerHTML = 'Add Collider Component';
    this.ui.appendChild(addColliderButton);
    this.addColliderButton = addColliderButton;

    //add render
    const addRenderButton = document.createElement('div');
    addRenderButton.classList.add('button_Editor');
    addRenderButton.innerHTML = 'Add Render Component';
    this.ui.appendChild(addRenderButton);
    this.addRenderButton = addRenderButton;

    //add Script
    const addScriptButton = document.createElement('div');
    addScriptButton.classList.add('button_Editor');
    addScriptButton.innerHTML = 'Add Script Component';
    this.ui.appendChild(addScriptButton);
    this.addScriptButton = addScriptButton;

    //jsoneditor
    this.ui.appendChild(this.jsonEditorView.html());
  }

  onGameObjectJSON(json) {
    Components.SystemUtils.JSONUtils.parseNumeric(json);
    console.log('onGameObject => ', json);
    const gameobject = new Game.Shared.GameObject(json);
    gameobject.initAssetsComponents(this.assetsManager, Game.Shared);
    this.model.setGameObject(gameobject);
    //TODO notifier hView et bView to updater leur modele
    this.updateUI();
  }

  updateUI() {
    if (this.model.getGameObject()) {
      this.opacitySlider.oninput({ target: this.opacitySlider }); //force update opacity
      this.checkboxGizmo.oninput({ target: this.checkboxGizmo });
    }

    //clean prefabs list and rebuild it
    const list = this.prefabsList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    const _this = this;
    for (let name in this.prefabs) {
      const li = document.createElement('li');
      li.innerHTML = name;
      li.onclick = function () {
        _this.jsonEditorView.onJSON(_this.prefabs[name]);
        _this.focusGameObject();
      };
      list.appendChild(li);
    }
  }

  onOpenNewJSON(json) {
    //json
    this.jsonEditorView.onJSON(json);

    this.focusGameObject();
    this.onResize();
  }

  onOpenNewPrefab(json) {
    this.prefabs[json.name] = json;
    //store localstorage
    localStorage.setItem(LOCAL_STORAGE_FLAG_PREFABS, this.pack(this.prefabs));
    this.updateUI();
  }

  //TODO mettre in component udviz
  pack(jsonArray) {
    const separator = '&';
    let result = '';
    for (let key in jsonArray) {
      result += JSON.stringify(jsonArray[key]);
      result += separator;
    }

    //remove seprator at the end
    if (result.endsWith(separator)) {
      result = result.slice(0, result.length - separator.length);
    }
    return result;
  }

  unpack(string) {
    const separator = '&';
    const prefabs = string.split(separator);
    const result = {};
    prefabs.forEach(function (p) {
      const json = JSON.parse(p);
      result[json.name] = json;
    });

    return result;
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
        _this.onOpenNewPrefab(json);
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

      _this.initFromLocalStorage();

      resolve();
    });
  }

  initFromLocalStorage() {
    const oldJsonString = localStorage.getItem(LOCAL_STORAGE_FLAG_JSON);
    if (oldJsonString != undefined) {
      try {
        this.onOpenNewJSON(JSON.parse(oldJsonString));
      } catch (e) {
        console.error(e);
      }
    }

    const oldPrefabs = localStorage.getItem(LOCAL_STORAGE_FLAG_PREFABS);
    if (oldPrefabs != undefined) {
      try {
        this.prefabs = this.unpack(oldPrefabs);
        this.updateUI();
      } catch (e) {
        console.error(e);
      }
    }
  }
}
