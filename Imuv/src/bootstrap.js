/** @format */

import { Game } from 'ud-viz';
const jquery = require('jquery');

const AppModule = class App {
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
        _this.gameView = new Game.GameView({
          isLocal: false,
          assetsManager: _this.assetsManager,
          webSocketService: new Game.Components.WebSocketService(),
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
};

const app = new AppModule();
app.start('./assets/config/config.json');
