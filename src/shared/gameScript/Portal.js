const { ScriptBase } = require('@ud-viz/game_shared');
const { CONTEXT } = require('../constant');
const ImuvCommandManager = require('./ImuvCommandManager');

module.exports = class Portal extends ScriptBase {
  init() {
    this.commandManager = this.context.findGameScriptWithID(
      ImuvCommandManager.ID_SCRIPT
    );
  }

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
      this.commandManager.freeze(object3DCollided, true);// avatar cant move
      setTimeout(() => {
        this.context.dispatch(CONTEXT.EVENT.PORTAL, {
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
