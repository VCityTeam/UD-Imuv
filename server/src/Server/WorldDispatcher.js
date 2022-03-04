/** @format */

const fs = require('fs');
const WorldThread = require('./WorldThread');
const Game = require('ud-viz/src/Game/Game');

const BBB_ROOM_TAG = 'bbb_room_tag';

const WorldDispatcherModule = class WorldDispatcher {
  constructor(config, serviceWrapper) {
    this.config = config;

    //worlds json
    this.worldsJSON = null;

    //map world to thread
    this.worldToThread = {};

    //service
    this.serviceWrapper = serviceWrapper;
  }

  fetchUserInWorldWithUUID(uuid) {
    for (let key in this.worldToThread) {
      const thread = this.worldToThread[key];
      const user = thread.getUsers()[uuid];
      if (user) return user;
    }
    return null;
  }

  fetchUserWithSocketUUID(socketUUID) {
    for (let key in this.worldToThread) {
      const thread = this.worldToThread[key];
      const users = thread.getUsers();
      for (let userUUID in users) {
        const uuid = users[userUUID].getSocket().id;
        if (socketUUID == uuid) return users[userUUID];
      }
    }
    return null;
  }

  fetchUserWithAvatarUUID(avatarUUID) {
    for (let key in this.worldToThread) {
      const thread = this.worldToThread[key];
      const users = thread.getUsers();
      for (let userUUID in users) {
        const uuid = users[userUUID].getAvatarUUID();
        if (avatarUUID == uuid) return users[userUUID];
      }
    }
    return null;
  }

  fetchWorldJSONWithUUID(worldUUID) {
    for (let index = 0; index < this.worldsJSON.length; index++) {
      const element = this.worldsJSON[index];
      if (element.uuid == worldUUID) return element;
    }

    return null;
  }

  initWorlds() {
    return new Promise((resolve, reject) => {
      console.log(this.constructor.name, 'init worlds');
      const _this = this;

      //clean
      for (let key in _this.worldToThread) {
        const thread = _this.worldToThread[key];
        thread.stop();
        delete _this.worldToThread[key];
      }

      fs.readFile(_this.config.worldsPath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const worldsJSON = JSON.parse(data);

        _this.worldsJSON = worldsJSON;

        worldsJSON.forEach(function (worldJSON) {
          //create a worldThread
          const thread = new WorldThread(_this.config.worldThread.script);

          //post data to create world
          thread.post(WorldThread.MSG_TYPES.INIT, worldJSON); //thread post function will pack data

          //mapping between world and thread
          _this.worldToThread[worldJSON.uuid] = thread;

          //callbacks

          //worldstate notification
          thread.on(
            WorldThread.MSG_TYPES.WORLDSTATE,
            function (worldstateJSON) {
              const users = thread.getUsers();
              for (let key in users) {
                users[key].sendWorldState(worldstateJSON);
              }
            }
          );

          //avatar portal
          thread.on(WorldThread.MSG_TYPES.AVATAR_PORTAL, function (data) {
            _this.placeAvatarInWorld(
              data.avatarUUID,
              data.worldUUID,
              data.portalUUID
            );
          });

          resolve();
        });
      });
    });
  }

  addUser(user) {
    if (this.fetchUserInWorldWithUUID(user.getUUID()))
      throw new Error('add user already added');

    const avatarUUID = user.getAvatarUUID();
    const worldUUID = this.config.uuidEntryWorld;
    // const worldUUID = '7027C0BF-BC84-48B6-BCFD-FA97DAE8874C'; //room conf

    this.placeAvatarInWorld(avatarUUID, worldUUID, null, user);
  }

  removeUser(socketUUID) {
    const user = this.fetchUserWithSocketUUID(socketUUID);
    if (!user) {
      console.warn('no user in thread to remove');
      return;
    }

    user.getThread().removeUser(user);
  }

  placeAvatarInWorld(avatarUUID, worldUUID, portalUUID, user) {
    //find user with avatar uuid
    if (!user) user = this.fetchUserWithAvatarUUID(avatarUUID);

    if (!user) throw new Error('no user with avatar id ', avatarUUID);

    const thread = this.worldToThread[worldUUID];

    if (!thread) throw new Error('no thread with world uuid ', worldUUID);

    //remove from last world if one
    const oldThread = user.getThread();
    if (oldThread) {
      oldThread.removeUser(user);
    }

    thread.addUser(user, portalUUID);

    const socket = user.getSocket();
    const Constants = Game.Components.Constants;
    const _this = this;
    socket.on(Constants.WEBSOCKET.MSG_TYPES.CREATE_BBB_ROOM, function (params) {
      const worldJSON = _this.fetchWorldJSONWithUUID(worldUUID);

      if (!_this.serviceWrapper.hasBBBApi()) {
        socket.emit(Constants.WEBSOCKET.MSG_TYPES.SERVER_ALERT, 'no bbb api');
        return;
      }

      _this.serviceWrapper
        .createBBBRoom(worldUUID, worldJSON.name)
        .then(function (value) {
          //write dynamically bbb urls in localscript conf
          thread.post(WorldThread.MSG_TYPES.EDIT_CONF_COMPONENT, {
            goUUID: params.goUUID,
            componentUUID: params.componentUUID,
            key: BBB_ROOM_TAG,
            value: value,
          });
          console.log(worldJSON.name, ' create bbb room');
        });
    });
  }
};

module.exports = WorldDispatcherModule;
