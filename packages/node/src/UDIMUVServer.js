const NodeConstant = require('./Constant');
const { Game, express } = require('@ud-viz/node');
const { Constant, PrefabFactory } = require('@ud-imuv/shared');
const Parse = require('parse/node');
const fs = require('fs');
const THREE = require('three');
const path = require('path');

module.exports = class UDIMUVServer {
  constructor() {
    /** @type {Game.SocketService} */
    this.gameSocketService = null;

    // eslint-disable-next-line no-undef
    Parse.serverURL = process.env.PARSE_SERVER_URL; // This is your Server URL
    Parse.initialize(
      // eslint-disable-next-line no-undef
      process.env.PARSE_APP_ID, // This is your Application ID
      null, // Javascript Key is not required with a self-hosted Parse Server
      // eslint-disable-next-line no-undef
      process.env.PARSE_MASTER_KEY // This is your Master key (never use it in the frontend)
    );
  }

  /**
   * The function starts a game socket service using the provided app.
   * @param {Express} app
   */
  start(httpServer, gameObjectsFolderPath) {
    this.gameSocketService = new Game.SocketService(httpServer, {
      socketReadyForGamePromises: [
        (socketWrapper, thread) => {
          return new Promise((resolve) => {
            // add an avatar in game

            const avatarJSON = PrefabFactory.avatar().toJSON();

            thread
              .apply(NodeConstant.THREAD.EVENT.SPAWN, avatarJSON)
              .then(() => {
                // register in wrapper avatar uuid
                socketWrapper.userData.avatarUUID = avatarJSON.uuid;
                socketWrapper.userData.settings = {};

                resolve();
              });
          });
        },
      ],
      socketDisconnectionCallbacks: [
        (socketWrapper, thread) => {
          console.log(socketWrapper.userData);

          // remove avatar
          thread.post(
            Game.Thread.MESSAGE_EVENT.REMOVE_OBJECT3D,
            socketWrapper.userData.avatarUUID
          );
        },
      ],
    });

    const indexWorldsJSON = JSON.parse(
      fs.readFileSync(gameObjectsFolderPath + '/index.json')
    );

    const gameObjects3D = [];
    for (const uuid in indexWorldsJSON) {
      let json = JSON.parse(
        fs.readFileSync(gameObjectsFolderPath + '/' + indexWorldsJSON[uuid])
      );

      if (json.version) {
        json = moulinetteWorldJSON(json);
        // console.log(json);
      }
      gameObjects3D.push(json);
    }

    this.gameSocketService.loadGameThreads(
      gameObjects3D,
      path.join(__dirname, 'thread.js')
    );

    // customize thread with the portal event
    for (const threadID in this.gameSocketService.threads) {
      const thread = this.gameSocketService.threads[threadID];
      thread.on(NodeConstant.THREAD.EVENT.PORTAL, (data) => {
        // find socket wrapper with avatarUUID
        let socketWrapper = null;
        for (let index = 0; index < thread.socketWrappers.length; index++) {
          const sw = thread.socketWrappers[index];
          if (sw.userData.avatarUUID == data.avatarUUID) {
            socketWrapper = sw;
            break;
          }
        }
        if (!socketWrapper) {
          console.warn('socket wrapper not in thread ', threadID);
          return; // can happen when avatar trigger portal event twice
        }

        // remove it from current thread
        thread.removeSocketWrapper(socketWrapper);
        // remove avatar from current thread
        thread.post(Game.Thread.MESSAGE_EVENT.REMOVE_OBJECT3D, data.avatarUUID);
        // add to the new thread
        const destThread =
          this.gameSocketService.threads[data.gameObjectDestUUID];
        if (!destThread) {
          console.log('uuid thread initialized');
          for (const gameObjectThreadUUID in this.gameSocketService.threads) {
            console.log(gameObjectThreadUUID);
          }
          throw new Error('cant find dest thread' + data.gameObjectDestUUID);
        }
        // add avatar
        const avatarJSON = PrefabFactory.avatar(); // dirty but do the job for now
        avatarJSON.uuid = data.avatarUUID; // tweak uuid (in future should rebuild the socket avatar avatar color + name)
        destThread
          .apply(NodeConstant.THREAD.EVENT.PORTAL, {
            object3D: avatarJSON,
            portalUUID: data.portalUUID,
          })
          .then(() => {
            // add it after to be sure avatar is in thread
            destThread.addSocketWrapper(socketWrapper);
          });
      });
    }
  }

  oldstart(config) {
    const app = express();
    app.use(express.static('./packages/browser'));
    // launch a customize gamesocketservice
    this.gameSocketService = new Game.SocketService(app.listen(config.port), {
      socketConnectionCallbacks: [
        (socketWrapper) => {
          // add userData in socket wrapper
          socketWrapper.userData.nameUser =
            'Guest@' + parseInt(Math.random() * 10000);
          socketWrapper.userData.role = Constant.USER.ROLE.GUEST;

          socketWrapper.socket.emit(Constant.WEBSOCKET.MSG_TYPE.SIGNED, {
            nameUser: socketWrapper.userData.nameUser,
            role: socketWrapper.userData.role,
          });

          // SIGN UP
          socketWrapper.socket.on(
            Constant.WEBSOCKET.MSG_TYPE.SIGN_UP,
            function (data) {
              (async () => {
                const user = new Parse.User();
                user.set(Constant.DB.USER.NAME, data.nameUser);
                user.set(Constant.DB.USER.EMAIL, data.email);
                user.set(Constant.DB.USER.PASSWORD, data.password);
                user.set(Constant.DB.USER.ROLE, Constant.USER.ROLE.DEFAULT);

                try {
                  await user.signUp();
                  socketWrapper.socket.emit(
                    Constant.WEBSOCKET.MSG_TYPE.SIGN_UP_SUCCESS
                  );
                } catch (error) {
                  console.error(
                    'Error while signing up user',
                    error.code,
                    error.message
                  );

                  socketWrapper.socket.emit(
                    Constant.WEBSOCKET.MSG_TYPE.INFO,
                    error.message
                  );
                }
              })();
            }
          );

          // SIGN IN
          socketWrapper.socket.on(
            Constant.WEBSOCKET.MSG_TYPE.SIGN_IN,
            (data) => {
              (async () => {
                try {
                  // Pass the username and password to logIn function
                  const parseUser = await Parse.User.logIn(
                    data.nameUser,
                    data.password
                  );

                  let alreadyLogged = false;
                  for (const id in this.gameSocketService.socketWrappers) {
                    const otherSW = this.gameSocketService.socketWrappers[id];

                    if (socketWrapper === otherSW) continue; // dont check himself

                    if (otherSW.userData.parseUser === parseUser) {
                      alreadyLogged = true;
                      break;
                    }
                  }

                  if (alreadyLogged)
                    throw new Error('already logged ' + parseUser.id);

                  // ref parseUser in socketWrapper
                  socketWrapper.userData.parseUser = parseUser;

                  // update client of the new name and role
                  socketWrapper.socket.emit(
                    Constant.WEBSOCKET.MSG_TYPE.SIGNED,
                    {
                      nameUser: await socketWrapper.userData.parseUser.get(
                        Constant.DB.USER.NAME
                      ),
                      role: await socketWrapper.userData.parseUser.get(
                        Constant.DB.USER.ROLE
                      ),
                    }
                  );
                } catch (error) {
                  console.error('Error while logging in user', error);
                  socketWrapper.socket.emit(
                    Constant.WEBSOCKET.MSG_TYPE.INFO,
                    error.message
                  );
                }
              })();
            }
          );
        },
      ],
      socketReadyForGamePromises: [
        (socketWrapper, thread) => {
          return new Promise((resolve) => {
            // add an avatar in game

            const avatarJSON = PrefabFactory.avatar().toJSON();

            thread
              .apply(NodeConstant.THREAD.EVENT.SPAWN, avatarJSON)
              .then(() => {
                // register in wrapper avatar uuid
                socketWrapper.userData.avatarUUID = avatarJSON.uuid;
                socketWrapper.userData.settings = {};

                resolve();
              });
          });
        },
      ],
      socketDisconnectionCallbacks: [
        (socketWrapper, thread) => {
          console.log(socketWrapper.userData);

          // remove avatar
          thread.post(
            Game.Thread.EVENT.REMOVE_OBJECT3D,
            socketWrapper.userData.avatarUUID
          );
        },
      ],
    });

    const indexWorldsJSON = JSON.parse(
      fs.readFileSync(config.gameObjectsFolderPath + '/index.json')
    );

    const gameObjects3D = [];
    for (const uuid in indexWorldsJSON) {
      let json = JSON.parse(
        fs.readFileSync(
          config.gameObjectsFolderPath + '/' + indexWorldsJSON[uuid]
        )
      );

      if (json.version) {
        json = moulinetteWorldJSON(json);
        // console.log(json);
      }

      gameObjects3D.push(json);
    }

    this.gameSocketService.loadGameThreads(
      gameObjects3D,
      './packages/node/src/thread.js'
    );

    // customize thread with the portal event
    for (const threadID in this.gameSocketService.threads) {
      const thread = this.gameSocketService.threads[threadID];
      thread.on(NodeConstant.THREAD.EVENT.PORTAL, (data) => {
        // find socket wrapper with avatarUUID
        let socketWrapper = null;
        for (let index = 0; index < thread.socketWrappers.length; index++) {
          const sw = thread.socketWrappers[index];
          if (sw.userData.avatarUUID == data.avatarUUID) {
            socketWrapper = sw;
            break;
          }
        }
        if (!socketWrapper) {
          console.warn('socket wrapper not in thread ', threadID);
          return; // can happen when avatar trigger portal event twice
        }

        // remove it from current thread
        thread.removeSocketWrapper(socketWrapper);
        // remove avatar from current thread
        thread.post(Game.Thread.EVENT.REMOVE_OBJECT3D, data.avatarUUID);
        // add to the new thread
        const destThread =
          this.gameSocketService.threads[data.gameObjectDestUUID];
        if (!destThread) {
          console.log('uuid thread initialized');
          for (const gameObjectThreadUUID in this.gameSocketService.threads) {
            console.log(gameObjectThreadUUID);
          }
          throw new Error('cant find dest thread' + data.gameObjectDestUUID);
        }
        // add avatar
        const avatarJSON = PrefabFactory.avatar(); // dirty but do the job for now
        avatarJSON.uuid = data.avatarUUID; // tweak uuid (in future should rebuild the socket avatar avatar color + name)
        destThread
          .apply(NodeConstant.THREAD.EVENT.PORTAL, {
            object3D: avatarJSON,
            portalUUID: data.portalUUID,
          })
          .then(() => {
            // add it after to be sure avatar is in thread
            destThread.addSocketWrapper(socketWrapper);
          });
      });
    }
  }
};

const moulinetteWorldJSON = (oldJSON) => {
  const newJSON = oldJSON.gameObject;

  const updateGameObject = (goJSON) => {
    const newGOJSON = {};
    newGOJSON.name = goJSON.name;
    newGOJSON.uuid = goJSON.uuid;
    newGOJSON.static = goJSON.static;
    newGOJSON.userData = goJSON.userData;
    newGOJSON.forceToJSONComponent = goJSON.forceSerializeComponents;
    newGOJSON.gameContextUpdate = !goJSON.noLocalUpdate;

    const position = new THREE.Vector3().fromArray(goJSON.transform.position);
    const scale = new THREE.Vector3().fromArray(goJSON.transform.scale);
    const euler = new THREE.Euler().fromArray(goJSON.transform.rotation);
    const o = new THREE.Object3D();
    o.setRotationFromEuler(euler);
    o.position.copy(position);
    o.scale.copy(scale);
    o.updateMatrix();
    newGOJSON.matrix = o.matrix.toArray();

    if (goJSON.children) {
      newGOJSON.children = [];
      goJSON.children.forEach((c) => {
        newGOJSON.children.push(updateGameObject(c));
      });
    }

    newGOJSON.components = {};

    if (goJSON.components.LocalScript) {
      const newIds = [];
      goJSON.components.LocalScript.idScripts.forEach((id) => {
        newIds.push(id);
      });

      newGOJSON.components.ExternalScript = {
        type: 'ExternalScript',
        idScripts: newIds,
        variables: goJSON.components.LocalScript.conf,
      };

      if (newIds.includes('image_id_ext_script')) {
        if (!newGOJSON.userData) newGOJSON.userData = {};
        newGOJSON.userData.isImage = true;
      }

      if (newIds.includes('portal_sweep_id_ext_script')) {
        if (!newGOJSON.userData) newGOJSON.userData = {};
        newGOJSON.userData.isPortal = true;
      }
    }

    if (goJSON.components.WorldScript) {
      const newIds = [];
      goJSON.components.WorldScript.idScripts.forEach((id) => {
        newIds.push(id);
      });

      newGOJSON.components.GameScript = {
        type: 'GameScript',
        idScripts: newIds,
        variables: goJSON.components.WorldScript.conf,
      };
    }

    if (goJSON.components.Collider) {
      newGOJSON.components.Collider = goJSON.components.Collider;
    }

    if (goJSON.components.Audio) {
      newGOJSON.components.Audio = goJSON.components.Audio;
    }

    if (goJSON.components.Render) {
      newGOJSON.components.Render = goJSON.components.Render;
      if (newGOJSON.components.Render.color.length === 3) {
        newGOJSON.components.Render.color.push(1); // add alpha
      }
    }

    return newGOJSON;
  };

  return updateGameObject(newJSON);
};
