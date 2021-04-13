/**
 * Handle a UDV Server
 *
 * @format
 */
const express = require('express');
const socketio = require('socket.io');
const WorldThread = require('./WorldThread');
const User = require('./User');
const AssetsManagerServer = require('./AssetsManagerServer');

const ServerModule = class Server {
  constructor(config) {
    //config
    this.config = config;

    //express app
    this.app;

    //http server
    this.server;

    //websocket
    this.io;

    //clients
    this.users = {};

    //map world to thread
    this.worldToThread = {};

    //manager
    this.assetsManager = new AssetsManagerServer();
  }

  initWorlds(worldsJSON) {
    //instanciate Worlds with config
    const _this = this;
    worldsJSON.forEach(function (worldJSON) {
      //create a worldThread
      const thread = new WorldThread(_this.config.thread.script);

      //post data to create world
      thread.post(WorldThread.MSG_TYPES.INIT, worldJSON); //thread post function will pack data

      //mapping between world and thread
      _this.worldToThread[worldJSON.uuid] = thread;

      thread.on(WorldThread.MSG_TYPES.WORLDSTATE, function (data) {
        const worldstateJSON = data;

        const users = _this.computeUsers(thread); //compute clients concerned
        users.forEach(function (user) {
          if (!worldstateJSON) throw new Error('no worldstateJSON');
          user.sendWorldState(worldstateJSON);
        });
      });
    });
  }

  computeUsers(thread) {
    var result = [];
    for (var idUser in this.users) {
      const u = this.users[idUser];
      if (u.getThread() == thread) result.push(u);
    }
    return result;
  }

  //create app express and listen to config.PORT
  start() {
    const _this = this;

    this.load().then(function () {

      //express
      _this.app = express();
      //serve
      _this.app.use(express.static(_this.config.folder)); //what folder is served

      //http server
      const port = _this.config.port;
      const folder = _this.config.folder;
      _this.server = _this.app.listen(port, function (err) {
        if (err) console.log('Error in server setup');
        console.log('Server listening on Port', port, ' folder ' + folder);
      });

      //websocket
      _this.io = socketio(_this.server);

      //cb
      _this.initCallback();
    });
  }

  load() {
    return this.assetsManager.loadFromConfig(this.config.assetsManager);
  }

  initCallback() {
    //server callbacks
    this.io.on('connection', this.registerClient.bind(this));
  }

  registerClient(socket) {
    //entry
    let uuidWorld = this.config.entryWorld;
    if (!(uuidWorld && this.worldToThread[uuidWorld] != undefined)) {
      uuidWorld = Object.keys(this.worldToThread)[0];
    }

    console.log('Register client => ', socket.id);

    //register the client
    const thread = this.worldToThread[uuidWorld];
    const avatar = this.assetsManager.fetchPrefab('avatar');
    const user = new User(socket, uuidWorld, avatar.getUUID(), thread);
    this.users[user.getUUID()] = user;
    thread.post(WorldThread.MSG_TYPES.ADD_GAMEOBJECT, avatar.toJSON(true));

    const _this = this;
    socket.on('disconnect', () => {
      console.log('Unregister client => ', socket.id);
      thread.post(WorldThread.MSG_TYPES.REMOVE_GAMEOBJECT, user.getAvatarID());
      delete _this.users[user.getUUID()];
    });
  }
};

module.exports = ServerModule;
