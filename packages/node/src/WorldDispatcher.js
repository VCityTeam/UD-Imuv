/** @format */

const fs = require('fs');
const WorldThread = require('./WorldThread');
const Game = require('ud-viz/src/Game/Game');
const Constant = require('@ud-imuv/shared').Constant;

const WorldDispatcherModule = class WorldDispatcher {
  constructor(config) {
    this.config = config;

    // worlds json
    this.worldsJSON = null;

    // map world to thread
    this.worldToThread = {};
  }

  fetchUserInWorldWithUUID(uuid) {
    for (const key in this.worldToThread) {
      const thread = this.worldToThread[key];
      const user = thread.getUsers()[uuid];
      if (user) return user;
    }
    return null;
  }

  fetchUserWithAvatarUUID(avatarUUID) {
    for (const key in this.worldToThread) {
      const thread = this.worldToThread[key];
      const users = thread.getUsers();
      for (const userUUID in users) {
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

  hasWorld(worldUUID) {
    if (this.worldToThread[worldUUID]) return true;

    return false;
  }

  initWorlds() {
    console.log(this.constructor.name, 'init worlds');
    const _this = this;

    // clean
    for (const key in _this.worldToThread) {
      const thread = _this.worldToThread[key];
      thread.stop();
      delete _this.worldToThread[key];
    }

    const indexWorldsJSON = JSON.parse(
      fs.readFileSync(_this.config.worldsFolder + 'index.json')
    );

    const worldsJSON = [];

    for (const uuid in indexWorldsJSON) {
      const path = _this.config.worldsFolder + indexWorldsJSON[uuid];
      worldsJSON.push(JSON.parse(fs.readFileSync(path)));
    }

    _this.worldsJSON = worldsJSON;

    worldsJSON.forEach(function (worldJSON) {
      // create a worldThread
      const thread = new WorldThread(_this.config.worldThread.script);

      // post data to create world
      thread.post(WorldThread.MSG_TYPE.INIT, worldJSON); // thread post function will pack data

      // mapping between world and thread
      _this.worldToThread[worldJSON.uuid] = thread;

      // callbacks

      // worldstate notification
      thread.on(WorldThread.MSG_TYPE.WORLDSTATE, function (worldstateJSON) {
        const users = thread.getUsers();
        for (const key in users) {
          users[key].sendWorldState(worldstateJSON);
        }
      });

      // avatar portal
      thread.on(WorldThread.MSG_TYPE.AVATAR_PORTAL, function (data) {
        const user = _this.fetchUserWithAvatarUUID(data.avatarUUID);
        _this.placeAvatarInWorld(user, data.worldUUID, data.portalUUID, null);
      });
    });
  }

  addUser(user, data) {
    if (this.fetchUserInWorldWithUUID(user.getUUID())) {
      console.warn('add user already added');
      return;
    }

    let worldUUID = null;

    if (data && data.worldUUID) {
      worldUUID = data.worldUUID;
    } else {
      worldUUID = this.config.uuidEntryWorld;
    }

    let transform = null;
    if (data) {
      transform = {};
      transform.position = data.position;
      transform.rotation = data.rotation;
    }

    this.placeAvatarInWorld(user, worldUUID, null, transform);
  }

  removeUser(user) {
    if (!user.getThread()) {
      console.warn('user not present in a thread');
      return;
    }

    user
      .getThread()
      .post(WorldThread.MSG_TYPE.REMOVE_GAMEOBJECT, user.getAvatarUUID());
    user.getThread().removeUser(user);
  }

  placeAvatarInWorld(user, worldUUID, portalUUID, transform) {
    const thread = this.worldToThread[worldUUID];
    if (!thread) {
      console.warn('no thread with world uuid ', worldUUID);
      return;
    }

    // remove from last world if one
    const oldThread = user.getThread();
    if (oldThread) {
      oldThread.removeUser(user);
      oldThread.post(
        WorldThread.MSG_TYPE.REMOVE_GAMEOBJECT,
        user.getAvatarUUID()
      );
    }

    thread.addUser(user);
    thread.post(WorldThread.MSG_TYPE.ADD_GAMEOBJECT, {
      gameObject: user.getAvatarJSON(),
      portalUUID: portalUUID,
      transform: transform,
      isInsideMap: true,
    });

    const socket = user.getSocket();

    // remove old listener
    socket.removeAllListeners(Constant.WEBSOCKET.MSG_TYPE.EDIT_CONF_COMPONENT);
    socket.removeAllListeners(Constant.WEBSOCKET.MSG_TYPE.COMMANDS);
    socket.removeAllListeners(Constant.WEBSOCKET.MSG_TYPE.SAVE_SETTINGS);
    socket.removeAllListeners(Constant.WEBSOCKET.MSG_TYPE.ADD_GAMEOBJECT);
    socket.removeAllListeners(Constant.WEBSOCKET.MSG_TYPE.REMOVE_GAMEOBJECT);

    // client can edit conf component
    socket.on(
      Constant.WEBSOCKET.MSG_TYPE.EDIT_CONF_COMPONENT,
      function (params) {
        thread.post(WorldThread.MSG_TYPE.EDIT_CONF_COMPONENT, params);
      }
    );

    // cmds are now sent to the new thread
    socket.on(Constant.WEBSOCKET.MSG_TYPE.COMMANDS, function (cmdsJSON) {
      const commands = [];

      // parse
      cmdsJSON.forEach(function (cmdJSON) {
        const command = new Game.Command(cmdJSON);

        // if (command.getUserID() == user.getUUID()) {
        commands.push(command);
        // }
      });

      thread.post(WorldThread.MSG_TYPE.COMMANDS, commands);
    });

    // save settings
    socket.on(
      Constant.WEBSOCKET.MSG_TYPE.SAVE_SETTINGS,
      function (settingsJSON) {
        // write user
        user.setSettingsJSON(settingsJSON);

        // if role is not guest save in database
        const parseUser = user.getParseUser();
        if (!parseUser) return; // not a user registered
        parseUser.set(Constant.DB.USER.SETTINGS, JSON.stringify(settingsJSON));
        parseUser.save(null, { useMasterKey: true });
      }
    );

    // add go (TODO security check if its a go that can be add)
    socket.on(Constant.WEBSOCKET.MSG_TYPE.ADD_GAMEOBJECT, function (goJSON) {
      thread.post(WorldThread.MSG_TYPE.ADD_GAMEOBJECT, {
        gameObject: goJSON,
        isInsideMap: false,
      });
    });

    // remove go (TODO security check if its go that can be deleted)
    socket.on(Constant.WEBSOCKET.MSG_TYPE.REMOVE_GAMEOBJECT, function (uuid) {
      thread.post(WorldThread.MSG_TYPE.REMOVE_GAMEOBJECT, uuid);
    });
  }
};

module.exports = WorldDispatcherModule;
