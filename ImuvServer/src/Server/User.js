/** @format */

const udvShared = require('ud-viz/src/Game/Shared/Shared');
const Data = udvShared.Components.Data;
const Command = udvShared.Command;
const WorldState = udvShared.WorldState;

const WorldThread = require('./WorldThread');

const UserModule = class User {
  constructor(socket, worldUUID, avatar) {
    this.socket = socket;
    this.worldUUID = worldUUID;

    this.avatar = avatar;

    //to know if just joined or not
    this.lastState = null;
  }

  getAvatarID() {
    return this.avatar.getUUID();
  }

  getAvatar() {
    return this.avatar;
  }

  sendWorldState(stateJSON) {
    let state = new WorldState(stateJSON);

    if (!this.lastState) {
      this.socket.emit(Data.WEBSOCKET.MSG_TYPES.JOIN_WORLD, {
        state: stateJSON,
        avatarID: this.getAvatarID(),
      });
    } else {
      const diffJSON = state.toDiff(this.lastState);
      this.socket.emit(Data.WEBSOCKET.MSG_TYPES.WORLDSTATE_DIFF, diffJSON);
    }

    this.lastState = state;
  }

  getThread() {
    return this.thread;
  }

  init(thread) {
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
    this.socket.removeAllListeners(Data.WEBSOCKET.MSG_TYPES.COMMANDS);

    //cmds are now sent to the new thread
    this.socket.on(Data.WEBSOCKET.MSG_TYPES.COMMANDS, function (cmdsJSON) {
      const commands = [];
      //parse
      cmdsJSON.forEach(function (cmdJSON) {
        const command = new Command(cmdJSON);
        //sign command
        command.setUserID(_this.getUUID());
        command.setAvatarID(_this.getAvatarID());
        commands.push(command);
      });

      _this.thread.post(WorldThread.MSG_TYPES.COMMANDS, commands);
    });

    //add avatar in the new world
    if (!this.thread) console.log(this);
    this.thread.post(
      WorldThread.MSG_TYPES.ADD_GAMEOBJECT,
      this.avatar.toJSON(true)
    );
  }

  getUUID() {
    return this.socket.id;
  }
};

module.exports = UserModule;
