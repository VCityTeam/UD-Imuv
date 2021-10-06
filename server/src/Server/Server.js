/**
 * udviz game server
 *
 * @format
 */

const cors = require('cors');
const gm = require('gm');
const PNG = require('pngjs').PNG;
const express = require('express');
const socketio = require('socket.io');
const WorldThread = require('./WorldThread');
const User = require('./User');
const AssetsManagerServer = require('./AssetsManagerServer');
const Constants = require('ud-viz/src/Game/Shared/Components/Constants');
const firebase = require('firebase/app');
require('firebase/auth');

const fs = require('fs');
const Shared = require('ud-viz/src/Game/Shared/Shared');
const {
  GameObject,
  WorldStateComputer,
  World,
} = require('ud-viz/src/Game/Shared/Shared');
const RenderModule = require('ud-viz/src/Game/Shared/GameObject/Components/Render');

const Buffer = require('buffer').Buffer;

const bbb = require('bigbluebutton-js');

const parseString = require('xml2js').parseString;
const exec = require('child-process-promise').exec;
const Pack = require('ud-viz/src/Game/Shared/Components/Pack');

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
    this.currentUsersInGame = {};

    //worlds json
    this.worldsJSON = null;

    //map world to thread
    this.worldToThread = {};

    //manager
    this.assetsManager = new AssetsManagerServer();

    //bbb
    this.bbbAPI = null;
    this.bbbRooms = {};

    this.initWorlds();
  }

  initBBB(bbbUrl, bbbSecret) {
    console.log('Try to init BBB with ', bbbUrl, bbbSecret);

    this.bbbAPI = bbb.api(bbbUrl, bbbSecret);

    if (!this.bbbAPI) {
      console.warn('no bbb api');
      return;
    } else {
      console.log('bbb initialized');
    }

    const api = this.bbbAPI;

    //clean all meetings running
    const meetingsURL = this.bbbAPI.monitoring.getMeetings();
    const pathTempXML = './assets/temp/bbb_data.xml';
    exec('wget ' + meetingsURL + ' -O ' + pathTempXML).then(function () {
      fs.readFile(pathTempXML, 'utf-8', function (err, data) {
        if (err) {
          throw new Error(err);
        }

        parseString(data, function (errParser, jsData) {
          if (errParser) {
            throw new Error(errParser);
          }

          if (!jsData.response) throw new Error('no response');

          if (jsData.response.returncode[0] != 'SUCCESS')
            throw new Error('response status is not SUCCESS');

          if (
            jsData.response.messageKey &&
            jsData.response.messageKey[0] == 'noMeetings'
          ) {
            console.warn('no bbb meetings running');
            return;
          }

          const meetings = jsData.response.meetings;
          meetings[0].meeting.forEach(function (m) {
            api.administration.end(m.meetingID[0], m.moderatorPW[0]);
            console.log('end bbb meeting ', m.meetingID[0]);
          });
        });
      });
    });
  }

  createBBBRoom(params) {
    if (!this.bbbAPI) {
      console.warn('cant create room because no bbb api');
      return;
    }
    const room = new BBB_ROOM(params, this.bbbAPI);
    this.bbbRooms[room.getUUID()] = room;
    console.warn('create bbb room ', params.name);
    return room.createRoom();
  }

  initWorlds() {
    console.log('Initialize worlds');

    //instanciate Worlds with config
    const _this = this;

    //clean
    for (let key in this.worldToThread) {
      const thread = this.worldToThread[key];
      thread.stop();
      delete this.worldToThread[key];
    }

    fs.readFile(this.config.worldsPath, 'utf8', (err, data) => {
      if (err) throw new Error('cant load world ', err);

      const worldsJSON = JSON.parse(data);

      _this.worldsJSON = worldsJSON;

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
          _this.placeAvatarInWorld(
            data.avatarUUID,
            data.worldUUID,
            data.portalUUID
          );
        });
      });
    });
  }

  placeAvatarInWorld(avatarUUID, worldUUID, portalUUID) {
    //find user with avatar uuid
    let user = null;
    for (let id in this.currentUsersInGame) {
      const u = this.currentUsersInGame[id];
      if (u.getAvatarID() == avatarUUID) {
        user = u;
        break;
      }
    }

    if (!user)
      throw new Error(
        'no user with avatar id ',
        avatarUUID,
        ' in ',
        this.currentUsersInGame
      );

    const thread = this.worldToThread[worldUUID];

    if (!thread)
      throw new Error(
        'no thread with world uuid ',
        worldUUID,
        this.worldToThread
      );

    user.initThread(thread);

    //add avatar in the new world
    thread.post(WorldThread.MSG_TYPES.ADD_GAMEOBJECT, {
      gameObject: user.getAvatarJSON(),
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
    for (let idUser in this.currentUsersInGame) {
      const u = this.currentUsersInGame[idUser];
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

      _this.app.use(
        cors({
          methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
          origin: '*',
          allowedHeaders: true,
        })
      );

      _this.app.options('*', cors()); // include before other routes

      // _this.app.use(cors());

      _this.app.get('/products/:id', function (req, res) {
        res.json({ msg: 'This is CORS-enabled for all origins!' });
      });

      //http server
      const port = _this.config.port;
      const folder = _this.config.folder;
      _this.server = _this.app.listen(port, function (err) {
        if (err) console.log('Error in server setup');
        console.log('Server listening on Port', port, ' folder ' + folder);
      });

      //websocket
      _this.io = socketio(_this.server, {
        pingInterval: 25000,
        pingTimeout: 20000,
        transports: ['polling', 'websocket'],
      });

      //cb
      _this.io.on('connection', _this.onConnection.bind(_this));
    });
  }

  load() {
    return this.assetsManager.loadFromConfig(this.config.assetsManager);
  }

  fetchUserDefaultExtraData(nameUser = 'default_name') {
    let avatarJSON = this.assetsManager.fetchPrefabJSON('avatar');
    avatarJSON.components.LocalScript.conf.name = nameUser;
    avatarJSON = new GameObject(avatarJSON).toJSON(true); //fill missing fields

    return {
      nameUser: nameUser,
      initialized: false,
      avatarJSON: avatarJSON,
    };
  }

  onConnection(socket) {
    const _this = this;

    socket.on(Constants.WEBSOCKET.MSG_TYPES.SIGN_UP, function (data) {
      const nameUser = data.nameUser;
      const password = data.password;
      const email = data.email;

      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log(nameUser, ' is sign up');

          const user = userCredential.user;

          user
            .sendEmailVerification()
            .then(function () {
              // Email sent.
            })
            .catch(function (error) {
              // An error happened.
              console.error(error);
            });

          const usersJSONPath = './assets/data/users.json';

          fs.readFile(usersJSONPath, 'utf8', (err, data) => {
            if (err) {
              console.error(err);
            }
            const usersJSON = JSON.parse(data);
            const uuid = user.uid;
            usersJSON[uuid] = _this.fetchUserDefaultExtraData(nameUser);

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

          socket.emit(
            Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
            'account created'
          );
        })
        .catch((error) => {
          socket.emit(
            Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
            error.message
          );
        });
    });

    socket.on(Constants.WEBSOCKET.MSG_TYPES.SIGN_IN, function (data) {
      const password = data.password;
      const email = data.email;

      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;

          //check if this user is already connected
          if (_this.currentUsersInGame[user.uid]) {
            socket.emit(
              Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
              'You are already connected'
            );
            return;
          }

          if (user.emailVerified) {
            const usersJSONPath = './assets/data/users.json';

            fs.readFile(usersJSONPath, 'utf8', (err, data) => {
              if (err) {
                console.error(err);
              }

              //robust
              if (!data) data = '{}';

              const usersJSON = JSON.parse(data);

              if (!usersJSON[user.uid]) {
                usersJSON[user.uid] = _this.fetchUserDefaultExtraData();
              }

              const extraData = usersJSON[user.uid];

              console.log(extraData.nameUser + ' is connected');

              //entry
              let uuidWorld = _this.config.entryWorld;
              if (!(uuidWorld && _this.worldToThread[uuidWorld] != undefined)) {
                uuidWorld = Object.keys(_this.worldToThread)[0];
              }

              const u = new User(user.uid, socket, uuidWorld, extraData);

              //register the client
              _this.currentUsersInGame[u.getUUID()] = u;

              //inform client that he is connected and ready to game
              socket.emit(
                Constants.WEBSOCKET.MSG_TYPES.SIGNED,
                extraData.initialized,
                false
              );

              extraData.initialized = true;

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

              //wait for client to be ready
              socket.on(
                Constants.WEBSOCKET.MSG_TYPES.READY_TO_RECEIVE_STATE,
                function () {
                  _this.placeAvatarInWorld(u.getAvatar().getUUID(), uuidWorld);
                }
              );

              socket.on(
                Constants.WEBSOCKET.MSG_TYPES.QUERY_AVATAR_GO,
                function () {
                  socket.emit(
                    Constants.WEBSOCKET.MSG_TYPES.ON_AVATAR_GO,
                    new GameObject(u.getAvatarJSON()).toJSON() //to filter only component local
                  );
                }
              );

              socket.on(
                Constants.WEBSOCKET.MSG_TYPES.SAVE_AVATAR_GO,
                function (avatarJSON) {
                  //modify json
                  const originalJSON = u.getAvatarJSON();
                  Shared.Components.JSONUtils.overWrite(
                    originalJSON,
                    avatarJSON
                  );

                  //write in user
                  u.setAvatarJSON(originalJSON);

                  //write as well in usersJSON
                  fs.readFile(usersJSONPath, 'utf8', (err, data) => {
                    if (err) {
                      console.error(err);
                    }

                    const usersJSON = JSON.parse(data);
                    const extraData = usersJSON[user.uid];
                    extraData.avatarJSON = originalJSON;

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

                  //update avatar in world
                  const thread = u.getThread();
                  if (thread) {
                    thread.post(
                      WorldThread.MSG_TYPES.QUERY_GAMEOBJECT,
                      u.getAvatarID()
                    );

                    thread.on(
                      WorldThread.MSG_TYPES.GAMEOBJECT_RESPONSE,
                      function (data) {
                        const currentAvatarJSON = data;
                        thread.post(
                          WorldThread.MSG_TYPES.REMOVE_GAMEOBJECT,
                          u.getAvatarID()
                        );

                        thread.post(WorldThread.MSG_TYPES.ADD_GAMEOBJECT, {
                          gameObject: u.getAvatarJSON(),
                          transform: currentAvatarJSON.transform,
                        });
                      }
                    );
                  }

                  //alert client
                  socket.emit(
                    Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
                    'Save !'
                  );
                }
              );

              socket.on('disconnect', () => {
                console.log('Unregister client => ', socket.id);

                delete _this.currentUsersInGame[u.getUUID()];
                const thread = u.getThread();
                if (thread)
                  thread.post(
                    WorldThread.MSG_TYPES.REMOVE_GAMEOBJECT,
                    u.getAvatarID()
                  );
              });
            });

            //create a bbb rooom
            socket.on(
              Shared.Components.Constants.WEBSOCKET.MSG_TYPES.CREATE_BBB_ROOM,
              function (name) {
                _this.createBBBRoom({ name: name });
              }
            );

            const sendBBBUrls = function () {
              const data = [];
              for (let key in _this.bbbRooms) {
                const r = _this.bbbRooms[key];
                const url = r.getAttendeeURL();
                if (!url) continue;
                data.push({ url: url, name: r.name });
              }
              socket.emit(
                Shared.Components.Constants.WEBSOCKET.MSG_TYPES.ON_BBB_URLS,
                data
              );
            };
            setInterval(sendBBBUrls, 1000); //notify every second
          } else {
            socket.emit(
              Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
              'Please verify your email'
            );
          }
        })
        .catch((error) => {
          socket.emit(
            Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
            error.message
          );
        });
    });

    socket.on(Constants.WEBSOCKET.MSG_TYPES.GUEST_CONNECTION, function () {
      console.log('guest is connected');

      //entry
      let uuidWorld = _this.config.entryWorld;
      if (!(uuidWorld && _this.worldToThread[uuidWorld] != undefined)) {
        uuidWorld = Object.keys(_this.worldToThread)[0];
      }

      const nameUser = 'Guest';
      let avatarJSON = _this.assetsManager.fetchPrefabJSON('avatar');
      avatarJSON.components.LocalScript.conf.name = nameUser;
      RenderModule.bindColor(avatarJSON, [
        Math.random(),
        Math.random(),
        Math.random(),
      ]);
      avatarJSON = new GameObject(avatarJSON).toJSON(true); //fill missing fields

      const uuid = Shared.THREE.MathUtils.generateUUID();

      const extraData = {
        uuid: uuid,
        nameUser: nameUser,
        initialized: true,
        avatarJSON: avatarJSON,
      };

      const u = new User(uuid, socket, uuidWorld, extraData, true);

      //register the client
      _this.currentUsersInGame[u.getUUID()] = u;

      //inform client that he is connected and ready to game
      socket.emit(
        Constants.WEBSOCKET.MSG_TYPES.SIGNED,
        extraData.initialized,
        true
      );

      //wait for client to be ready
      socket.on(
        Constants.WEBSOCKET.MSG_TYPES.READY_TO_RECEIVE_STATE,
        function () {
          _this.placeAvatarInWorld(u.getAvatar().getUUID(), uuidWorld);
        }
      );

      socket.on(Constants.WEBSOCKET.MSG_TYPES.QUERY_AVATAR_GO, function () {
        socket.emit(
          Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
          'guest are not suppoed to query avatar'
        );
      });

      socket.on(Constants.WEBSOCKET.MSG_TYPES.SAVE_AVATAR_GO, function () {
        socket.emit(
          Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
          'guest are not suppoed to save avatar'
        );
      });

      socket.on('disconnect', () => {
        console.log('Unregister client => ', socket.id);

        delete _this.currentUsersInGame[u.getUUID()];
        const thread = u.getThread();
        if (thread)
          thread.post(WorldThread.MSG_TYPES.REMOVE_GAMEOBJECT, u.getAvatarID());
      });
    });

    socket.on(
      Constants.WEBSOCKET.MSG_TYPES.SAVE_WORLDS,
      function (partialMessage) {
        const fullMessage = Pack.recomposeMessage(partialMessage);
        if (fullMessage) {
          _this.saveWorlds(fullMessage, socket);
        }
      }
    );
  }

  cleanUnusedImages() {
    const folderPath = '../client/assets/img/uploaded/';

    fs.readFile(this.config.worldsPath, 'utf8', (err, data) => {
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

  saveWorlds(data, socket) {
    console.log('Save Worlds');

    const _this = this;
    const writeImagesOnDiskPromise = [];

    Shared.Components.JSONUtils.parse(data, function (json, key) {
      if (typeof json[key] == 'string' && json[key].startsWith('data:image')) {
        writeImagesOnDiskPromise.push(
          new Promise((resolve, reject) => {
            const bitmap = _this.dataUriToBuffer(json[key]);

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
        new World(json, {
          isServerSide: true,
          modules: { gm: gm, PNG: PNG },
        })
      );
    });

    Promise.all(writeImagesOnDiskPromise).then(function () {
      console.log('IMAGES WRITED ON DISK');

      const assetsManager = new AssetsManagerServer();
      assetsManager
        .loadFromConfig(_this.config.assetsManager)
        .then(function () {
          const loadPromises = [];

          worlds.forEach(function (w) {
            const loadPromise = WorldStateComputer.WorldTest(w, assetsManager, {
              Shared: Shared,
            });
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
                _this.config.worldsPath,
                JSON.stringify(content),
                {
                  encoding: 'utf8',
                  flag: 'w',
                  mode: 0o666,
                },
                function () {
                  console.log('WORLD WRITED ON DISK');

                  //disconnect all users in game
                  for (let key in _this.currentUsersInGame) {
                    const user = _this.currentUsersInGame[key];
                    user.getSocket().disconnect();
                    console.log(user.getUUID(), ' disnonnect');
                    delete _this.currentUsersInGame[key];
                  }

                  //reload worlds
                  _this.initWorlds();

                  _this.cleanUnusedImages();

                  socket.emit(
                    Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
                    'Worlds saved !'
                  );
                }
              );
            });
          } catch (e) {
            throw new Error(e);
          }
        });
    });
  }

  dataUriToBuffer(uri) {
    if (!/^data:/i.test(uri)) {
      throw new TypeError(
        '`uri` does not appear to be a Data URI (must begin with "data:")'
      );
    }
    // strip newlines
    uri = uri.replace(/\r?\n/g, '');
    // split the URI up into the "metadata" and the "data" portions
    const firstComma = uri.indexOf(',');
    if (firstComma === -1 || firstComma <= 4) {
      throw new TypeError('malformed data: URI');
    }
    // remove the "data:" scheme and parse the metadata
    const meta = uri.substring(5, firstComma).split(';');
    let charset = '';
    let base64 = false;
    const type = meta[0] || 'text/plain';
    let typeFull = type;
    for (let i = 1; i < meta.length; i++) {
      if (meta[i] === 'base64') {
        base64 = true;
      } else {
        typeFull += `;${meta[i]}`;
        if (meta[i].indexOf('charset=') === 0) {
          charset = meta[i].substring(8);
        }
      }
    }
    // defaults to US-ASCII only if type is not provided
    if (!meta[0] && !charset.length) {
      typeFull += ';charset=US-ASCII';
      charset = 'US-ASCII';
    }
    // get the encoded data portion and decode URI-encoded chars
    const encoding = base64 ? 'base64' : 'ascii';
    const data = unescape(uri.substring(firstComma + 1));
    const buffer = Buffer.from(data, encoding);
    // set `.type` and `.typeFull` properties to MIME type
    buffer.type = type;
    buffer.typeFull = typeFull;
    // set the `.charset` property
    buffer.charset = charset;
    return buffer;
  }
};

class BBB_ROOM {
  constructor(params, api) {
    this.uuid = Shared.THREE.MathUtils.generateUUID();

    this.name = params.name;

    this.api = api;

    this.moderatorUrl = null;
    this.attendeeUrl = null;
    this.meetingEndUrl = null;
  }

  createRoom() {
    const http = bbb.http;
    const _this = this;
    const api = this.api;

    const mPw = 'mpw';
    const aPw = 'apw';

    // api module itslef is responsible for constructing URLs
    const meetingCreateUrl = api.administration.create(this.name, this.uuid, {
      attendeePW: aPw,
      moderatorPW: mPw,
    });

    return new Promise((resolve) => {
      // http method should be used in order to make calls
      http(meetingCreateUrl).then(() => {
        // console.log(result);
        _this.moderatorUrl = api.administration.join(
          'moderator',
          _this.uuid,
          mPw
        );
        _this.attendeeUrl = api.administration.join(
          'attendee',
          _this.uuid,
          aPw
        );
        _this.meetingEndUrl = api.administration.end(_this.uuid, mPw);

        resolve(_this);
      });
    });
  }

  getAttendeeURL() {
    return this.attendeeUrl;
  }

  getModeratorUrl() {
    return this.moderatorUrl;
  }

  getUUID() {
    return this.uuid;
  }
}

module.exports = ServerModule;
