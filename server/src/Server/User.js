/** @format */

const { GameObject } = require('ud-viz/src/Game/Game');
const Game = require('ud-viz/src/Game/Game');
const Constants = Game.Components.Constants;
const WorldState = Game.WorldState;

const UserModule = class User {
  constructor(uuid, socket, data, isGuest = false) {
    this.uuid = uuid;
    this.socket = socket;
    this.isGuest = isGuest;

    //to know if just joined or not
    this.lastState = null;

    this.data = data;
    this.avatarGO = new GameObject(data.avatarJSON);
  }

  getAvatarUUID() {
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

  getSocket() {
    return this.socket;
  }
};

module.exports = UserModule;
