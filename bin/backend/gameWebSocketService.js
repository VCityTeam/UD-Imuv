const path = require('path');
const fs = require('fs');
const { SocketService, thread } = require('@ud-viz/game_node');
const { avatar } = require('../../src/shared/prefabFactory');
const { THREAD, PARSE } = require('./constant');
const PARSE_VALUE = require('../../src/shared/constant').PARSE.VALUE;
const jwt = require('jsonwebtoken');
const {
  checkIfSubStringIsVector3,
  checkIfSubStringIsEuler,
} = require('@ud-viz/utils_shared');
const { connect } = require('./parse');
const cookie = require('cookie');

const readGameObjects3DAsJSON = (gameObjectsFolderPath) => {
  const indexWorldsJSON = JSON.parse(
    fs.readFileSync(gameObjectsFolderPath + '/index.json')
  );

  const gameObjects3D = [];
  for (const uuid in indexWorldsJSON) {
    const json = JSON.parse(
      fs.readFileSync(gameObjectsFolderPath + '/' + indexWorldsJSON[uuid])
    );

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

          const imuvCookie = cookie.parse(
            socketWrapper.socket.handshake.headers.cookie || ''
          ).imuv;

          const token = imuvCookie ? JSON.parse(imuvCookie).token : null;

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

            // register in socketWrapper.userData that will be sent to external context of this socket client
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
                  const queryUser = new Parse.Query(Parse.User);
                  queryUser
                    .get(user.id)
                    .then(async (userResult) => {
                      const settings = {};
                      const settingsID = userResult.get(PARSE.KEY.SETTINGS.ID);

                      if (settingsID) {
                        const Settings = Parse.Object.extend(
                          PARSE.CLASS.SETTINGS
                        );
                        const querySettings = new Parse.Query(Settings);

                        await querySettings
                          .get(settingsID)
                          .then((settingResult) => {
                            for (const key in PARSE.KEY.SETTINGS) {
                              settings[PARSE.KEY.SETTINGS[key]] =
                                settingResult.get(PARSE.KEY.SETTINGS[key]);
                            }
                          })
                          .catch(() => {
                            console.error('no setting matches ID');
                            userResult.set(PARSE.KEY.SETTINGS.ID, null);
                            userResult.save(null, { useMasterKey: true });
                            resolve();
                          });
                      }

                      addUserAvatar(user, settings);
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
