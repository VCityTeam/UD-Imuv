/** @format */

const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Portal {
  constructor(conf, GameModule) {
    this.conf = conf;
    this.go = null;
    Game = GameModule;
  }

  init() {
    this.go = arguments[0];
    this.worldCtxt = arguments[1];
    this.localScript = this.go.getComponent(Game.LocalScript.TYPE);
  }

  notifyEnter(avatarGo, avatarWS) {
    console.log(avatarGo);
    avatarGo.setFreeze(true);

    const conf = this.conf;
    const world = this.worldCtxt.getWorld();
    setTimeout(function () {
      avatarGo.setFreeze(false);
      world.notify('portalEvent', [
        avatarGo,
        conf.worldDestUUID,
        conf.portalUUID,
      ]);
    }, 1000);
  }

  setTransformOf(go) {
    //portal position
    go.setPosition(this.go.getPosition().clone());

    //rotation in config
    const newRotation = go.getRotation();

    if (this.conf.spawnRotation) {
      newRotation.x = this.conf.spawnRotation.x;
      newRotation.y = this.conf.spawnRotation.y;
      newRotation.z = this.conf.spawnRotation.z;
    }

    go.setRotation(newRotation);
  }
};
