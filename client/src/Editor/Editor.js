/** @format */

import './Editor.css';
import { Game } from 'ud-viz';
import Constants from 'ud-viz/src/Game/Shared/Components/Constants';
import { WorldEditorView } from './WorldEditor/WorldEditor';
import { GameObject } from 'ud-viz/src/Game/Shared/Shared';
import LocalScriptModule from 'ud-viz/src/Game/Shared/GameObject/Components/LocalScript';
import WorldScriptModule from 'ud-viz/src/Game/Shared/GameObject/Components/WorldScript';
import { PlayWorldEditorView } from './PlayWorldEditor/PlayWorldEditor';

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

    //assets
    this.assetsManager = new Game.Components.AssetsManager();

    //gameview
    this.currentWorldView = null;
    this.currentPlayWorldView = null;
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
    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('button_Editor');
    this.closeButton.innerHTML = 'close';
    this.ui.appendChild(this.closeButton);

    const worldsList = document.createElement('ul');
    worldsList.classList.add('ul_Editor');
    this.ui.appendChild(worldsList);
    this.worldsList = worldsList;

    this.saveWorldsButton = document.createElement('div');
    this.saveWorldsButton.classList.add('button_Editor');
    this.saveWorldsButton.innerHTML = 'Save Worlds';
    this.ui.appendChild(this.saveWorldsButton);

    this.playCurrentWorldButton = document.createElement('div');
    this.playCurrentWorldButton.classList.add('button_Editor');
    this.playCurrentWorldButton.innerHTML = 'Play Current World';
    this.ui.appendChild(this.playCurrentWorldButton);
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }

  initCallbacks() {
    const _this = this;

    this.saveWorldsButton.onclick = function () {
      _this.saveCurrentWorld();

      //images upload
      const promises = [];
      const blobsBuffer = [];

      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');

      const computeImagePromise = function (conf, componentUUID, key) {
        if (conf[key].startsWith('data:image')) {
          const promise = new Promise((resolve, reject) => {
            //compute blob
            const img = new Image();
            img.onload = function () {
              c.width = this.naturalWidth; // update canvas size to match image
              c.height = this.naturalHeight;

              console.log('width ', c.width, ' height ', c.height);

              ctx.drawImage(this, 0, 0); // draw in image
              c.toBlob(
                function (blob) {
                  // get content as JPEG blob
                  // here the image is a blob
                  blobsBuffer.push({
                    blob: blob,
                    componentUUID: componentUUID,
                    key: key,
                  });
                  console.log('pack image ', conf);
                  resolve();
                },
                'image/jpeg',
                0.75
              );
            };
            img.crossOrigin = ''; // if from different origin
            img.src = conf[key];
            conf[key] = 'none'; //clear path
            img.onerror = reject;
          });
          promises.push(promise);
        }
      };

      const worldsJSON = _this.assetsManager.getWorldsJSON();
      worldsJSON.forEach(function (worldJSON) {
        const go = new GameObject(worldJSON.gameObject);
        go.traverse(function (child) {
          const ls = child.getComponent(LocalScriptModule.TYPE); //this way because assets are not initialized
          if (ls && ls.idScripts.includes('image')) {
            computeImagePromise(ls.getConf(), ls.getUUID(), 'path');
          }

          const ws = child.getComponent(WorldScriptModule.TYPE);
          if (ws && ws.idScripts.includes('map')) {
            computeImagePromise(ws.getConf(), ws.getUUID(), 'heightmap_path');
          }
        });
      });

      Promise.all(promises).then(function () {
        const data = {
          worlds: _this.assetsManager.getWorldsJSON(),
          images: blobsBuffer,
        };
        console.log('send data server ', data);
        _this.webSocketService.emit(
          Constants.WEBSOCKET.MSG_TYPES.SAVE_WORLDS,
          data
        );
      });
    };

    this.playCurrentWorldButton.onclick = function () {
      if (!_this.currentWorldView) return;
      _this.saveCurrentWorld();

      const worldUUID = _this.currentWorldView
        .getGameView()
        .getStateComputer()
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
        worldJSON: wJson,
        parentGameViewHtml: _this.rootHtml,
      });

      _this.currentPlayWorldView.setOnClose(function () {
        _this.currentPlayWorldView.dispose();
      });
    };
  }

  saveCurrentWorld() {
    if (!this.currentWorldView) return;

    //world loaded
    const world = this.currentWorldView
      .getGameView()
      .getStateComputer()
      .getWorldContext()
      .getWorld();

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
    this.closeCurrentView();

    this.currentWorldView = new WorldEditorView({
      parentUIHtml: this.ui,
      worldJSON: json,
      parentGameViewHtml: this.rootHtml,
      assetsManager: this.assetsManager,
      userData: { firstGameView: false },
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
