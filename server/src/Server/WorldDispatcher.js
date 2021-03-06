/** @format */

const fs = require('fs');
const WorldThread = require('./WorldThread');
const Game = require('ud-viz/src/Game/Game');

const ImuvConstants = require('../../../imuv.constants');

const BBB_ROOM_TAG = 'bbb_room_tag';

const WorldDispatcherModule = class WorldDispatcher {
  constructor(config, bbbWrapper) {
    this.config = config;

    //worlds json
    this.worldsJSON = null;

    //map world to thread
    this.worldToThread = {};

    //service
    this.bbbWrapper = bbbWrapper;
  }

  fetchUserInWorldWithUUID(uuid) {
    for (let key in this.worldToThread) {
      const thread = this.worldToThread[key];
      const user = thread.getUsers()[uuid];
      if (user) return user;
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
    console.log(this.constructor.name, 'init worlds');
    const _this = this;

    //clean
    for (let key in _this.worldToThread) {
      const thread = _this.worldToThread[key];
      thread.stop();
      delete _this.worldToThread[key];
    }

    const indexWorldsJSON = JSON.parse(
      fs.readFileSync(_this.config.worldsFolder + 'index.json')
    );

    const worldsJSON = [];

    for (let uuid in indexWorldsJSON) {
      const path = _this.config.worldsFolder + indexWorldsJSON[uuid];
      worldsJSON.push(JSON.parse(fs.readFileSync(path)));
    }

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
  }

  addUser(user) {
    if (this.fetchUserInWorldWithUUID(user.getUUID()))
      throw new Error('add user already added');

    const avatarUUID = user.getAvatarUUID();
    const worldUUID = this.config.uuidEntryWorld;
    // const worldUUID = '7027C0BF-BC84-48B6-BCFD-FA97DAE8874C'; //room conf

    this.placeAvatarInWorld(avatarUUID, worldUUID, null, user);
  }

  removeUser(user) {
    if (!user.getThread()) {
      console.warn('user not present in a thread');
      return;
    }

    user
      .getThread()
      .post(WorldThread.MSG_TYPES.REMOVE_GAMEOBJECT, user.getAvatarUUID());
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
      oldThread.post(
        WorldThread.MSG_TYPES.REMOVE_GAMEOBJECT,
        user.getAvatarUUID()
      );
    }

    thread.addUser(user);
    thread.post(WorldThread.MSG_TYPES.ADD_GAMEOBJECT, {
      gameObject: user.getAvatarJSON(),
      portalUUID: portalUUID,
    });

    const socket = user.getSocket();
    const _this = this;

    //remove old listener
    socket.removeAllListeners(
      ImuvConstants.WEBSOCKET.MSG_TYPES.CREATE_BBB_ROOM
    );
    socket.removeAllListeners(
      ImuvConstants.WEBSOCKET.MSG_TYPES.EDIT_CONF_COMPONENT
    );
    socket.removeAllListeners(ImuvConstants.WEBSOCKET.MSG_TYPES.COMMANDS);
    socket.removeAllListeners(ImuvConstants.WEBSOCKET.MSG_TYPES.SAVE_SETTINGS);
    socket.removeAllListeners(ImuvConstants.WEBSOCKET.MSG_TYPES.ADD_GAMEOBJECT);

    //create BBB rooms
    socket.on(
      ImuvConstants.WEBSOCKET.MSG_TYPES.CREATE_BBB_ROOM,
      function (params) {
        const worldJSON = _this.fetchWorldJSONWithUUID(worldUUID);

        if (!_this.bbbWrapper.hasBBBApi()) {
          socket.emit(
            ImuvConstants.WEBSOCKET.MSG_TYPES.SERVER_ALERT,
            'no bbb api'
          );
          return;
        }

        _this.bbbWrapper
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
      }
    );

    //client can edit conf component
    socket.on(
      ImuvConstants.WEBSOCKET.MSG_TYPES.EDIT_CONF_COMPONENT,
      function (params) {
        thread.post(WorldThread.MSG_TYPES.EDIT_CONF_COMPONENT, params);
      }
    );

    //cmds are now sent to the new thread
    socket.on(ImuvConstants.WEBSOCKET.MSG_TYPES.COMMANDS, function (cmdsJSON) {
      const commands = [];

      //parse
      cmdsJSON.forEach(function (cmdJSON) {
        const command = new Game.Command(cmdJSON);

        if (command.getUserID() == user.getUUID()) {
          //security so another client cant control another avatar
          commands.push(command);
        }
      });

      thread.post(WorldThread.MSG_TYPES.COMMANDS, commands);
    });

    //save settings
    socket.on(
      ImuvConstants.WEBSOCKET.MSG_TYPES.SAVE_SETTINGS,
      function (settingsJSON) {
        //write user
        user.setSettingsJSON(settingsJSON);

        //if role is not guest save in database
        const parseUser = user.getParseUser();
        if (!parseUser) return; //not a user registered
        parseUser.set('settings', JSON.stringify(settingsJSON));
        parseUser.save(null, { useMasterKey: true });
      }
    );

    //add go
    socket.on(
      ImuvConstants.WEBSOCKET.MSG_TYPES.ADD_GAMEOBJECT,
      function (goJSON) {
        thread.post(WorldThread.MSG_TYPES.ADD_GAMEOBJECT, {
          gameObject: goJSON,
        });
      }
    );
  }
};

module.exports = WorldDispatcherModule;
