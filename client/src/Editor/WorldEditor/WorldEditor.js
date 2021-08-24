/** @format */

import './WorldEditor.css';
import { ColliderEditorView } from '../ColliderEditor/ColliderEditor';
import { AddPrefabEditorView } from '../AddPrefabEditor/AddPrefabEditor';
import { TransformEditorView } from '../TransformEditor/TransformEditor';
import Shared from 'ud-viz/src/Game/Shared/Shared';
import * as udviz from 'ud-viz';
import { GameView } from 'ud-viz/src/Views/Views';
import { THREE, OrbitControls } from 'ud-viz';

export class WorldEditorView {
  constructor(params) {
    this.config = params.config;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_WorldEditor');
    params.parentUIHtml.appendChild(this.ui);

    //html
    this.closeButton = null;
    this.toolsButtons = null;

    this.assetsManager = params.assetsManager;

    this.model = new WorldEditorModel(params.assetsManager, params.worldJSON);

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

    this.transformButton = null;
    this.colliderButton = null;
    this.heightmapButton = null;
    this.addPrefabButton = null;

    this.labelCurrentWorld = null;
    this.toolsList = null;

    //controls
    this.orbitControls = null;

    this.childrenViews = [];

    this.initUI();
    this.initCallbacks();
    this.initOrbitControls();
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
    this.toolsButtons = document.createElement('div');
    this.toolsButtons.classList.add('ul_WorldEditor');
    this.ui.appendChild(this.toolsButtons);

    const labelCurrentWorld = document.createElement('p');
    labelCurrentWorld.innerHTML =
      this.gameView.getStateComputer().getWorldContext().getWorld().getName() +
      ' :';
    this.ui.appendChild(labelCurrentWorld);
    this.labelCurrentWorld = labelCurrentWorld;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;

    const transformButton = document.createElement('li');
    transformButton.classList.add('li_Editor');
    transformButton.innerHTML = 'Transform';
    this.toolsButtons.appendChild(transformButton);
    this.transformButton = transformButton;

    const colliderButton = document.createElement('li');
    colliderButton.classList.add('li_Editor');
    colliderButton.innerHTML = 'Collider';
    this.toolsButtons.appendChild(colliderButton);
    this.colliderButton = colliderButton;

    const heightmapButton = document.createElement('li');
    heightmapButton.classList.add('li_Editor');
    heightmapButton.innerHTML = 'Heightmap';
    this.toolsButtons.appendChild(heightmapButton);
    this.heightmapButton = heightmapButton;

    const addPrefabButton = document.createElement('li');
    addPrefabButton.classList.add('li_Editor');
    addPrefabButton.innerHTML = 'Add Prefab';
    this.toolsButtons.appendChild(addPrefabButton);
    this.addPrefabButton = addPrefabButton;
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

    this.transformButton.onclick = function () {
      //check if one already exist
      for (let index = 0; index < _this.childrenViews.length; index++) {
        const element = _this.childrenViews[index];
        if (element instanceof TransformEditorView) return;
      }

      const tV = new TransformEditorView({
        parentUIHtml: _this.ui.parentElement,
        gameView: _this.gameView,
        orbitControls: _this.orbitControls,
      });

      tV.setOnClose(function () {
        tV.dispose();

        const index = _this.childrenViews.indexOf(tV);
        _this.childrenViews.splice(index, 1);
      });

      _this.childrenViews.push(tV);
    };

    this.addPrefabButton.onclick = function () {
      //check if one already exist
      for (let index = 0; index < _this.childrenViews.length; index++) {
        const element = _this.childrenViews[index];
        if (element instanceof AddPrefabEditorView) return;
      }

      const aV = new AddPrefabEditorView({
        parentUIHtml: _this.ui.parentElement,
        assetsManager: _this.assetsManager,
      });

      aV.setOnClose(function () {
        aV.dispose();

        const index = _this.childrenViews.indexOf(aV);
        _this.childrenViews.splice(index, 1);
      });

      _this.childrenViews.push(aV);
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
    this.worldStateComputer.onInit(new Shared.World(json));
  }

  getWorldStateComputer() {
    return this.worldStateComputer;
  }
}
