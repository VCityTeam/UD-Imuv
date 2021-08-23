/** @format */

import './Editor.css';
import { Game } from 'ud-viz';
import Constants from 'ud-viz/src/Game/Shared/Components/Constants';
import { WorldEditorView } from './WorldEditor/WorldEditor';

export class EditorView {
  constructor(webSocketService, config) {
    this.config = config;

    this.webSocketService = webSocketService;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Editor');

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.rootHtml.appendChild(this.ui);

    //html
    this.worldsList = null;
    this.saveWorldsButton = null;
    this.saveCurrentWorldButton = null;

    //assets
    this.assetsManager = new Game.Components.AssetsManager();

    //gameview
    this.currentWorldView = null;
  }

  dispose() {
    this.rootHtml.remove();
    if (this.currentWorldView) this.currentWorldView.dispose();
  }

  initUI() {
    const worldsList = document.createElement('ul');
    worldsList.classList.add('ul_Editor');
    this.ui.appendChild(worldsList);
    this.worldsList = worldsList;

    this.saveWorldsButton = document.createElement('div');
    this.saveWorldsButton.classList.add('button_Editor');
    this.saveWorldsButton.innerHTML = 'Save Worlds';
    this.ui.appendChild(this.saveWorldsButton);

    this.saveCurrentWorldButton = document.createElement('div');
    this.saveCurrentWorldButton.classList.add('button_Editor');
    this.saveCurrentWorldButton.innerHTML = 'Save Current World Local';
    this.ui.appendChild(this.saveCurrentWorldButton);
  }

  initCallbacks() {
    const _this = this;

    this.saveWorldsButton.onclick = function () {
      _this.saveCurrentWorld();

      _this.webSocketService.emit(
        Constants.WEBSOCKET.MSG_TYPES.SAVE_WORLDS,
        _this.assetsManager.getWorldsJSON()
      );
    };

    this.saveCurrentWorldButton.onclick = this.saveCurrentWorld.bind(this);
  }

  saveCurrentWorld() {
    if (!this.currentWorldView.getGameView()) return;

    //world loaded
    const world = this.currentWorldView
      .getGameView()
      .getStateComputer()
      .getWorldContext()
      .getWorld();

    const currentObject3D = this.currentWorldView.getGameView().getObject3D();
    //update object 3D transform
    currentObject3D.traverse(function (object) {
      world.getGameObject().traverse(function (go) {
        if (go.getUUID() == object.userData.gameObjectUUID) {
          go.bindTransformFrom(object);
        }
      });
    });

    const worldsJSON = this.assetsManager.getWorldsJSON();
    for (let index = 0; index < worldsJSON.length; index++) {
      const json = worldsJSON[index];
      if ((json.uuid = world.getUUID())) {
        //found
        worldsJSON[index] = world.toJSON(); // update with new content
        break;
      }
    }

    this.updateUI();
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
    if (this.currentWorldView) {
      this.currentWorldView.dispose();
    }

    this.currentWorldView = new WorldEditorView({
      parentUIHtml: this.ui,
      worldJSON: json,
      parentGameViewHtml: this.rootHtml,
      assetsManager: this.assetsManager,
      firstGameView: false,
      config: this.config,
    });

    const _this = this;
    this.currentWorldView.setOnClose(function () {
      _this.currentWorldView.dispose();
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
