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
};

module.exports = WorldDispatcherModule;
