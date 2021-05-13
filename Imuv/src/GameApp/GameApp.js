/** @format */

import { Game, jquery } from 'ud-viz';

import './GameApp.css';

export class GameApp {
  constructor(webSocketService) {
    this.gameView = null;
    this.assetsManager = new Game.Components.AssetsManager();

    this.webSocketService = webSocketService;

    //DEBUG
    // window.UDVDebugger = new Game.UDVDebugger(document.body);
  }

  createLoadingView() {
    const result = document.createElement('div');
    result.classList.add('loading_GameApp');

    const parent = document.createElement('div');
    parent.classList.add('loadingParent_GameApp');

    const loadingImg = document.createElement('img');
    loadingImg.classList.add('loadingImg_GameApp');
    loadingImg.src = './assets/img/loading.png';

    const label = document.createElement('div');
    label.innerHTML = 'Please wait...';

    parent.appendChild(loadingImg);
    parent.appendChild(label);

    result.appendChild(parent);

    return result;
  }

  start(path, onLoad) {
    const _this = this;
    let clientConfig;

    const loadingView = this.createLoadingView();
    document.body.appendChild(loadingView);

    this.loadConfigFile(path)
      .then(function (config) {
        clientConfig = config;
        return _this.assetsManager.loadFromConfig(clientConfig.assetsManager);
      })
      .then(function () {
        loadingView.remove();

        _this.gameView = new Game.GameView({
          isLocal: false,
          assetsManager: _this.assetsManager,
          webSocketService: _this.webSocketService,
          worldStateInterpolator: new Game.Components.WorldStateInterpolator(
            clientConfig.worldStateInterpolator
          ),
          config: clientConfig,
        });
        return _this.gameView.load();
      })
      .then(onLoad);
  }

  loadConfigFile(filePath) {
    return new Promise((resolve, reject) => {
      jquery.ajax({
        type: 'GET',
        url: filePath,
        datatype: 'json',
        success: (data) => {
          resolve(data);
        },
        error: (e) => {
          console.error(e);
          reject();
        },
      });
    });
  }
}
