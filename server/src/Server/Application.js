/** @format */

const WorldDispatcher = require('./WorldDispatcher');
const BBBWrapper = require('./BBBWrapper');
const Parse = require('parse/node');

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

//Game require
const Game = require('ud-viz/src/Game/Game');
const AssetsManagerServer = require('./AssetsManagerServer');
const Pack = require('ud-viz/src/Game/Components/Pack');
const JSONUtils = require('ud-viz/src/Game/Components/JSONUtils');
const { WorldStateComputer } = require('ud-viz/src/Game/Game');
const exec = require('child-process-promise').exec;

/**
 * Main application of the UD-Imuv server
 * @param {JSON} config json file to configure the application see (./assets/config/config.json)
 */
const ApplicationModule = class Application {
  constructor(config) {
    this.config = config;

    //express app
    this.expressApp = express();

    //third module (firebase)
    this.bbbWrapper = new BBBWrapper(config);

    //parse
    Parse.serverURL = config.ENV.PARSE_SERVER_URL; // This is your Server URL
    // Remember to inform BOTH the Back4App Application ID AND the JavaScript KEY
    Parse.initialize(
      config.ENV.PARSE_APP_ID, // This is your Application ID
      config.ENV.PARSE_JAVASCRIPT_KEY, // This is your Javascript key
      config.ENV.PARSE_MASTER_KEY // This is your Master key (never use it in the frontend)
    );

    //world handling
    this.worldDispatcher = new WorldDispatcher(
      this.config.worldDispatcher,
      this.bbbWrapper //to handle bbb rooms with worlds
    );

    //assets worlds
    this.assetsManager = new AssetsManagerServer();

    //websocket
    this.io = null;
  }

  /**
   * Start the application
   */
  start() {
    const _this = this;

    this.assetsManager
      .loadFromConfig(this.config.assetsManager)
      .then(function () {
        _this.worldDispatcher.initWorlds();
        const httpServer = _this.initExpress();
        _this.initWebSocket(httpServer);
      });
  }

  /**
   * Start a http server using the node module express
   * @returns {HttpServer} the http server
   */
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

  /**
   * Initialize a websocket communication on a http server
   * @param {HttpServer} httpServer the http server to use
   */
  initWebSocket(httpServer) {
    //websocket
    this.io = socketio(httpServer, {
      pingInterval: this.config.websocket.pingInterval,
      pingTimeout: this.config.websocket.pingTimeout,
    });

    this.io.on('connection', this.onSocketConnexion.bind(this));
  }

  onSocketConnexion(socket) {
    const _this = this;

    const MSG_TYPES = Game.Components.Constants.WEBSOCKET.MSG_TYPES;

    //SIGN UP
    socket.on(MSG_TYPES.SIGN_UP, function (data) {
      (async () => {
        const user = new Parse.User();
        user.set('username', data.nameUser);
        user.set('email', data.email);
        user.set('password', data.password);

        try {
          let userResult = await user.signUp();

          socket.emit(MSG_TYPES.SERVER_ALERT, 'User signed up', userResult);
        } catch (error) {
          console.error(
            'Error while signing up user',
            error.code,
            error.message
          );

          socket.emit(MSG_TYPES.SERVER_ALERT, error.message);
        }
      })();
    });

    socket.on(MSG_TYPES.SIGN_IN, function (data) {
      (async () => {
        try {
          // Pass the username and password to logIn function
          let user = await Parse.User.logIn(data.nameUser, data.password);

          // Do stuff after successful login
          const nameUser = await user.get('username');
          const uuid = await user.get('objectId');

          if (_this.worldDispatcher.fetchUserInWorldWithUUID(uuid)) {
            socket.emit(MSG_TYPES.SERVER_ALERT, 'You are already in game');
          } else {
            //inform client that he is ready to game
            socket.emit(
              MSG_TYPES.SIGNED,
              true, //considered not the first connexion
              false //is guest
            );

            //wait for client to be ready
            socket.on(MSG_TYPES.READY_TO_RECEIVE_STATE, function () {
              const user = _this.createUser(socket, nameUser, uuid);
              _this.worldDispatcher.addUser(user);
            });
          }
        } catch (error) {
          console.error('Error while logging in user', error);
          socket.emit(MSG_TYPES.SERVER_ALERT, error.message);
        }
      })();
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
        const user = _this.createUser(
          socket,
          'Guest',
          Game.THREE.MathUtils.generateUUID()
        );
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

    const MSG_TYPES = Game.Components.Constants.WEBSOCKET.MSG_TYPES;

    const _this = this;
    const writeImagesOnDiskPromise = [];

    JSONUtils.parse(data, function (json, key) {
      if (typeof json[key] == 'string' && json[key].startsWith('data:image')) {
        writeImagesOnDiskPromise.push(
          new Promise((resolve, reject) => {
            const bitmap = Pack.dataUriToBuffer(json[key]);

            const commonPath =
              'assets/img/uploaded/' +
              Game.THREE.MathUtils.generateUUID() +
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
        new Game.World(json, {
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
            Game: Game,
          }
        );
        loadPromises.push(loadPromise);
      });

      try {
        Promise.all(loadPromises).then(function () {
          console.log('ALL WORLD HAVE LOADED');

          //write on disks new worlds
          const indexWorldsJSON = JSON.parse(
            fs.readFileSync(
              _this.config.worldDispatcher.worldsFolder + 'index.json'
            )
          );

          const fetchWorldContent = function (uuid) {
            for (let index = 0; index < worlds.length; index++) {
              const element = worlds[index];
              if (element.getUUID() == uuid)
                return JSON.stringify(element.toJSON(true));
            }
            throw new Error('cant find world');
          };

          for (let uuid in indexWorldsJSON) {
            const path =
              _this.config.worldDispatcher.worldsFolder + indexWorldsJSON[uuid];
            fs.writeFileSync(path, fetchWorldContent(uuid));
          }

          //prettier
          exec(
            'npx prettier --single-quote --write ../client/assets/worlds'
          ).then(function () {
            //reload worlds
            _this.worldDispatcher.initWorlds();
            socket.emit(MSG_TYPES.SERVER_ALERT, 'Worlds saved and reloaded !');
            _this.cleanUnusedImages();
          });
        });
      } catch (e) {
        throw new Error(e);
      }
    });
  }

  cleanUnusedImages() {
    const folderPath = '../client/assets/img/uploaded/';

    const indexWorldsJSON = JSON.parse(
      fs.readFileSync(this.config.worldDispatcher.worldsFolder + 'index.json')
    );

    let data = '';

    for (let uuid in indexWorldsJSON) {
      const path =
        this.config.worldDispatcher.worldsFolder + indexWorldsJSON[uuid];
      data += fs.readFileSync(path);
    }

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
  }

  createUser(socket, nameUser, uuid) {
    let avatarJSON = this.assetsManager.createAvatarJSON();
    avatarJSON.components.LocalScript.conf.name = nameUser;
    Game.Render.bindColor(avatarJSON, [
      Math.random(),
      Math.random(),
      Math.random(),
    ]);
    avatarJSON = new Game.GameObject(avatarJSON).toJSON(true); //fill missing fields

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
