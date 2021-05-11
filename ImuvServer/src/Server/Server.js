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
const Data = require('ud-viz/src/Game/Shared/Components/Data');
const firebase = require('firebase/app');
require('firebase/auth');

const fs = require('fs');

const ServerModule = class Server {
  constructor(config) {
    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: 'AIzaSyCKMd8dIyrDWjUxuLAps9Gix782nK9Bu_o',
      authDomain: 'imuv-da2d9.firebaseapp.com',
      projectId: 'imuv-da2d9',
      storageBucket: 'imuv-da2d9.appspot.com',
      messagingSenderId: '263590659720',
      appId: '1:263590659720:web:ae6f9ba09907c746ab813d',
      measurementId: 'G-RRJ79PGETS',
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('firebase initialized');

    //config
    this.config = config;

    //express app
    this.app;

    //http server
    this.server;

    //websocket
    this.io;

    //clients
    this.currentUsers = {};

    //worlds json
    this.worldsJSON = null;

    //map world to thread
    this.worldToThread = {};

    //manager
    this.assetsManager = new AssetsManagerServer();
  }

  initWorlds(worldsJSON) {
    //instanciate Worlds with config
    const _this = this;

    this.worldsJSON = worldsJSON;

    worldsJSON.forEach(function (worldJSON) {
      //create a worldThread
      const thread = new WorldThread(_this.config.thread.script);

      //post data to create world
      thread.post(WorldThread.MSG_TYPES.INIT, worldJSON); //thread post function will pack data

      //mapping between world and thread
      _this.worldToThread[worldJSON.uuid] = thread;

      //callbacks

      //worldstate
      thread.on(WorldThread.MSG_TYPES.WORLDSTATE, function (data) {
        const worldstateJSON = data;
        const users = _this.computeUsers(thread); //compute clients concerned
        users.forEach(function (user) {
          if (!worldstateJSON) throw new Error('no worldstateJSON');
          user.sendWorldState(worldstateJSON);
        });
      });

      //avatar portal
      thread.on(WorldThread.MSG_TYPES.AVATAR_PORTAL, function (data) {
        const avatarUUID = data.avatarUUID;
        const worldUUID = data.worldUUID;
        const portalUUID = data.portalUUID;
        _this.placeAvatarInWorld(avatarUUID, worldUUID, portalUUID);
      });
    });
  }

  placeAvatarInWorld(avatarUUID, worldUUID, portalUUID) {
    //find user with avatar uuid
    let user = null;
    for (let id in this.currentUsers) {
      const u = this.currentUsers[id];
      if (u.getAvatarID() == avatarUUID) {
        user = u;
        break;
      }
    }

    if (!user) throw new Error('no user with avatar id ', avatarUUID);

    const thread = this.worldToThread[worldUUID];

    if (!thread) throw new Error('no thread with world uuid ', worldUUID);

    user.initThread(thread);

    //add avatar in the new world
    const avatar = user.getAvatar();
    thread.post(WorldThread.MSG_TYPES.ADD_GAMEOBJECT, {
      gameObject: avatar.toJSON(true),
      portalUUID: portalUUID,
    });
  }

  findWorld(uuid) {
    for (let index = 0; index < this.worldsJSON.length; index++) {
      const element = this.worldsJSON[index];
      if (element.uuid == uuid) {
        return element;
      }
    }
    console.warn('no world with uuid ', uuid);
    return null;
  }

  computeUsers(thread) {
    let result = [];
    for (let idUser in this.currentUsers) {
      const u = this.currentUsers[idUser];
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
      _this.io.on('connection', _this.onConnection.bind(_this));
    });
  }

  load() {
    return this.assetsManager.loadFromConfig(this.config.assetsManager);
  }

  onConnection(socket) {
    const _this = this;

    socket.on(Data.WEBSOCKET.MSG_TYPES.SIGN_UP, function (data) {
      const nameUser = data.nameUser;
      const password = data.password;
      const email = data.email;

      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          const usersJSONPath = './assets/data/users.json';

          fs.readFile(usersJSONPath, 'utf8', (err, data) => {
            if (err) {
              reject();
            }
            const usersJSON = JSON.parse(data);
            console.log(user);
            const uuid = user.uid;

            //TODO password is sent via websocket wss not sure if this is safe
            //extra info on users are stocked here
            usersJSON[uuid] = {
              uuid: uuid,
              nameUser: nameUser,
            };

            socket.emit(
              Data.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
              'account created'
            );

            fs.writeFile(
              usersJSONPath,
              JSON.stringify(usersJSON),
              {
                encoding: 'utf8',
                flag: 'w',
                mode: 0o666,
              },
              function () {}
            );
          });
        })
        .catch((error) => {
          socket.emit(Data.WEBSOCKET.MSG_TYPES.SERVER_ALERT, error.message);
        });
    });

    socket.on(Data.WEBSOCKET.MSG_TYPES.SIGN_IN, function (data) {
      const password = data.password;
      const email = data.email;

      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          const usersJSONPath = './assets/data/users.json';

          fs.readFile(usersJSONPath, 'utf8', (err, data) => {
            if (err) {
              reject();
            }

            const usersJSON = JSON.parse(data);
            const extraData = usersJSON[user.uid];

            console.log(extraData.nameUser + ' is connected');

            //entry
            let uuidWorld = _this.config.entryWorld;
            if (!(uuidWorld && _this.worldToThread[uuidWorld] != undefined)) {
              uuidWorld = Object.keys(_this.worldToThread)[0];
            }

            //TODO create avatar menu
            const avatar = _this.assetsManager.fetchPrefab('avatar');
            extraData.avatar = avatar;

            const u = new User(user.uid, socket, uuidWorld, extraData);

            //register the client
            _this.currentUsers[u.getUUID()] = u;
            _this.placeAvatarInWorld(avatar.getUUID(), uuidWorld);

            socket.on('disconnect', () => {
              console.log('Unregister client => ', socket.id);
              const u = _this.currentUsers[u.getUUID()];
              delete _this.currentUsers[u.getUUID()];
              const thread = u.getThread();
              if (thread)
                thread.post(
                  WorldThread.MSG_TYPES.REMOVE_GAMEOBJECT,
                  u.getAvatarID()
                );
            });
          });
        })
        .catch((error) => {
          socket.emit(Data.WEBSOCKET.MSG_TYPES.SERVER_ALERT, error.message);
        });
    });
  }
};

module.exports = ServerModule;
