/** @format */

import { Game, jquery } from 'ud-viz';

export class GameApp {
  constructor(webSocketService) {
    this.gameView = null;
    this.assetsManager = new Game.Components.AssetsManager();

    this.webSocketService = webSocketService;

    //DEBUG
    window.UDVDebugger = new Game.UDVDebugger(document.body);
  }

  start(path, onLoad) {
    const _this = this;
    let clientConfig;
    this.loadConfigFile(path)
      .then(function (config) {
        clientConfig = config;
        return _this.assetsManager.loadFromConfig(clientConfig.assetsManager);
      })
      .then(function () {
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
