const { Game } = require('@ud-viz/shared');
const { Constant } = require('@ud-imuv/shared');

module.exports = class Portal extends Game.ScriptBase {
  notifyEnter(avatarGo) {
    setTimeout(() => {
      this.context.dispatch(Constant.CONTEXT.EVENT.PORTAL, [
        avatarGo,
        this.variables.worldDestUUID,
        this.variables.portalUUID,
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
