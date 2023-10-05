const path = require('path');
const fs = require('fs');
const { SocketService, thread } = require('@ud-viz/game_node');
const { avatar } = require('../../src/shared/prefabFactory');
const { THREAD } = require('./constant');
const THREE = require('three');
const jwt = require('jsonwebtoken');

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

const runGameWebsocketService = (httpServer, gameObjectsFolderPath) => {
  const gameSocketService = new SocketService(httpServer, {
    socketReadyForGamePromises: [
      (socketWrapper, threadParent) => {
        return new Promise((resolve) => {
          const token = JSON.parse(
            socketWrapper.socket.handshake.headers.cookie
          ).token;

          jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET, (err, user) => {
            if (err) {
              socketWrapper.socket.disconnect(true);
            } else {
              // add an avatar in game
              const avatarJSON = avatar().toJSON();

              threadParent.apply(THREAD.EVENT.SPAWN, avatarJSON).then(() => {
                // register in wrapper avatar uuid
                socketWrapper.userData.avatarUUID = avatarJSON.uuid;
                socketWrapper.userData.settings = {};

                resolve();
              });
            }
          });
        });
      },
    ],
    socketDisconnectionCallbacks: [
      (socketWrapper, threadParent) => {
        console.log(socketWrapper.userData);

        // remove avatar
        threadParent.post(
          thread.MESSAGE_EVENT.REMOVE_OBJECT3D,
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

  gameSocketService.loadGameThreads(
    gameObjects3D,
    path.join(__dirname, 'gameThreadChild.js')
  );

  // customize threadParent with the portal event
  for (const threadParentID in gameSocketService.threadParents) {
    const threadParent = gameSocketService.threadParents[threadParentID];
    threadParent.on(THREAD.EVENT.PORTAL, (data) => {
      // find socket wrapper with avatarUUID
      let socketWrapper = null;
      for (let index = 0; index < threadParent.socketWrappers.length; index++) {
        const sw = threadParent.socketWrappers[index];
        if (sw.userData.avatarUUID == data.avatarUUID) {
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
      const destThread =
        gameSocketService.threadParents[data.gameObjectDestUUID];
      if (!destThread) {
        console.log('uuid threadParent initialized');
        for (const gameObjectThreadUUID in gameSocketService.threadParents) {
          console.log(gameObjectThreadUUID);
        }
        throw new Error(
          'cant find dest threadParent' + data.gameObjectDestUUID
        );
      }
      // add avatar
      const avatarJSON = avatar(); // dirty but do the job for now
      avatarJSON.uuid = data.avatarUUID; // tweak uuid (in future should rebuild the socket avatar avatar color + name)
      destThread
        .apply(THREAD.EVENT.PORTAL, {
          object3D: avatarJSON,
          portalUUID: data.portalUUID,
        })
        .then(() => {
          // add it after to be sure avatar is in threadParent
          destThread.addSocketWrapper(socketWrapper);
        });
    });
  }
};

module.exports = {
  runGameWebsocketService: runGameWebsocketService,
};
