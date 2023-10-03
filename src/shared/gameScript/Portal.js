const { Game } = require('@ud-viz/shared');
const Constant = require('../Constant');

module.exports = class Portal extends Game.ScriptBase {
  setTransformOf(object) {
    // portal position
    object.position.copy(this.object3D.position);

    if (this.variables.spawnRotation) {
      object.rotation.x = this.variables.spawnRotation.x;
      object.rotation.y = this.variables.spawnRotation.y;
      object.rotation.z = this.variables.spawnRotation.z;
    }

    object.setOutdated(true);
    this.context.updateCollisionBuffer();
  }

  onEnterCollision(object3DCollided) {
    if (object3DCollided.userData.isAvatar) {
      // wait 1 sec to let the fade out on the client side
      setTimeout(() => {
        this.context.dispatch(Constant.CONTEXT.EVENT.PORTAL, {
          avatarUUID: object3DCollided.uuid,
          gameObjectDestUUID: this.variables.gameObjectDestUUID,
          portalUUID: this.variables.portalUUID,
        });
      }, 1000);
    }
  }

  static get ID_SCRIPT() {
    return 'portal_id_script';
  }
};
