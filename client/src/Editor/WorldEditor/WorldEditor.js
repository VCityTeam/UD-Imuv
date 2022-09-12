/** @format */

import './WorldEditor.css';
import Game from 'ud-viz/src/Game/Game';
import { AddPrefabEditorView } from './AddPrefabEditor/AddPrefabEditor';
import * as udviz from 'ud-viz';
import { THREE } from 'ud-viz';
import { GOEditorView } from '../GOEditor/GOEditor';
import { HeightmapEditorView } from './HeightmapEditor/HeightmapEditor';
import { computeMapGO } from '../Components/EditorUtility';
const WorldStateInterpolator = Game.WorldStateInterpolator;
import { EditorGameView } from '../Components/EditorGameView';
import ImuvConstants from '../../../../imuv.constants';
import { AnimatedText } from '../../LocalScriptsModule/AnimatedText/AnimatedText';
import * as JitsiIframeAPI from 'jitsi-iframe-api';
import { Canvg } from 'canvg';

export class WorldEditorView {
  constructor(params) {
    this.config = params.config;

    this.parentUIHtml = params.parentUIHtml;
    this.parentGameViewHtml = params.parentGameViewHtml;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_WorldEditor');
    this.parentUIHtml.appendChild(this.ui);

    this.assetsManager = params.assetsManager;
    this.model = new WorldEditorModel(this.assetsManager, params.worldJSON);

    this.gameView = new EditorGameView({
      htmlParent: this.parentGameViewHtml,
      assetsManager: params.assetsManager,
      config: this.config,
      userData: { firstGameView: false, settings: {} },
      interpolator: this.model.getInterpolator(),
      updateGameObject: false,
      localScriptModules: {
        ImuvConstants: ImuvConstants,
        AnimatedText: AnimatedText,
        JitsiIframeAPI: JitsiIframeAPI,
        Canvg: Canvg,
      },
    });

    //offset the gameview
    this.gameView.setDisplaySize(
      new THREE.Vector2(this.parentUIHtml.clientWidth, 0)
    );
    const _this = this;
    //focus gameview go when new go
    this.gameView.addOnNewGORequester(function () {
      _this.focusObject(_this.gameView.getObject3D());
    });

    //controls
    this.orbitControls = this.gameView.getOrbitControls();

    //view to edit go
    this.goEditorView = new GOEditorView({
      parentUIHtml: this.ui,
      gameView: this.gameView,
      parentView: this,
      assetsManager: this.assetsManager,
    });

    //view to add prefab
    this.addPrefabView = new AddPrefabEditorView({
      parentUIHtml: this.ui.parentElement,
      assetsManager: this.assetsManager,
      gameView: this.gameView,
      parentView: this,
    });

    //html
    this.closeButton = null;
    this.heightmapButton = null;
    this.playWorldButton = null;
    this.sliderOpacity = null;
    this.filterText = null;
    this.hideButton = null;
    this.showButton = null;

    //camera controller button
    this.topButton = null;
    this.bottomButton = null;
    this.rightButton = null;
    this.leftButton = null;
    this.frontButton = null;
    this.backButton = null;

    //ref children views to dispose them easily
    this.childrenViews = [this.goEditorView, this.addPrefabView]; //view always active

    this.initUI();
    this.initCallbacks();
  }

  addGameObject(newGo, onLoad) {
    //find the map
    const wCxt = this.gameView.getInterpolator().getWorldContext();
    const world = wCxt.getWorld();
    const mapGo = computeMapGO(this.gameView);

    if (!mapGo) throw new Error('no map object in world');

    const _this = this;
    world.addGameObject(newGo, wCxt, mapGo, function () {
      //force update gameview
      _this.gameView.forceUpdate();

      //force ui update
      _this.goEditorView.updateUI();

      if (onLoad) onLoad();
    });
  }

  getGOEditorView() {
    return this.goEditorView;
  }

  getGameView() {
    return this.gameView;
  }

  dispose() {
    this.gameView.dispose();
    this.ui.remove();

    this.childrenViews.forEach(function (v) {
      v.dispose();
    });
  }

  initUI() {
    const labelUlButtons = document.createElement('p');
    labelUlButtons.innerHTML = 'Outils :';
    this.ui.appendChild(labelUlButtons);

    const ulButtons = document.createElement('ul');
    ulButtons.classList.add('ul_Editor');
    this.ui.appendChild(ulButtons);

    const closeButton = document.createElement('div');
    closeButton.classList.add('button_Editor');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;

    const heightmapButton = document.createElement('li');
    heightmapButton.classList.add('li_Editor');
    heightmapButton.innerHTML = 'Heightmap';
    ulButtons.appendChild(heightmapButton);
    this.heightmapButton = heightmapButton;

    const sliderOpacity = document.createElement('input');
    sliderOpacity.id = 'opacity';
    sliderOpacity.classList.add('input_Editor');
    sliderOpacity.setAttribute('type', 'range');
    sliderOpacity.value = '100';
    this.ui.appendChild(sliderOpacity);
    this.sliderOpacity = sliderOpacity;

    const filterDiv = document.createElement('div');
    filterDiv.innerHTML = 'Filter : ';
    this.ui.appendChild(filterDiv);

    const filterText = document.createElement('input');
    filterText.setAttribute('type', 'text');
    filterDiv.appendChild(filterText);
    this.filterText = filterText;

    this.hideButton = this.buttonHtml('Hide', filterDiv);
    this.showButton = this.buttonHtml('Show', filterDiv);

    const labelSliderOp = document.createElement('label');
    labelSliderOp.setAttribute('for', 'opacity');
    labelSliderOp.innerHTML = 'Opacity';
    this.ui.appendChild(labelSliderOp);

    const labelUlCameraController = document.createElement('p');
    labelUlCameraController.innerHTML = 'Camera Controller :';
    this.ui.appendChild(labelUlCameraController);

    const ulCameraControllerButtons = document.createElement('ul');
    this.ui.appendChild(ulCameraControllerButtons);

    this.topButton = this.buttonHtml('Top', ulCameraControllerButtons);
    this.bottomButton = this.buttonHtml('Bottom', ulCameraControllerButtons);
    this.rightButton = this.buttonHtml('Right', ulCameraControllerButtons);
    this.leftButton = this.buttonHtml('Left', ulCameraControllerButtons);
    this.frontButton = this.buttonHtml('Front', ulCameraControllerButtons);
    this.backButton = this.buttonHtml('Back', ulCameraControllerButtons);
  }

  buttonHtml(name, parent) {
    const button = document.createElement('li');
    button.classList.add('button_Editor');
    button.innerHTML = name;
    parent.appendChild(button);
    return button;
  }

  focusObject(objToFocus) {
    if (!objToFocus) {
      console.warn('no object to focus');
      return;
    }

    const camera = this.gameView.getCamera();

    const bb = new THREE.Box3().setFromObject(objToFocus);

    let center, radius;

    //avoid bug if no renderdata on this gameobject
    const checkIfCoordInfinite = function (value) {
      return value === Infinity || value === -Infinity;
    };
    const checkIfVectorHasCoordInfinite = function (vector) {
      return (
        checkIfCoordInfinite(vector.x) ||
        checkIfCoordInfinite(vector.y) ||
        checkIfCoordInfinite(vector.z)
      );
    };

    if (
      checkIfVectorHasCoordInfinite(bb.max) ||
      checkIfVectorHasCoordInfinite(bb.min)
    ) {
      center = this.gameView.getObject3D().position.clone();
      radius = 1;
    } else {
      center = bb.getCenter(new THREE.Vector3());
      radius = bb.min.distanceTo(bb.max) * 0.5;
    }

    // compute new distance between camera and center of object/sphere
    const h = radius / Math.tan((camera.fov / 2) * THREE.Math.DEG2RAD);

    // get direction of camera
    const dir = objToFocus.getWorldDirection(new THREE.Vector3());

    // compute new camera position
    const newPos = new THREE.Vector3().addVectors(center, dir.setLength(h));

    camera.position.set(newPos.x, newPos.y, newPos.z);
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    this.orbitControls.target.copy(center);
    this.orbitControls.update();
  }

  initCallbacks() {
    const _this = this;

    this.heightmapButton.onclick = function () {
      //check if one already exist
      for (let index = 0; index < _this.childrenViews.length; index++) {
        const element = _this.childrenViews[index];
        if (element instanceof HeightmapEditorView) return;
      }

      const hV = new HeightmapEditorView({
        parentUIHtml: _this.ui,
        assetsManager: _this.assetsManager,
        gameView: _this.gameView,
        parentView: _this,
      });

      hV.setOnClose(function () {
        hV.dispose();

        const index = _this.childrenViews.indexOf(hV);
        _this.childrenViews.splice(index, 1);
      });

      _this.childrenViews.push(hV);
    };

    //TODO Maybe not the good way
    const setTransparencyChild = function (GO, ratio) {
      GO.children.forEach((child) => {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = ratio;
          child.material.format = THREE.RGBAFormat;
          child.material.needsUpdate = true;
        }
        if (child.children) {
          setTransparencyChild(child, ratio);
        }
      });
    };

    this.sliderOpacity.oninput = function (event) {
      if (!_this.model) return;

      const ratio = parseFloat(event.target.value) / 100;
      const mapGo = computeMapGO(_this.gameView);
      if (!mapGo) return;
      setTransparencyChild(_this.gameView.object3D, ratio);
    };

    const rotateCamera = function (dir) {
      const camera = _this.gameView.getCamera();
      const center = _this.orbitControls.target.clone();
      const distance = camera.position.distanceTo(center);
      const newPos = new THREE.Vector3().addVectors(
        center.clone(),
        dir.clone().multiplyScalar(distance)
      );
      camera.position.set(newPos.x, newPos.y, newPos.z);
      camera.lookAt(center);
      _this.orbitControls.update();
      camera.updateProjectionMatrix();
    };

    const showHideFilter = function (GO, filterText, show) {
      GO.traverse(function (child) {
        if (!(child instanceof THREE.Mesh)) {
          child.visible = true;
          return;
        }
        if (
          child.name &&
          child.name.toLowerCase().includes(filterText.toLowerCase()) &&
          filterText != ''
        ) {
          child.visible = show;
        } else {
          child.visible = !show;
        }
      });
    };

    this.hideButton.onclick = function () {
      const filterTxt = _this.filterText.value;

      const mapGo = computeMapGO(_this.gameView);
      if (!mapGo) return;
      showHideFilter(_this.gameView.object3D, filterTxt, false);
    };

    this.showButton.onclick = function () {
      const filterTxt = _this.filterText.value;
      const mapGo = computeMapGO(_this.gameView);
      if (!mapGo) return;
      showHideFilter(_this.gameView.object3D, filterTxt, true);
    };

    this.topButton.onclick = rotateCamera.bind(
      this,
      new THREE.Vector3(0, 0, 1)
    );
    this.bottomButton.onclick = rotateCamera.bind(
      this,
      new THREE.Vector3(0, 0, -1)
    );
    this.frontButton.onclick = rotateCamera.bind(
      this,
      new THREE.Vector3(0, 1, 0)
    );
    this.backButton.onclick = rotateCamera.bind(
      this,
      new THREE.Vector3(0, -1, 0)
    );
    this.rightButton.onclick = rotateCamera.bind(
      this,
      new THREE.Vector3(1, 0, 0)
    );
    this.leftButton.onclick = rotateCamera.bind(
      this,
      new THREE.Vector3(-1, 0, 0)
    );

    const manager = this.gameView.getInputManager();

    manager.addKeyInput('f', 'keyup', function () {
      const currentGO = _this.goEditorView.getSelectedGO();
      if (!currentGO) return;
      const objectInScene = _this.goEditorView.computeObject3D(
        currentGO.getUUID()
      );
      _this.focusObject(objectInScene);
    });

    const bufferInvisible = [];
    manager.addKeyInput('Alt', 'keydown', function () {
      _this.gameView.object3D.traverse(function (child) {
        if (!child.visible) bufferInvisible.push(child);
        child.visible = true;
      });
    });

    manager.addKeyInput('Alt', 'keyup', function () {
      while (bufferInvisible.length > 0) {
        bufferInvisible.pop().visible = false;
      }
    });
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}

class WorldEditorModel {
  constructor(assetsManager, json) {
    const worldStateComputer = new Game.WorldStateComputer(assetsManager, 30, {
      udviz: udviz,
      Game: Game,
    });

    worldStateComputer.start(new Game.World(json));
    //smooth rendering with delay
    this.interpolator = new WorldStateInterpolator(0, worldStateComputer);
  }

  getInterpolator() {
    return this.interpolator;
  }
}
