/** @format */

import './WorldEditor.css';
import { ColliderEditorView } from '../ColliderEditor/ColliderEditor';
import { AddPrefabEditorView } from '../AddPrefabEditor/AddPrefabEditor';
import Shared from 'ud-viz/src/Game/Shared/Shared';
import * as udviz from 'ud-viz';
import { GameView } from 'ud-viz/src/Views/Views';
import { THREE, OrbitControls } from 'ud-viz';
import { GOEditorView } from '../GOEditor/GOEditor';
import { HeightmapEditorView } from '../HeightmapEditor/HeightmapEditor';
import { computeMapGO } from '../Components/EditorUtility';

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

    this.gameView = new GameView({
      htmlParent: this.parentGameViewHtml,
      assetsManager: params.assetsManager,
      config: this.config,
      userData: { firstGameView: false },
      stateComputer: this.model.getWorldStateComputer(),
      updateGameObject: false,
    });
    this.gameView.start(
      this.model.getWorldStateComputer().computeCurrentState(),
      null
    );
    //offset the gameview
    this.gameView.setDisplaySize(
      new THREE.Vector2(this.parentUIHtml.clientWidth, 0)
    );

    //controls
    this.orbitControls = null;
    this.initOrbitControls();

    //view to edit go
    this.goEditorView = new GOEditorView({
      parentUIHtml: this.ui,
      gameView: this.gameView,
      orbitControls: this.orbitControls,
      parentView: this,
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
    this.colliderButton = null;
    this.heightmapButton = null;
    this.labelCurrentWorld = null;
    this.playWorldButton = null;

    //ref children views to dispose them easily
    this.childrenViews = [this.goEditorView, this.addPrefabView]; //view always active

    this.childrenViews = [];

    this.initUI();
    this.initCallbacks();
  }

  addGameObject(newGo, onLoad) {
    //find the map
    const wCxt = this.gameView.getStateComputer().getWorldContext();
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
    this.orbitControls.dispose();

    this.childrenViews.forEach(function (v) {
      v.dispose();
    });
  }

  initUI() {
    const ulButtons = document.createElement('div');
    ulButtons.classList.add('ul_WorldEditor');
    this.ui.appendChild(ulButtons);

    const labelCurrentWorld = document.createElement('p');
    labelCurrentWorld.innerHTML =
      this.gameView.getStateComputer().getWorldContext().getWorld().getName() +
      ' :';
    this.ui.appendChild(labelCurrentWorld);
    this.labelCurrentWorld = labelCurrentWorld;

    const closeButton = document.createElement('div');
    closeButton.classList.add('button_Editor');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;

    const colliderButton = document.createElement('li');
    colliderButton.classList.add('li_Editor');
    colliderButton.innerHTML = 'Collider';
    ulButtons.appendChild(colliderButton);
    this.colliderButton = colliderButton;

    const heightmapButton = document.createElement('li');
    heightmapButton.classList.add('li_Editor');
    heightmapButton.innerHTML = 'Heightmap';
    ulButtons.appendChild(heightmapButton);
    this.heightmapButton = heightmapButton;
  }

  focusObject(objToFocus) {
    const camera = this.gameView.getItownsView().camera.camera3D;

    const bb = new THREE.Box3().setFromObject(objToFocus);
    const center = bb.getCenter(new THREE.Vector3());
    const radius = bb.min.distanceTo(bb.max) * 0.5;

    // compute new distance between camera and center of object/sphere
    const h = radius / Math.tan((camera.fov / 2) * THREE.Math.DEG2RAD);

    // get direction of camera
    const dir = new THREE.Vector3().subVectors(camera.position, center);

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

    this.colliderButton.onclick = function () {
      //check if one already exist
      for (let index = 0; index < _this.childrenViews.length; index++) {
        const element = _this.childrenViews[index];
        if (element instanceof ColliderEditorView) return;
      }
      const cEV = new ColliderEditorView({
        parentUIHtml: _this.ui.parentElement,
        gameView: _this.gameView,
        parentOC: _this.orbitControls,
        assetsManager: _this.assetsManager,
      });
      cEV.setOnClose(function () {
        cEV.dispose();
        const index = _this.childrenViews.indexOf(cEV);
        _this.childrenViews.splice(index, 1);
      });

      _this.childrenViews.push(cEV);
    };

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

    const manager = this.gameView.getInputManager();

    manager.addKeyInput('f', 'keyup', function () {
      const currentGO = _this.goEditorView.getSelectedGO();
      if (!currentGO) return;
      const objectInScene = _this.goEditorView.computeObject3D(
        currentGO.getUUID()
      );
      _this.focusObject(objectInScene);
    });
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }

  initOrbitControls() {
    //new controls
    if (this.orbitControls) this.orbitControls.dispose();

    this.orbitControls = new OrbitControls(
      this.gameView.getItownsView().camera.camera3D,
      this.gameView.rootItownsHtml
    );

    this.orbitControls.target.copy(this.gameView.getExtent().center());
    this.orbitControls.update();
  }
}

class WorldEditorModel {
  constructor(assetsManager, json) {
    this.worldStateComputer = new Shared.WorldStateComputer(assetsManager, 30, {
      udviz: udviz,
      Shared: Shared,
    });

    this.onWorldJSON(json);
  }

  onWorldJSON(json) {
    this.worldStateComputer.start(new Shared.World(json));
  }

  getWorldStateComputer() {
    return this.worldStateComputer;
  }
}
