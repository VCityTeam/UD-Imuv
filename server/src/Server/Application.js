const WorldDispatcher = require('./WorldDispatcher');
const ServiceWrapper = require('./ServiceWrapper');

//http server
const express = require('express');

//websocket
const socketio = require('socket.io');

//Shared => TODO @ud-viz/core
const Shared = require('ud-viz/src/Game/Shared/Shared');
const AssetsManagerServer = require('./AssetsManagerServer');

const ApplicationModule = class Application {
  constructor(config) {
    this.config = config;

    //express app
    this.expressApp = express();

    //world handling
    this.worldDispatcher = new WorldDispatcher(this.config.worldDispatcher);

    //assets worlds
    this.assetsManager = new AssetsManagerServer();

    //third module (firebase)
    this.serviceWrapper = new ServiceWrapper();

    //websocket
    this.io = null;
  }

  start() {
    const _this = this;

    this.assetsManager
      .loadFromConfig(this.config.assetsManager)
      .then(function () {
        const httpServer = _this.initExpress();
        _this.initWebSocket(httpServer);
        _this.worldDispatcher.initWorlds();
      });
  }

  initExpress() {
    console.log(this.constructor.name, 'init express');

    //serve the folder pass in config
    this.expressApp.use(express.static(this.config.folder));

    //http server
    const port = this.config.port;
    const folder = this.config.folder;
    const httpServer = this.expressApp.listen(port, function (err) {
      if (err) console.log('Error in server setup');
      console.log('HTTP server on Port', port, 'folder ' + folder);
    });

    return httpServer;
  }

  initWebSocket(httpServer) {
    //websocket
    this.io = socketio(httpServer, {
      pingInterval: 25000, //TODO debug values pass this with config
      pingTimeout: 20000,
    });

    this.io.on('connection', this.onSocketConnexion.bind(this));
  }

  onSocketConnexion(socket) {
    const _this = this;

    const MSG_TYPES = Shared.Components.Constants.WEBSOCKET.MSG_TYPES;

    //SIGN UP
    socket.on(MSG_TYPES.SIGN_UP, function (data) {
      _this.serviceWrapper
        .createAccount(data, _this.assetsManager)
        .then(function () {
          socket.emit(
            Shared.Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
            'Account created'
          );
        })
        .catch((error) => {
          socket.emit(MSG_TYPES.SERVER_ALERT, error.message);
        });
    });
  }
};

module.exports = ApplicationModule;
