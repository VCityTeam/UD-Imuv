/** @format */

import './Editor.css';
import { Game, THREE, OrbitControls } from 'ud-viz';
import { GameView } from 'ud-viz/src/View/GameView/GameView';
import { LocalComputer } from 'ud-viz/src/Game/Components/StateComputer/LocalComputer';

export class EditorView {
  constructor(config) {
    this.config = config;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Editor');

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.rootHtml.appendChild(this.ui);

    //html
    this.worldsList = null;

    //assets
    this.assetsManager = new Game.Components.AssetsManager();

    //model
    this.model = new EditorModel(this.assetsManager);

    //gameview
    this.currentGameView = null;

    //controls
    this.orbitControls = null;
  }

  dispose() {
    this.rootHtml.remove();
    if (this.orbitControls) this.orbitControls.dispose();
    if (this.currentGameView) this.currentGameView.dispose();
  }

  initUI() {
    const worldsList = document.createElement('ul');
    worldsList.classList.add('ul_Editor');
    this.ui.appendChild(worldsList);
    this.worldsList = worldsList;
  }

  initCallbacks() {
    const _this = this;
  }

  updateUI() {
    const worldsJSON = this.assetsManager.getWorldsJSON();
    //clean worlds list and rebuild it
    const list = this.worldsList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    const _this = this;
    worldsJSON.forEach(function (w) {
      const li = document.createElement('li');
      li.classList.add('li_Editor');
      li.innerHTML = w.name;
      li.onclick = _this.onWorldJSON.bind(_this, w);
      list.appendChild(li);
    });
  }

  onWorldJSON(json) {
    if (this.currentGameView) {
      this.currentGameView.dispose();
    }

    this.model.onWorldJSON(json);

    this.currentGameView = new GameView({
      htmlParent: this.rootHtml,
      assetsManager: this.assetsManager,
      stateComputer: this.model.getLocalComputer(),
      config: this.config,
      firstGameView: false,
    });

    this.currentGameView.onFirstState(
      this.model.getLocalComputer().computeCurrentState(),
      null
    );

    this.currentGameView.getInputManager().setPause(true);

    //offset the gameview
    this.currentGameView.setDisplaySize(
      new THREE.Vector2(this.ui.clientWidth, 0)
    );

    //new controls
    if (this.orbitControls) this.orbitControls.dispose();

    const _this = this;
    this.orbitControls = new OrbitControls(
      this.currentGameView.getItownsView().camera.camera3D,
      this.currentGameView.rootItownsHtml
    );
      
    this.orbitControls.target.copy(this.currentGameView.getExtent().center());
    this.orbitControls.rotateSpeed = 0.5;
    this.orbitControls.zoomSpeed = 0.1;
    const controlsUpdate = function () {
      _this.orbitControls.update();
    };
    this.currentGameView.addTickRequester(controlsUpdate);
  }

  load() {
    const _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.assetsManager
          .loadFromConfig(_this.config.assetsManager)
          .then(function () {
            _this.initUI();
            _this.initCallbacks();
            _this.updateUI();
            resolve();
          });
      } catch (e) {
        reject();
      }
    });
  }

  html() {
    return this.rootHtml;
  }
}

class EditorModel {
  constructor(assetsManager) {
    this.localComputer = null;
    this.assetsManager = assetsManager;
  }

  onWorldJSON(json) {
    //init localcomputer
    this.localComputer = new LocalComputer(
      new Game.Shared.World(json),
      this.assetsManager
    );

    this.localComputer.load();
  }

  getLocalComputer() {
    return this.localComputer;
  }
}
