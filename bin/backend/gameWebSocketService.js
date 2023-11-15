const path = require('path');
const fs = require('fs');
const { SocketService, thread } = require('@ud-viz/game_node');
const { avatar } = require('../../src/shared/prefabFactory');
const { WEBSOCKET } = require('../../src/shared/constant');
const { THREAD, PARSE } = require('./constant');
const PARSE_VALUE = require('../../src/shared/constant').PARSE.VALUE;
const THREE = require('three');
const jwt = require('jsonwebtoken');
const {
  checkIfSubStringIsVector3,
  checkIfSubStringIsEuler,
} = require('@ud-viz/utils_shared');
const { connect } = require('./parse');

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
      const scriptParams = [];
      goJSON.components.LocalScript.scriptParams.forEach((id) => {
        const sp = { id: id };
        if (id == 'add_itowns_layer_id_ext_script') {
          sp.priority = 10;
        }
        scriptParams.push(sp);
      });

      if (scriptParams.length) {
        newGOJSON.components.ExternalScript = {
          type: 'ExternalScript',
          scriptParams: scriptParams,
          variables: goJSON.components.LocalScript.conf,
        };

        if (
          goJSON.components.LocalScript.scriptParams.includes(
            'image_id_ext_script'
          )
        ) {
          if (!newGOJSON.userData) newGOJSON.userData = {};
          newGOJSON.userData.isImage = true;
        }

        if (
          goJSON.components.LocalScript.scriptParams.includes(
            'portal_sweep_id_ext_script'
          )
        ) {
          if (!newGOJSON.userData) newGOJSON.userData = {};
          newGOJSON.userData.isPortal = true;
        }
      }
    }

    if (goJSON.components.WorldScript) {
      const scriptParams = [];
      goJSON.components.WorldScript.scriptParams.forEach((id) => {
        if (id == 'avatar_not_allow_id_script') {
          newGOJSON.userData = newGOJSON.userData ? newGOJSON.userData : {};
          newGOJSON.userData.isCityNotAllowArea = true; // replace empty script by a userdata
          return;
        }
        scriptParams.push({ id: id });
      });

      if (scriptParams.length) {
        newGOJSON.components.GameScript = {
          type: 'GameScript',
          scriptParams: scriptParams,
          variables: goJSON.components.WorldScript.conf,
        };
      }
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

const readGameObjects3DAsJSON = (gameObjectsFolderPath) => {
  const indexWorldsJSON = JSON.parse(
    fs.readFileSync(gameObjectsFolderPath + '/index.json')
  );

  const gameObjects3D = [];
  for (const uuid in indexWorldsJSON) {
    let json = JSON.parse(
      fs.readFileSync(gameObjectsFolderPath + '/' + indexWorldsJSON[uuid])
    );

    // TODO: regenerate gameobjects.json
    if (json.version) {
      json = moulinetteWorldJSON(json);
    }
    gameObjects3D.push(json);
  }

  return gameObjects3D;
};

/**
 *
 * @param {import('http').HttpServer} httpServer
 * @param {string} gameObjectsFolderPath
 * @param {import('parse/node')} Parse
 * @returns {import("@ud-viz/game_node").SocketService} game socket service
 */
const createGameWebsocketService = (httpServer, gameObjectsFolderPath) => {
  const Parse = connect();

  const gameSocketService = new SocketService(httpServer, {
    socketReadyForGamePromises: [
      (socketWrapper, entryGameObject3DUUID, readyForGameParams) => {
        return new Promise((resolve, reject) => {
          const threadParent = gameSocketService.threads[entryGameObject3DUUID];

          const token = socketWrapper.socket.handshake.headers.cookie
            ? JSON.parse(socketWrapper.socket.handshake.headers.cookie).token
            : null;

          const addUserAvatar = (
            user,
            settings,
            avatarColor,
            avatarTextureFacePath,
            avatarIdRenderData
          ) => {
            // add an avatar in game
            const avatarObject3D = avatar(
              user.name,
              avatarColor,
              avatarTextureFacePath,
              avatarIdRenderData
            );

            const avatarJSON = avatarObject3D.toJSON();

            // register in socketWrapper.userData that will be sent to external context of this scoket client
            socketWrapper.userData.avatar = avatarJSON;
            socketWrapper.userData.gameObject3DUUID = entryGameObject3DUUID;
            socketWrapper.userData.settings = settings || {};
            socketWrapper.userData.user = user;

            if (
              readyForGameParams.userData &&
              checkIfSubStringIsVector3(readyForGameParams.userData.position) &&
              checkIfSubStringIsEuler(readyForGameParams.userData.rotation)
            ) {
              avatarObject3D.position.fromArray(
                readyForGameParams.userData.position.map((el) => parseFloat(el))
              );
              avatarObject3D.rotation.fromArray(
                readyForGameParams.userData.rotation
              );
              threadParent
                .apply(thread.MESSAGE_EVENT.ADD_OBJECT3D, {
                  object3D: avatarObject3D.toJSON(), // send the json with the right transform
                  updateCollisionBuffer: true,
                })
                .then(resolve);
            } else {
              threadParent.apply(THREAD.EVENT.SPAWN, avatarJSON).then(resolve);
            }
          };

          if (token) {
            // verify token
            jwt.verify(
              token,
              process.env.JSON_WEB_TOKEN_SECRET,
              (err, user) => {
                if (err) {
                  socketWrapper.socket.disconnect(true);
                  reject();
                } else {
                  // retrieve user in db
                  const query = new Parse.Query(Parse.User);
                  query
                    .get(user.id)
                    .then(async (parseUser) => {
                      if (!parseUser)
                        throw new Error('no parse user for this token'); // not a user registered

                      // retrieve settings
                      const settingsString = await parseUser.get(
                        PARSE.KEY.SETTINGS
                      );

                      // retrieve color
                      const avatarColorString = await parseUser.get(
                        PARSE.KEY.AVATAR_COLOR
                      );

                      // texture face
                      const avatarTextureFacePath = await parseUser.get(
                        PARSE.KEY.AVATAR_TEXTURE_FACE_PATH
                      );

                      // id render data
                      const avatarIdRenderData = await parseUser.get(
                        PARSE.KEY.AVATAR_ID_RENDER_DATA
                      );

                      addUserAvatar(
                        user,
                        settingsString ? JSON.parse(settingsString) : {},
                        avatarColorString
                          ? JSON.parse(avatarColorString)
                          : null,
                        avatarTextureFacePath,
                        avatarIdRenderData
                      );
                    })
                    .catch((error) => {
                      console.log(error);
                      socketWrapper.socket.disconnect(true);
                      resolve();
                    });
                }
              }
            );
          } else {
            // this is a guest
            addUserAvatar({
              role: PARSE_VALUE.ROLE_GUEST,
              name: 'Guest@' + parseInt(Math.random() * 10000),
            });
          }
        });
      },
    ],
    socketDisconnectionCallbacks: [
      (socketWrapper, threadParent) => {
        console.log(socketWrapper.userData);

        // remove avatar
        threadParent.post(
          thread.MESSAGE_EVENT.REMOVE_OBJECT3D,
          socketWrapper.userData.avatar.uuid
        );
      },
    ],
  });

  gameSocketService.loadGameThreads(
    readGameObjects3DAsJSON(gameObjectsFolderPath),
    path.join(__dirname, 'gameThreadChild.js')
  );

  // customize threadParent with the portal event
  for (const threadParentID in gameSocketService.threads) {
    const threadParent = gameSocketService.threads[threadParentID];
    threadParent.on(THREAD.EVENT.PORTAL, (data) => {
      // find socket wrapper with data.avatarUUID
      let socketWrapper = null;
      for (let index = 0; index < threadParent.socketWrappers.length; index++) {
        const sw = threadParent.socketWrappers[index];
        if (sw.userData.avatar.uuid == data.avatarUUID) {
          socketWrapper = sw;
          break;
        }
      }
      if (!socketWrapper) {
        console.warn('socket wrapper not in threadParent ', threadParentID);
        return; // can happen when avatar trigger portal event twice
      }

      // remove it from current threadParent
      threadParent.removeSocketWrapper(socketWrapper);
      // remove avatar from current threadParent
      threadParent.post(thread.MESSAGE_EVENT.REMOVE_OBJECT3D, data.avatarUUID);
      // add to the new threadParent
      const destThread = gameSocketService.threads[data.gameObjectDestUUID];
      if (!destThread) {
        console.log('uuid threadParent initialized');
        for (const gameObjectThreadUUID in gameSocketService.threads) {
          console.log(gameObjectThreadUUID);
        }
        throw new Error(
          'cant find dest threadParent' + data.gameObjectDestUUID
        );
      }
      // add avatar
      socketWrapper.userData.gameObject3DUUID = data.gameObjectDestUUID; // to indicate the client current Gameobject3D
      destThread
        .apply(THREAD.EVENT.PORTAL, {
          object3D: socketWrapper.userData.avatar,
          portalUUID: data.portalUUID,
        })
        .then(() => {
          // add it after to be sure avatar is in threadParent
          destThread.addSocketWrapper(socketWrapper);
        });
    });
  }

  return gameSocketService;
};

module.exports = {
  readGameObjects3DAsJSON: readGameObjects3DAsJSON,
  createGameWebsocketService: createGameWebsocketService,
};
