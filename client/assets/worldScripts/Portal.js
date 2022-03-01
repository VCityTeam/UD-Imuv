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
    this.conf.delay = 1000; // Test antoher way than a delay :O
  }

  notifyEnter(avatarGo, avatarWS) {
    avatarWS.setPause(true);
    const conf = this.conf;
    const delayInMilliseconds = conf.delay;
    console.log(delayInMilliseconds);
    const world = this.worldCtxt.getWorld();
    setTimeout(function () {
      console.log('Teleport');
      avatarWS.setPause(false);
      world.notify('portalEvent', [
        avatarGo,
        conf.worldDestUUID,
        conf.portalUUID,
      ]);
    }, delayInMilliseconds);
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
