const fs = require('fs');
const AssetsManagerServer = require('./AssetsManagerServer');
const WorldThread = require('./WorldThread');

const WorldDispatcherModule = class WorldDispatcher {
  constructor(config) {
    this.config = config;

    //worlds json
    this.worldsJSON = null;

    //map world to thread
    this.worldToThread = {};
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
        const uuid = users[userUUID].getAvatarID();
        if (avatarUUID == uuid) return users[userUUID];
      }
    }
    return null;
  }

  initWorlds() {
    console.log(this.constructor.name, 'init worlds');

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
        const thread = new WorldThread(_this.config.worldThread.script);

        //post data to create world
        thread.post(WorldThread.MSG_TYPES.INIT, worldJSON); //thread post function will pack data

        //mapping between world and thread
        _this.worldToThread[worldJSON.uuid] = thread;

        //callbacks

        //worldstate notification
        thread.on(WorldThread.MSG_TYPES.WORLDSTATE, function (worldstateJSON) {
          const users = thread.getUsers();
          for (let key in users) {
            users[key].sendWorldState(worldstateJSON);
          }
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

  addUser(user) {
    if (this.fetchUserInWorldWithUUID(user.getUUID()))
      throw new Error('add user already added');

    const avatarUUID = user.getAvatarID();
    const worldUUID = this.config.uuidEntryWorld;

    this.placeAvatarInWorld(avatarUUID, worldUUID, null, user);
  }

  removeUser(socketUUID) {
    const user = this.fetchUserWithSocketUUID(socketUUID);
    if (!user) {
      console.warn('no user to remove');
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
  }
};

module.exports = WorldDispatcherModule;
