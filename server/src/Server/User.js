/** @format */

const { GameObject } = require('ud-viz/src/Game/Shared/Shared');
const udvShared = require('ud-viz/src/Game/Shared/Shared');
const Constants = udvShared.Components.Constants;
const Command = udvShared.Command;
const WorldState = udvShared.WorldState;
const WorldThread = require('./WorldThread');

const UserModule = class User {
  constructor(uuid, socket, worldUUID, data, isGuest = false) {
    this.uuid = uuid;
    this.socket = socket;
    this.worldUUID = worldUUID;
    this.isGuest = isGuest;

    //to know if just joined or not
    this.lastState = null;

    this.data = data;
    this.avatarGO = new GameObject(data.avatarJSON);
  }

  getAvatarID() {
    return this.avatarGO.getUUID();
  }

  getAvatar() {
    return this.avatarGO;
  }

  getAvatarJSON() {
    return this.data.avatarJSON;
  }

  setAvatarJSON(json) {
    this.avatarGO = new GameObject(json);
    this.data.avatarJSON = json;
  }

  sendWorldState(stateJSON) {
    let state = new WorldState(stateJSON);

    if (!this.lastState) {
      this.socket.emit(Constants.WEBSOCKET.MSG_TYPES.JOIN_WORLD, {
        state: stateJSON,
        avatarUUID: this.getAvatarID(),
      });
    } else {
      const diffJSON = state.toDiff(this.lastState);
      this.socket.emit(Constants.WEBSOCKET.MSG_TYPES.WORLDSTATE_DIFF, diffJSON);
    }

    this.lastState = state;
  }

  getThread() {
    return this.thread;
  }

  initThread(thread) {
    if (!thread) throw new Error('no thread to init user');

    const _this = this;

    //remove from last world
    if (this.thread) {
      this.thread.post(
        WorldThread.MSG_TYPES.REMOVE_GAMEOBJECT,
        this.getAvatarID()
      );
    }

    //assign
    this.thread = thread;
    this.lastState = null;
    this.socket.removeAllListeners(Constants.WEBSOCKET.MSG_TYPES.COMMANDS);

    //cmds are now sent to the new thread
    this.socket.on(Constants.WEBSOCKET.MSG_TYPES.COMMANDS, function (cmdsJSON) {
      const commands = [];

      //parse
      cmdsJSON.forEach(function (cmdJSON) {
        const command = new Command(cmdJSON);
        command.setUserID(_this.getUUID());
        command.setAvatarID(_this.getAvatarID());
        commands.push(command);
      });

      _this.thread.post(WorldThread.MSG_TYPES.COMMANDS, commands);
    });
  }

  getUUID() {
    return this.uuid;
  }

  getSocket() {
    return this.socket;
  }
};

module.exports = UserModule;
