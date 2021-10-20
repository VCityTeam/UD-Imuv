const WorldDispatcher = require('./WorldDispatcher');
const ServiceWrapper = require('./ServiceWrapper');

const gm = require('gm');
const PNG = require('pngjs').PNG;

//http server
const express = require('express');

//io system
const fs = require('fs');

//websocket
const socketio = require('socket.io');

//user in game
const User = require('./User');

//Shared => TODO @ud-viz/core
const Shared = require('ud-viz/src/Game/Shared/Shared');
const AssetsManagerServer = require('./AssetsManagerServer');
const Pack = require('ud-viz/src/Game/Shared/Components/Pack');
const JSONUtils = require('ud-viz/src/Game/Shared/Components/JSONUtils');
const { WorldStateComputer } = require('ud-viz/src/Game/Shared/Shared');

const USERS_JSON_PATH = './assets/data/users.json';

//TODO need to handle save worlds + bbb

const ApplicationModule = class Application {
  constructor(config) {
    this.config = config;

    //express app
    this.expressApp = express();

    //third module (firebase)
    this.serviceWrapper = new ServiceWrapper(config);

    //world handling
    this.worldDispatcher = new WorldDispatcher(
      this.config.worldDispatcher,
      this.serviceWrapper //to handle bbb rooms with worlds
    );

    //assets worlds
    this.assetsManager = new AssetsManagerServer();

    //websocket
    this.io = null;
  }

  start() {
    const _this = this;

    this.assetsManager
      .loadFromConfig(this.config.assetsManager)
      .then(function () {
        _this.worldDispatcher.initWorlds().then(function () {
          const httpServer = _this.initExpress();
          _this.initWebSocket(httpServer);
        });
      });
  }

  initExpress() {
    console.log(this.constructor.name, 'init express');

    const defaultFolder = '../client';

    //serve the folder pass in config
    this.expressApp.use(
      express.static(this.config.ENV.FOLDER || defaultFolder)
    );

    //http server
    const port = this.config.ENV.PORT || 8000;
    const folder = this.config.ENV.FOLDER || defaultFolder;
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

  fetchUserDefaultExtraData(nameUser = 'default_name') {
    let avatarJSON = this.assetsManager.fetchPrefabJSON('avatar');
    avatarJSON.components.LocalScript.conf.name = nameUser;
    avatarJSON = new Shared.GameObject(avatarJSON).toJSON(true); //fill missing fields

    return {
      nameUser: nameUser,
      initialized: false,
      avatarJSON: avatarJSON,
    };
  }

  fetchUserExtraData(uuid) {
    return new Promise((resolve, reject) => {
      fs.readFile(USERS_JSON_PATH, 'utf8', (err, data) => {
        if (err) reject(err);

        if (!data) data = '{}';

        const usersJSON = JSON.parse(data);

        resolve(usersJSON[uuid]);
      });
    });
  }

  //TODO these informations should not be stock locally but inside a firebase db
  addUserInLocalJSON(nameUser, uuid) {
    const _this = this;

    return new Promise((resolve, reject) => {
      fs.readFile(USERS_JSON_PATH, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          reject();
        }
        const usersJSON = JSON.parse(data);
        usersJSON[uuid] = _this.fetchUserDefaultExtraData(nameUser);
        fs.writeFile(
          USERS_JSON_PATH,
          JSON.stringify(usersJSON),
          {
            encoding: 'utf8',
            flag: 'w',
            mode: 0o666,
          },
          resolve
        );
      });
    });
  }

  writeUsersJSON(json) {
    return new Promise((resolve, reject) => {
      fs.writeFile(
        USERS_JSON_PATH,
        JSON.stringify(json),
        {
          encoding: 'utf8',
          flag: 'w',
          mode: 0o666,
        },
        function (err) {
          if (err) reject();
          resolve();
        }
      );
    });
  }

  onSocketConnexion(socket) {
    const _this = this;

    const MSG_TYPES = Shared.Components.Constants.WEBSOCKET.MSG_TYPES;

    //SIGN UP
    socket.on(MSG_TYPES.SIGN_UP, function (data) {
      _this.serviceWrapper
        .createAccount(data)
        .then(function (userUUID) {
          _this.addUserInLocalJSON(data.nameUser, userUUID).then(function () {
            socket.emit(MSG_TYPES.SERVER_ALERT, 'Account created');
          });
        })
        .catch((error) => {
          socket.emit(MSG_TYPES.SERVER_ALERT, error.message);
        });
    });

    socket.on(MSG_TYPES.SIGN_IN, function (data) {
      _this.serviceWrapper
        .signIn(data)
        .then(function (userUUID) {
          //check if already connected in one world
          if (_this.worldDispatcher.fetchUserInWorldWithUUID(userUUID)) {
            socket.emit(MSG_TYPES.SERVER_ALERT, 'You are already connected');
          } else {
            //user is signed
            _this.fetchUserExtraData(userUUID).then(function (extraData) {
              if (!extraData) extraData = _this.fetchUserDefaultExtraData(); //robust
              console.log(extraData.nameUser + ' is connected');

              //inform client that he is connected and ready to game
              socket.emit(
                MSG_TYPES.SIGNED,
                extraData.initialized, //first or not connected
                false //is not guest
              );

              //wait for client to be ready
              socket.on(MSG_TYPES.READY_TO_RECEIVE_STATE, function () {
                const user = new User(userUUID, socket, extraData, false);
                _this.worldDispatcher.addUser(user);
              });
            });
          }
        })
        .catch((error) => {
          socket.emit(MSG_TYPES.SERVER_ALERT, error.message);
        });
    });

    socket.on(MSG_TYPES.GUEST_CONNECTION, function () {
      //inform client that he is ready to game
      socket.emit(
        MSG_TYPES.SIGNED,
        true, //considered not the first connexion
        true //is guest
      );

      //wait for client to be ready
      socket.on(MSG_TYPES.READY_TO_RECEIVE_STATE, function () {
        const user = _this.createGuestUser(socket);
        _this.worldDispatcher.addUser(user);
      });
    });

    socket.on(MSG_TYPES.SAVE_WORLDS, function (partialMessage) {
      const fullMessage = Pack.recomposeMessage(partialMessage);
      if (fullMessage) {
        _this.saveWorlds(fullMessage, socket);
      }
    });

    socket.on('disconnect', () => {
      console.log('socket', socket.id, 'disconnected');
      _this.worldDispatcher.removeUser(socket.id); //remove user with the socket uuid
    });
  }

  saveWorlds(data, socket) {
    console.log('Save Worlds');

    const MSG_TYPES = Shared.Components.Constants.WEBSOCKET.MSG_TYPES;

    const _this = this;
    const writeImagesOnDiskPromise = [];

    JSONUtils.parse(data, function (json, key) {
      if (typeof json[key] == 'string' && json[key].startsWith('data:image')) {
        writeImagesOnDiskPromise.push(
          new Promise((resolve, reject) => {
            const bitmap = Pack.dataUriToBuffer(json[key]);

            const commonPath =
              'assets/img/uploaded/' +
              Shared.THREE.MathUtils.generateUUID() +
              '.jpeg';
            const serverPath = '../client/' + commonPath;

            //ref path
            json[key] = './' + commonPath;

            fs.writeFile(serverPath, bitmap, function (err) {
              if (err) {
                reject();
              }
              resolve();
            });
          })
        );
      }
    });

    const worlds = [];
    data.forEach(function (json) {
      worlds.push(
        new Shared.World(json, {
          isServerSide: true,
          modules: { gm: gm, PNG: PNG },
        })
      );
    });

    Promise.all(writeImagesOnDiskPromise).then(function () {
      console.log('IMAGES WRITED ON DISK');

      const loadPromises = [];

      worlds.forEach(function (w) {
        const loadPromise = WorldStateComputer.WorldTest(
          w,
          _this.assetsManager,
          {
            Shared: Shared,
          }
        );
        loadPromises.push(loadPromise);
      });

      try {
        Promise.all(loadPromises).then(function () {
          console.log('ALL WORLD HAVE LOADED');

          //write on disks new worlds

          const content = [];
          worlds.forEach(function (w) {
            content.push(w.toJSON(true));
          });

          fs.writeFile(
            _this.config.worldDispatcher.worldsPath,
            JSON.stringify(content),
            {
              encoding: 'utf8',
              flag: 'w',
              mode: 0o666,
            },
            function () {
              console.log('WORLD WRITED ON DISK');

              //reload worlds
              _this.worldDispatcher.initWorlds();

              _this.cleanUnusedImages();

              socket.emit(MSG_TYPES.SERVER_ALERT, 'Worlds saved !');
            }
          );
        });
      } catch (e) {
        throw new Error(e);
      }
    });
  }

  cleanUnusedImages() {
    const folderPath = '../client/assets/img/uploaded/';

    fs.readFile(this.config.worldDispatcher.worldsPath, 'utf8', (err, data) => {
      if (err) throw new Error('cant load world ', err);

      fs.readdir(folderPath, (err, files) => {
        files.forEach((file) => {
          //check if ref by something in worlds
          if (!data.includes(file)) {
            //delete it
            // delete a file
            fs.unlink(folderPath + file, (err) => {
              if (err) {
                throw err;
              }

              console.log(folderPath + file + ' deleted.');
            });
          }
        });
      });
    });
  }

  createGuestUser(socket) {
    const nameUser = 'Guest';
    let avatarJSON = this.assetsManager.fetchPrefabJSON('avatar');
    avatarJSON.components.LocalScript.conf.name = nameUser;
    Shared.Render.bindColor(avatarJSON, [
      Math.random(),
      Math.random(),
      Math.random(),
    ]);
    avatarJSON = new Shared.GameObject(avatarJSON).toJSON(true); //fill missing fields

    const uuid = Shared.THREE.MathUtils.generateUUID();

    const extraData = {
      uuid: uuid,
      nameUser: nameUser,
      initialized: true,
      avatarJSON: avatarJSON,
    };

    return new User(uuid, socket, extraData, true);
  }
};

module.exports = ApplicationModule;
