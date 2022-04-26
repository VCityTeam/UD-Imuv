/** @format */

const Game = require('ud-viz/src/Game/Game');
const Constants = Game.Components.Constants;
const WorldState = Game.WorldState;

const UserModule = class User {
  constructor(uuid, socket, avatarJSON, role, nameUser) {
    this.uuid = uuid;
    this.socket = socket;

    this.role = role;
    this.nameUser = nameUser;

    //to know if just joined or not
    this.lastState = null;

    this.avatarJSON = avatarJSON;
  }

  getAvatarUUID() {
    return this.avatarJSON.uuid;
  }

  getAvatarJSON() {
    return this.avatarJSON;
  }

  setAvatarJSON(json) {
    this.avatarJSON = json;
  }

  sendWorldState(stateJSON) {
    let state = new WorldState(stateJSON);

    if (!this.lastState) {
      this.socket.emit(Constants.WEBSOCKET.MSG_TYPES.JOIN_WORLD, {
        state: stateJSON,
        avatarUUID: this.getAvatarUUID(),
        userID: this.getUUID(),
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

  setThread(thread) {
    //assign
    this.thread = thread;
    this.lastState = null;
  }

  getUUID() {
    return this.uuid;
  }

  setUUID(value) {
    this.uuid = value;
  }

  getSocket() {
    return this.socket;
  }

  getNameUser() {
    return this.nameUser;
  }

  setNameUser(value) {
    this.nameUser = value;
    this.avatarJSON.components.LocalScript.conf.name = value;
  }

  getRole() {
    return this.role;
  }

  setRole(value) {
    this.role = value;
  }
};

UserModule.Role = {
  GUEST: 'guest',
  USER: 'user',
  ADMIN: 'admin',
};

module.exports = UserModule;
