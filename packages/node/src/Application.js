/** @format */

import { Constant } from '@ud-imuv/shared';

const WorldDispatcher = require('./WorldDispatcher');
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
const WorldThreadModule = require('./WorldThread');
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

    //parse
    // eslint-disable-next-line no-undef
    Parse.serverURL = PARSE_SERVER_URL; // This is your Server URL
    Parse.initialize(
      // eslint-disable-next-line no-undef
      PARSE_APP_ID, // This is your Application ID
      null, // Javascript Key is not required with a self-hosted Parse Server
      // eslint-disable-next-line no-undef
      PARSE_MASTER_KEY // This is your Master key (never use it in the frontend)
    );

    //world handling
    this.worldDispatcher = new WorldDispatcher(this.config.worldDispatcher);

    //assets worlds
    this.assetsManager = new AssetsManagerServer();

    //websocket
    this.io = null;

    //users in app id socket id
    this.users = {};
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

    const clientFolder = '../client';

    //serve the folder pass in config
    this.expressApp.use(express.static(clientFolder));

    //http server
    const port = this.config.port || 8000;
    const httpServer = this.expressApp.listen(port, function (err) {
      if (err) console.log('Error in server setup');
      console.log('HTTP server on Port', port, 'folder ' + clientFolder);
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

    const MSG_TYPES = Constant.WEBSOCKET.MSG_TYPES;

    //REGISTER in app
    const u = (this.users[socket.id] = this.createUser(
      socket,
      'Guest@' + parseInt(Math.random() * 10000),
      Game.THREE.MathUtils.generateUUID(),
      Constant.USER.ROLE.GUEST
    ));
    socket.emit(MSG_TYPES.SIGNED, {
      nameUser: u.getNameUser(),
      role: u.getRole(),
    });

    //SIGN UP
    socket.on(MSG_TYPES.SIGN_UP, function (data) {
      (async () => {
        const user = new Parse.User();
        user.set(Constant.DB.USER.NAME, data.nameUser);
        user.set(Constant.DB.USER.EMAIL, data.email);
        user.set(Constant.DB.USER.PASSWORD, data.password);
        user.set(Constant.DB.USER.ROLE, Constant.USER.ROLE.DEFAULT);

        try {
          await user.signUp();
          socket.emit(MSG_TYPES.SIGN_UP_SUCCESS);
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

    //SIGN IN
    socket.on(MSG_TYPES.SIGN_IN, function (data) {
      (async () => {
        try {
          // Pass the username and password to logIn function
          const parseUser = await Parse.User.logIn(
            data.nameUser,
            data.password
          );

          const dbUUID = parseUser.id;

          let found = false;
          for (const id in _this.users) {
            const other = _this.users[id];
            if (other.getUUID() == dbUUID) {
              found = true;
              break;
            }
          }

          if (found) throw new Error('already sign in ' + dbUUID);

          // Do stuff after successful login
          const nameUser = await parseUser.get(Constant.DB.USER.NAME);
          const role = await parseUser.get(Constant.DB.USER.ROLE);
          const avatarString = await parseUser.get(
            Constant.DB.USER.AVATAR
          );
          const settingsString = await parseUser.get(
            Constant.DB.USER.SETTINGS
          );

          const u = _this.users[socket.id];
          u.setRole(role);
          u.setNameUser(nameUser);
          u.setParseUser(parseUser);

          if (settingsString) {
            u.setSettingsJSON(JSON.parse(settingsString));
          }

          // console.log(avatarString)
          if (avatarString) {
            const jsonDB = JSON.parse(avatarString);
            const avatarJSON = _this.assetsManager.fetchPrefabJSON('avatar');
            //color
            avatarJSON.components.Render.color = jsonDB.components.Render.color;
            //avatar id
            avatarJSON.components.Render.idRenderData =
              jsonDB.components.Render.idRenderData;
            //path texture face
            avatarJSON.components.LocalScript.conf.path_face_texture =
              jsonDB.components.LocalScript.conf.path_face_texture;
            //name
            avatarJSON.components.LocalScript.conf.name =
              jsonDB.components.LocalScript.conf.name;
            u.setAvatarJSON(new Game.GameObject(avatarJSON).toJSON(true));
          }

          u.setUUID(dbUUID);

          //inform client of role + nameuser (security on role is handle server side)
          socket.emit(MSG_TYPES.SIGNED, { nameUser: nameUser, role: role });
        } catch (error) {
          console.error('Error while logging in user', error);
          socket.emit(MSG_TYPES.SERVER_ALERT, error.message);
        }
      })();
    });

    //URL PARAMETER

    //READY TO RECEIVE STATE
    socket.on(MSG_TYPES.READY_TO_RECEIVE_STATE, function (data) {
      //check if not already in world
      const user = _this.users[socket.id];

      //check if data are valid
      if (
        data &&
        data.position instanceof Array &&
        data.rotation instanceof Array &&
        data.worldUUID
      ) {
        //data have all fields require
        if (
          !Pack.checkIfSubStringIsVector3(data.position) ||
          !Pack.checkIfSubStringIsEuler(data.rotation) ||
          !_this.worldDispatcher.hasWorld(data.worldUUID)
        ) {
          //data are not valid
          data = null;
        }
      } else {
        //not well formated
        data = null;
      }

      _this.worldDispatcher.addUser(user, data);
    });

    //SAVE WORLDS
    socket.on(MSG_TYPES.SAVE_WORLDS, function (partialMessage) {
      const user = _this.users[socket.id];
      if (user.getRole() != Constant.USER.ROLE.ADMIN) return; //security

      const fullMessage = Pack.recomposeMessage(partialMessage);
      if (fullMessage) {
        _this.saveWorlds(fullMessage, socket);
      }
    });

    //Avatar json
    socket.on(MSG_TYPES.QUERY_AVATAR, function () {
      const user = _this.users[socket.id];
      if (user.getRole() == Constant.USER.ROLE.GUEST) return; //security

      try {
        const response = user.getAvatarJSON();
        if (!response) throw new Error('no avatar json ', user);
        socket.emit(MSG_TYPES.ON_AVATAR, response);
      } catch (e) {
        console.error(e);
      }
    });

    //save avatar
    socket.on(MSG_TYPES.SAVE_AVATAR, function (partialMessage) {
      try {
        const fullMessage = Pack.recomposeMessage(partialMessage);
        if (fullMessage) {
          const user = _this.users[socket.id];
          _this.saveAvatar(user, fullMessage);
        }
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('disconnect', () => {
      console.log('socket', socket.id, 'disconnected');
      const user = _this.users[socket.id];
      delete _this.users[socket.id]; //remove
      _this.worldDispatcher.removeUser(user); //remove user with the socket uuid
    });
  }

  saveAvatar(user, avatarJSON) {
    //write image on disk
    new Promise((resolve, reject) => {
      try {
        const bitmap = Pack.dataUriToBuffer(
          avatarJSON.components.LocalScript.conf.path_face_texture
        );

        if (bitmap) {
          //there is an image
          const commonPath =
            'assets/img/avatar/' +
            Game.THREE.MathUtils.generateUUID() +
            '.jpeg';
          const serverPath = '../client/' + commonPath;

          fs.writeFile(serverPath, bitmap, function (err) {
            if (err) {
              reject();
            }
            resolve();
          });

          //ref path
          avatarJSON.components.LocalScript.conf.path_face_texture =
            './' + commonPath;
        }
      } catch (e) {
        console.error(e);
        reject();
      }
    })
      .then(
        (async () => {
          //avatarJSON is ready to be write to db
          const parseUser = user.getParseUser();
          parseUser.set(
            Constant.DB.USER.AVATAR,
            JSON.stringify(avatarJSON)
          );
          try {
            // Saves the user with the updated data
            const response = await parseUser.save(null, { useMasterKey: true });
            console.log('Updated user', response);

            //write in user json
            user.setAvatarJSON(avatarJSON);

            //replace avatar in game
            user
              .getThread()
              .post(WorldThreadModule.MSG_TYPES.EDIT_AVATAR_RENDER, {
                avatarUUID: avatarJSON.uuid,
                color: avatarJSON.components.Render.color,
                idRenderData: avatarJSON.components.Render.idRenderData,
                path_face_texture:
                  avatarJSON.components.LocalScript.conf.path_face_texture,
              });

            //clear unused images
            const User = new Parse.User();
            const query = new Parse.Query(User);
            try {
              const results = await query.distinct(
                Constant.DB.USER.AVATAR
              );
              const paths = [];
              results.forEach(function (string) {
                const json = JSON.parse(string);
                const path = json.components.LocalScript.conf.path_face_texture;
                if (!paths.includes(path)) paths.push(path);
              });

              const checkRef = function (fileName) {
                //do not delete the default image
                if (fileName.includes('default.jpeg')) return true;

                for (let index = 0; index < paths.length; index++) {
                  const element = paths[index];
                  if (element.includes(fileName)) return true;
                }

                return false;
              };

              //all path in use are stored in paths
              const folderPath = '../client/assets/img/avatar/';
              fs.readdir(folderPath, (err, files) => {
                if (!files) return;

                files.forEach((file) => {
                  //check if ref by something in paths
                  if (!checkRef(file)) {
                    //delete it
                    fs.unlink(folderPath + file, (err) => {
                      if (err) {
                        throw err;
                      }

                      console.log(folderPath + file + ' deleted.');
                    });
                  }
                });
              });
            } catch (e) {
              console.error(e);
            }
          } catch (error) {
            console.error('Error while updating user', error);
          }
        })()
      )
      .catch((e) => {
        console.error(e);
      });
  }

  saveWorlds(data, socket) {
    console.log('Save Worlds');

    const MSG_TYPES = Constant.WEBSOCKET.MSG_TYPES;

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

          for (const uuid in indexWorldsJSON) {
            const path =
              _this.config.worldDispatcher.worldsFolder + indexWorldsJSON[uuid];
            fs.writeFileSync(path, fetchWorldContent(uuid));
          }

          //prettier
          exec('npm run format-worlds').then(function () {
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

    for (const uuid in indexWorldsJSON) {
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

  createUser(socket, nameUser, uuid, role, avatarJSON) {
    if (!avatarJSON) {
      //create avatar json
      avatarJSON = this.assetsManager.createAvatarJSON();
      avatarJSON.components.LocalScript.conf.name = nameUser;
      Game.Render.bindColor(avatarJSON, [
        Math.random(),
        Math.random(),
        Math.random(),
      ]);
    }
    avatarJSON = new Game.GameObject(avatarJSON).toJSON(true); //fill missing fields

    return new User(uuid, socket, avatarJSON, role, nameUser);
  }
};

module.exports = ApplicationModule;
