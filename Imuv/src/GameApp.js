/** @format */

import { Game, jquery } from 'ud-viz';

export class GameApp {
  constructor() {
    this.gameView = null;
    this.assetsManager = new Game.Components.AssetsManager();

    //DEBUG
    window.UDVDebugger = new Game.UDVDebugger(document.body);
  }

  start(path) {
    const _this = this;
    let clientConfig;
    this.loadConfigFile(path)
      .then(function (config) {
        clientConfig = config;
        return _this.assetsManager.loadFromConfig(clientConfig.assetsManager);
      })
      .then(function () {
        const webSocketService = new Game.Components.WebSocketService();
        webSocketService.connectToServer();

        _this.gameView = new Game.GameView({
          isLocal: false,
          assetsManager: _this.assetsManager,
          webSocketService: webSocketService,
          worldStateInterpolator: new Game.Components.WorldStateInterpolator(
            clientConfig.worldStateInterpolator
          ),
          config: clientConfig,
        });
        return _this.gameView.load();
      })
      .then(function () {
        document.body.appendChild(_this.gameView.html());
      });
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
