/** @format */
import { THREE, OrbitControls, Game, Components } from 'ud-viz';

import { HeightMapView } from './Heightmap/HeightmapView';
import { ColliderView } from './Collider/ColliderView';

import { JSONEditorView } from '../Components/JSONEditor/JSONEditor';

import './GOEditor.css';
import '../Editor.css';
import { GOEditorModel } from './GOEditorModel';
import RenderComponent from 'ud-viz/src/Game/Shared/GameObject/Components/Render';
import ColliderComponent from 'ud-viz/src/Game/Shared/GameObject/Components/Collider';
import WorldScriptModule from 'ud-viz/src/Game/Shared/GameObject/Components/WorldScript';
import JSONUtils from 'ud-viz/src/Components/SystemUtils/JSONUtils';
import { MeshEditorView } from './MeshEditor/MeshEditorView';

import THREEUtils from 'ud-viz/src/Game/Shared/Components/THREEUtils';

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
    THREEUtils.initRenderer(
      this.renderer,
      new THREE.Color(0.4, 0.6, 0.8),
      true
    );

    //controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    //other view
    this.heightMapView = null;

    //json view go
    this.jsonEditorViewGO = new JSONEditorView(this, 'GameObject');

    //prefabs
    this.prefabs = {};

    //html
    this.input = null; //open a new prefab json
    this.prefabsList = null; //list prefabs openend
    this.opacitySlider = null; //set opacity go material
    this.checkboxGizmo = null; //display or not gizmo
    this.switchControls = null; //switch controls
    this.inputTag = null; //trigger name of meshes
    this.saveGOButton = null; //save the current go as json
    this.focusGOButton = null; //camera focus current go if render comp
    this.focusTopGOButton = null; //camera focus current go if render comp
    this.focusBotGOButton = null; //camera focus current go if render comp
    this.focusRightGOButton = null; //camera focus current go if render comp
    this.focusLeftGOButton = null; //camera focus current go if render comp
    this.focusBackButton = null; //camera focus current go if render comp
    this.focusForwardGOButton = null; //camera focus current go if render comp
    this.newGOButton = null; //reset scene with new go
    this.addHeightmapButton = null; //add heightmap json in current go
    this.addColliderButton = null; //add collider json in current go
    this.addRenderButton = null; //add render json in current go
    this.addScriptButton = null; //add Script json in current go
    this.generateUUIDButton = null; //regenerate all uuid in the go
    this.editMeshesButton = null; //edit Meshes Selected

    //offset
    this.selectStep = null;
    this.minusXOffset = null;
    this.plusXOffset = null;
    this.minusYOffset = null;
    this.plusYOffset = null;
    this.minusZOffset = null;
    this.plusZOffset = null;
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
    this.alignViewToAxis(new THREE.Vector3(0, 0, 1));
  }

  alignViewToAxis(axis) {
    const bbox = this.model.getBoundingBox();
    if (!bbox) return;

    //set target
    const center = bbox.max.clone().lerp(bbox.min, 0.5);
    this.controls.target = center.clone();

    const vectorOne = new THREE.Vector3(1, 1, 1);
    const cameraPos = axis
      .clone()
      .multiply(bbox.max.clone())
      .add(vectorOne.sub(axis.clone()).multiply(center.clone()));
    this.camera.position.copy(cameraPos);

    this.updateCamera();
  }

  tick() {
    requestAnimationFrame(this.tick.bind(this));

    if (this.pause || !this.model) return;

    if (this.controls.update) this.controls.update();

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
      function (e) {
        Components.SystemUtils.File.readSingleFile(e, function (e) {
          const json = JSON.parse(e.target.result);
          console.log('PREFAB = ', json);
          _this.onOpenNewPrefab(json);
        });
      },
      false
    );

    this.switchControls.onclick = function () {
      _this.controls.dispose();
      if (_this.controls instanceof OrbitControls) {
        // console.log('PointerLockControls');
        // _this.renderer.domElement.requestPointerLock();
        // _this.controls = new PointerLockControls(
        //   _this.camera,
        //   _this.renderer.domElement
        // );
      } else {
        console.log('OrbitControls');
        _this.controls = new OrbitControls(
          _this.camera,
          _this.renderer.domElement
        );
      }
    };

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
      const o = _this.model.getGameObject().computeObject3D();
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
        const object3D = _this.model.getGameObject().computeObject3D();
        if (!object3D) return;
        const tag = text.toLowerCase();
        object3D.traverse(function (child) {
          const name = child.name.toLowerCase();

          child.visible = !visible;
          if (name.includes(tag)) {
            child.visible = visible;
            while (child.parent) {
              child.parent.visible = visible;
              child = child.parent;
            }
            while (child.child) {
              child.child.visible = visible;
              child = child.child;
            }
          }
        });
      }
    };

    this.inputTag.onchange = applyVisibility.bind(this, true);

    this.saveGOButton.onclick = function () {
      if (_this.model && _this.model.getGameObject()) {
        const go = _this.model.getGameObject();
        const goJSON = go.toJSON(true);
        Components.SystemUtils.File.downloadObjectAsJson(goJSON, goJSON.name);
      }
    };

    this.focusGOButton.onclick = this.focusGameObject.bind(this);

    this.focusTopGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(0, 0, 1)
    );
    this.focusBotGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(0, 0, -1)
    );
    this.focusRightGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(-1, 0, 0)
    );
    this.focusLeftGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(1, 0, 0)
    );
    this.focusBackGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(0, -1, 0)
    );
    this.focusForwardGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(0, 1, 0)
    );

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

      _this.jsonEditorViewGO.onJSON(go.toJSON(true));

      _this.ui.appendChild(wrapper);

      deleteButton.onclick = function () {
        wrapper.remove();
        hView.dispose();
        hView = null;
      };

      bindButton.onclick = function () {
        _this.jsonEditorViewGO.onJSON(_this.model.getGameObject().toJSON(true));
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

      _this.jsonEditorViewGO.onJSON(go.toJSON(true));

      _this.ui.appendChild(wrapper);

      deleteButton.onclick = function () {
        wrapper.remove();
        bView.dispose();
        bView = null;
      };

      bindButton.onclick = function () {
        _this.jsonEditorViewGO.onJSON(_this.model.getGameObject().toJSON(true));
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

      _this.jsonEditorViewGO.onJSON(go.toJSON(true));
      _this.focusGameObject();
    };

    this.addScriptButton.onclick = function () {
      const go = _this.model.getGameObject();

      if (!go) return;

      const r = go.getComponent(WorldScriptModule.TYPE);

      if (r) return;

      go.setComponent(WorldScriptModule.TYPE, new WorldScriptModule(go, {}));

      _this.jsonEditorViewGO.onJSON(go.toJSON(true));
      // _this.focusGameObject();
    };

    this.generateUUIDButton.onclick = function () {
      const go = _this.model.getGameObject();

      if (!go) return;
      const json = go.toJSON(true);
      JSONUtils.parse(json, function (j, key) {
        if (key == 'uuid') {
          j[key] = THREE.MathUtils.generateUUID();
        }
      });
      _this.jsonEditorViewGO.onJSON(json);
    };

    let mView;
    this.editMeshesButton.onclick = function () {
      if (mView) return;
      //add view
      const wrapper = document.createElement('div');
      mView = new MeshEditorView(_this);
      const deleteButton = document.createElement('div');
      deleteButton.classList.add('button_Editor');
      deleteButton.innerHTML = 'close';

      wrapper.appendChild(deleteButton);
      wrapper.appendChild(mView.html());

      _this.ui.appendChild(wrapper);

      deleteButton.onclick = function () {
        wrapper.remove();
        mView.dispose();
        mView = null;
      };
    };

    this.jsonEditorViewGO.onChange(this.jsonOnChange.bind(this));

    //offset
    const offsetGO = function (offset) {
      const go = _this.model.getGameObject();
      if (!go) return;

      const children = go.getChildren();
      children.forEach(function (child) {
        child.traverse(function (g) {
          g.getPosition().add(offset);
        });
      });

      const colliderC = go.getComponent(ColliderComponent.TYPE);
      const sJSON = colliderC.getShapesJSON();
      sJSON.forEach(function (shapeJSON) {
        switch (shapeJSON.type) {
          case 'Circle':
            shapeJSON.center.x += offset.x;
            shapeJSON.center.y += offset.y;
            break;
          case 'Polygon':
            shapeJSON.points.forEach(function (p) {
              p.x += offset.x;
              p.y += offset.y;
            });
            break;
          default:
        }
      });

      _this.onGameObjectJSON(go.toJSON(true));
    };

    //on X
    this.minusXOffset.onclick = function () {
      offsetGO(new THREE.Vector3(-parseFloat(_this.selectStep.value), 0, 0));
    };
    this.plusXOffset.onclick = function () {
      offsetGO(new THREE.Vector3(parseFloat(_this.selectStep.value), 0, 0));
    };

    //on Y
    this.minusYOffset.onclick = function () {
      offsetGO(new THREE.Vector3(0, -parseFloat(_this.selectStep.value), 0));
    };
    this.plusYOffset.onclick = function () {
      offsetGO(new THREE.Vector3(0, parseFloat(_this.selectStep.value), 0));
    };

    //on Z
    this.minusZOffset.onclick = function () {
      offsetGO(new THREE.Vector3(0, 0, -parseFloat(_this.selectStep.value)));
    };
    this.plusZOffset.onclick = function () {
      offsetGO(new THREE.Vector3(0, 0, parseFloat(_this.selectStep.value)));
    };
  }

  jsonOnChange() {
    const buffer = this.model.getGameObject();
    const old = localStorage.getItem(LOCAL_STORAGE_FLAG_JSON);
    try {
      const newString = this.jsonEditorViewGO.computeCurrentString();
      localStorage.setItem(LOCAL_STORAGE_FLAG_JSON, newString);
      this.onGameObjectJSON(JSON.parse(newString));
      this.inputTag.onchange(); //rest visibility
    } catch (e) {
      console.error(e);
      localStorage.setItem(LOCAL_STORAGE_FLAG_JSON, old);
      if (buffer) this.onGameObjectJSON(buffer.toJSON(true));
    }
  }

  initUI() {
    const input = document.createElement('input');
    input.classList.add('input_Editor');
    input.setAttribute('type', 'file');
    this.ui.appendChild(input);
    this.input = input; //ref

    const prefabsList = document.createElement('ul');
    prefabsList.classList.add('ul_Editor');
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

    const focusTopGOButton = document.createElement('div');
    focusTopGOButton.classList.add('button_Editor');
    focusTopGOButton.innerHTML = 'Top';
    this.ui.appendChild(focusTopGOButton);
    this.focusTopGOButton = focusTopGOButton;

    const focusBotGOButton = document.createElement('div');
    focusBotGOButton.classList.add('button_Editor');
    focusBotGOButton.innerHTML = 'Bot';
    this.ui.appendChild(focusBotGOButton);
    this.focusBotGOButton = focusBotGOButton;

    const focusRightGOButton = document.createElement('div');
    focusRightGOButton.classList.add('button_Editor');
    focusRightGOButton.innerHTML = 'Right';
    this.ui.appendChild(focusRightGOButton);
    this.focusRightGOButton = focusRightGOButton;

    const focusLeftGOButton = document.createElement('div');
    focusLeftGOButton.classList.add('button_Editor');
    focusLeftGOButton.innerHTML = 'Left';
    this.ui.appendChild(focusLeftGOButton);
    this.focusLeftGOButton = focusLeftGOButton;

    const focusBackGOButton = document.createElement('div');
    focusBackGOButton.classList.add('button_Editor');
    focusBackGOButton.innerHTML = 'Back';
    this.ui.appendChild(focusBackGOButton);
    this.focusBackGOButton = focusBackGOButton;

    const focusForwardGOButton = document.createElement('div');
    focusForwardGOButton.classList.add('button_Editor');
    focusForwardGOButton.innerHTML = 'Forward';
    this.ui.appendChild(focusForwardGOButton);
    this.focusForwardGOButton = focusForwardGOButton;

    //opacity object slider label
    const labelOpacity = document.createElement('div');
    labelOpacity.innerHTML = 'GameObject opacity';
    this.ui.appendChild(labelOpacity);

    //opacity of the gameobject
    const opacitySlider = document.createElement('input');
    opacitySlider.classList.add('input_Editor');
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
    checkboxGizmo.classList.add('input_Editor');
    checkboxGizmo.setAttribute('type', 'checkbox');
    this.ui.appendChild(checkboxGizmo);
    this.checkboxGizmo = checkboxGizmo;

    //switch controls
    const switchControls = document.createElement('div');
    switchControls.classList.add('button_Editor');
    switchControls.innerHTML = 'Switch Controls';
    this.ui.appendChild(switchControls);
    this.switchControls = switchControls;

    //label checkbox
    const objectVisibilityLabel = document.createElement('div');
    objectVisibilityLabel.innerHTML = 'Object Tag Visibility';
    this.ui.appendChild(objectVisibilityLabel);

    const inputTag = document.createElement('input');
    inputTag.classList.add('input_Editor');
    inputTag.type = 'text';
    this.ui.appendChild(inputTag);
    this.inputTag = inputTag;

    //new go
    const newGOButton = document.createElement('div');
    newGOButton.classList.add('button_Editor');
    newGOButton.innerHTML = 'New';
    this.ui.appendChild(newGOButton);
    this.newGOButton = newGOButton;

    //new heightmap add button
    const addHeightmapButton = document.createElement('div');
    addHeightmapButton.classList.add('button_Editor');
    addHeightmapButton.innerHTML = 'Add Heightmap World Script Component';
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

    //add World Script
    const addScriptButton = document.createElement('div');
    addScriptButton.classList.add('button_Editor');
    addScriptButton.innerHTML = 'Add World Script Component';
    this.ui.appendChild(addScriptButton);
    this.addScriptButton = addScriptButton;

    //uuid
    const generateUUIDButton = document.createElement('div');
    generateUUIDButton.classList.add('button_Editor');
    generateUUIDButton.innerHTML = 'Generate uuid in gameobject';
    this.ui.appendChild(generateUUIDButton);
    this.generateUUIDButton = generateUUIDButton;

    //Edit Mesh
    const editMeshesButton = document.createElement('div');
    editMeshesButton.classList.add('button_Editor');
    editMeshesButton.innerHTML = 'Edit Meshes';
    this.ui.appendChild(editMeshesButton);
    this.editMeshesButton = editMeshesButton;

    //jsoneditor
    this.ui.appendChild(this.jsonEditorViewGO.html());

    //offset
    const labelOffset = document.createElement('div');
    labelOffset.innerHTML = 'Offset';
    this.ui.appendChild(labelOffset);

    const steps = [10, 1, 0.1, 0.01];
    const selectStep = document.createElement('select');
    steps.forEach(function (step) {
      const option = document.createElement('option');
      option.text = step + '';
      selectStep.appendChild(option);
    });
    this.ui.appendChild(selectStep);
    this.selectStep = selectStep;

    const createMinusPlus = function (name) {
      //parent
      const parent = document.createElement('div');
      parent.classList.add('flex_Editor');

      //label
      const label = document.createElement('div');
      label.innerHTML = name;
      parent.appendChild(label);

      //minus
      const minus = document.createElement('div');
      minus.classList.add('button_Editor');
      minus.innerHTML = '-';
      parent.appendChild(minus);

      //plus
      const plus = document.createElement('div');
      plus.classList.add('button_Editor');
      plus.innerHTML = '+';
      parent.appendChild(plus);

      return { parent: parent, minus: minus, plus: plus };
    };

    const resultX = createMinusPlus('X');
    this.minusXOffset = resultX.minus;
    this.plusXOffset = resultX.plus;
    this.ui.appendChild(resultX.parent);

    const resultY = createMinusPlus('Y');
    this.minusYOffset = resultY.minus;
    this.plusYOffset = resultY.plus;
    this.ui.appendChild(resultY.parent);

    const resultZ = createMinusPlus('Z');
    this.minusZOffset = resultZ.minus;
    this.plusZOffset = resultZ.plus;
    this.ui.appendChild(resultZ.parent);
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
      li.classList.add('li_Editor');
      li.innerHTML = name;
      li.onclick = function () {
        _this.jsonEditorViewGO.onJSON(_this.prefabs[name]);
        _this.focusGameObject();
      };
      list.appendChild(li);
    }
  }

  onOpenNewJSON(json) {
    //json
    this.jsonEditorViewGO.onJSON(json);

    this.focusGameObject();
    this.onResize();
  }

  onOpenNewPrefab(json) {
    this.prefabs[json.name] = json;
    //store localstorage
    localStorage.setItem(
      LOCAL_STORAGE_FLAG_PREFABS,
      Components.SystemUtils.JSONUtils.pack(this.prefabs)
    );
    this.updateUI();
  }

  load() {
    const _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.initUI();

        //start tick
        _this.tick();

        _this.initCallbacks();

        _this.model.initScene();

        _this.initFromLocalStorage();

        resolve();
      } catch (e) {
        reject();
      }
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
        this.prefabs = Components.SystemUtils.JSONUtils.unpack(oldPrefabs);
        this.updateUI();
      } catch (e) {
        console.error(e);
      }
    }
  }
}
