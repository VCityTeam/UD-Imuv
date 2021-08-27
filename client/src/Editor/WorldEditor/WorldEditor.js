/** @format */

import './WorldEditor.css';
import { ColliderEditorView } from '../ColliderEditor/ColliderEditor';
import { AddPrefabEditorView } from '../AddPrefabEditor/AddPrefabEditor';
import Shared from 'ud-viz/src/Game/Shared/Shared';
import * as udviz from 'ud-viz';
import { GameView } from 'ud-viz/src/Views/Views';
import { THREE, OrbitControls } from 'ud-viz';
import { GOEditorView } from '../GOEditor/GOEditor';

export class WorldEditorView {
  constructor(params) {
    this.config = params.config;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_WorldEditor');
    params.parentUIHtml.appendChild(this.ui);

    this.assetsManager = params.assetsManager;
    this.model = new WorldEditorModel(this.assetsManager, params.worldJSON);

    this.gameView = new GameView({
      htmlParent: params.parentGameViewHtml,
      assetsManager: params.assetsManager,
      config: this.config,
      firstGameView: false,
      stateComputer: this.model.getWorldStateComputer(),
    });
    this.gameView.setUpdateGameObject(false);
    this.gameView.onFirstState(
      this.model.getWorldStateComputer().computeCurrentState(),
      null
    );
    //offset the gameview
    this.gameView.setDisplaySize(
      new THREE.Vector2(params.parentUIHtml.clientWidth, 0)
    );

    //controls
    this.orbitControls = null;
    this.initOrbitControls();

    //view to edit go
    this.goEditorView = new GOEditorView({
      parentUIHtml: this.ui,
      gameView: this.gameView,
      orbitControls: this.orbitControls,
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

    //ref children views to dispose them easily
    this.childrenViews = [this.goEditorView, this.addPrefabView]; //view always active

    this.initUI();
    this.initCallbacks();
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

  initCallbacks() {
    const _this = this;

    this.colliderButton.onclick = function () {
      //check if one already exist
      for (let index = 0; index < _this.childrenViews.length; index++) {
        const element = _this.childrenViews[index];
        if (element instanceof ColliderEditorView) return;
      }

      const CEV = new ColliderEditorView(_this);
      CEV.setOnClose(function () {
        CEV.dispose();

        const index = _this.childrenViews.indexOf(CEV);
        _this.childrenViews.splice(index, 1);
      });

      _this.childrenViews.push(CEV);
    };
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
    this.worldStateComputer.load(new Shared.World(json));
  }

  getWorldStateComputer() {
    return this.worldStateComputer;
  }
}
