/** @format */

const udvShared = require('ud-viz/src/Game/Shared/Shared');
const Data = udvShared.Components.Data;
const Command = udvShared.Command;
const WorldState = udvShared.WorldState;

const WorldThread = require('./WorldThread');

const UserModule = class User {
  constructor(socket, worldUUID, avatarID, thread) {
    this.socket = socket;
    this.worldUUID = worldUUID;
    this.thread = thread;

    this.avatarID = avatarID;

    //to know if just joined or not
    this.lastState = null;

    this.init();
  }

  setAvatarID(id) {
    this.avatarID = id;
  }

  getAvatarID() {
    return this.avatarID;
  }

  sendWorldState(stateJSON) {
    let state = new WorldState(stateJSON);

    if (!this.lastState) {
      this.socket.emit(Data.WEBSOCKET.MSG_TYPES.JOIN_SERVER, {
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

  init() {
    const _this = this;

    //cmds
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
  }

  getUUID() {
    return this.socket.id;
  }
};

module.exports = UserModule;
