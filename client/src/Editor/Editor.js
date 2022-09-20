/** @format */

import './Editor.css';
import { Views } from 'ud-viz';
import { WorldEditorView } from './WorldEditor/WorldEditor';
import { PlayWorldEditorView } from './PlayWorldEditor/PlayWorldEditor';
import Pack from 'ud-viz/src/Game/Components/Pack';
import ImuvConstants from '../../../imuv.constants';

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
    this.closeButton = null;
    this.worldsList = null;
    this.saveWorldsButton = null;
    this.playCurrentWorldButton = null;
    this.refreshButton = null;

    //assets
    this.assetsManager = new Views.AssetsManager();

    //gameview
    this.currentWorldView = null;
    this.currentPlayWorldView = null;

    /* A variable that is used to store the current world's UUID. */
    this.currentWorldUUID = null;
  }

  closeCurrentView() {
    if (this.currentWorldView) {
      this.saveCurrentWorld();
      this.currentWorldView.dispose();
      this.currentWorldView = null;
    }

    if (this.currentPlayWorldView) {
      this.currentPlayWorldView.dispose();
      this.currentPlayWorldView = null;
    }
  }

  dispose() {
    this.rootHtml.remove();
    this.closeCurrentView();
  }

  initUI() {
    const title = document.createElement('h1');
    title.innerHTML = 'Editeur';
    this.ui.appendChild(title);

    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('button_Editor');
    this.closeButton.innerHTML = 'Close';
    this.ui.appendChild(this.closeButton);

    const worldsList = document.createElement('ul');
    worldsList.classList.add('ul_Editor');
    this.ui.appendChild(worldsList);
    this.worldsList = worldsList;

    this.saveWorldsButton = document.createElement('div');
    this.saveWorldsButton.classList.add('button_Editor');
    this.saveWorldsButton.innerHTML = 'Save Worlds';
    this.saveWorldsButton.disabled = true;
    this.ui.appendChild(this.saveWorldsButton);

    this.playCurrentWorldButton = document.createElement('div');
    this.playCurrentWorldButton.classList.add('button_Editor');
    this.playCurrentWorldButton.innerHTML = 'Play Current World';
    this.ui.appendChild(this.playCurrentWorldButton);

    this.refreshButton = document.createElement('div');
    this.refreshButton.classList.add('button_Editor');
    this.refreshButton.innerHTML = 'Refresh';
    this.ui.appendChild(this.refreshButton);
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }

  initCallbacks() {
    const _this = this;

    this.saveWorldsButton.onclick = function () {
      _this.saveCurrentWorld();

      const worldsJSON = _this.assetsManager.getWorldsJSON();

      console.log('send data server ', worldsJSON);

      const messageSplitted = Pack.splitMessage(worldsJSON);
      // console.log(messageSplitted);
      messageSplitted.forEach(function (pM) {
        _this.webSocketService.emit(
          ImuvConstants.WEBSOCKET.MSG_TYPES.SAVE_WORLDS,
          pM
        );
      });
    };

    this.playCurrentWorldButton.onclick = function () {
      if (!_this.currentWorldView) return;
      _this.saveCurrentWorld();

      const worldUUID = _this.currentWorldView
        .getGameView()
        .getInterpolator()
        .getWorldContext()
        .getWorld()
        .getUUID();
      let wJson = null;
      _this.assetsManager.getWorldsJSON().forEach(function (json) {
        if (json.uuid == worldUUID) wJson = json;
      });

      if (!wJson) throw new Error('no world json');

      _this.closeCurrentView();

      //create new view
      _this.currentPlayWorldView = new PlayWorldEditorView({
        parentUIHtml: _this.ui,
        parentView: _this,
        assetsManager: _this.assetsManager,
        config: _this.config,
        worldJSON: wJson,
        parentGameViewHtml: _this.rootHtml,
      });

      _this.currentPlayWorldView.setOnClose(function () {
        _this.currentPlayWorldView.dispose();
      });
    };

    this.refreshButton.onclick = function () {
      if (!_this.currentWorldView) return;
      _this.saveCurrentWorld();
      _this.onWorldJSON(_this.currentWorldUUID);
    };
  }

  saveCurrentWorld() {
    if (!this.currentWorldView) return;

    //world loaded
    const world = this.currentWorldView
      .getGameView()
      .getInterpolator()
      .getWorldContext()
      .getWorld();

    const goInGv = this.currentWorldView
      .getGameView()
      .getLastState()
      .getGameObject();

    world.setGameObject(goInGv);

    const worldsJSON = this.assetsManager.getWorldsJSON();
    for (let index = 0; index < worldsJSON.length; index++) {
      const json = worldsJSON[index];
      if (json.uuid == world.getUUID()) {
        //found
        const newContent = world.toJSON();
        worldsJSON[index] = newContent;
        break;
      }
    }
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
      li.onclick = _this.onWorldJSON.bind(_this, w.uuid);
      list.appendChild(li);
    });
  }

  onWorldJSON(uuid) {
    this.closeCurrentView();
    let worldJSON = null;
    this.assetsManager.getWorldsJSON().forEach(function (w) {
      if (w.uuid == uuid) {
        worldJSON = w;
        return;
      }
    });

    this.currentWorldView = new WorldEditorView({
      parentUIHtml: this.ui,
      worldJSON: worldJSON,
      parentGameViewHtml: this.rootHtml,
      assetsManager: this.assetsManager,
      userData: { firstGameView: false },
      config: this.config,
    });

    const _this = this;
    this.currentWorldView.setOnClose(function () {
      _this.currentWorldView.dispose();
    });

    this.currentWorldUUID = worldJSON.uuid;
  }

  load() {
    const _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.assetsManager
          .loadFromConfig(_this.config.assetsManager, document.body)
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
