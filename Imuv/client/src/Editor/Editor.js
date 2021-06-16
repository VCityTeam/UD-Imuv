/** @format */

import './Editor.css';
import { Game } from 'ud-viz';
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
    this.model = new EditorModel();

    //gameview
    this.currentGameView = null;
  }

  dispose() {
    this.rootHtml.remove();
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
    this.model.onWorldJSON(json);

    this.currentGameView = new GameView({
      assetsManager: this.assetsManager,
      stateComputer: this.model.getLocalComputer(),
      config: this.config,
      firstGameView: false,
    });


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
  constructor() {
    this.localComputer = null;
  }

  onWorldJSON(json) {
    //init localcomputer
    this.localComputer = new LocalComputer(new Game.Shared.World(json));
  }

  getLocalComputer() {
    return this.localComputer;
  }
}
