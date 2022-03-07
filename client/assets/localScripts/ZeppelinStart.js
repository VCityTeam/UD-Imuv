/**@format */

module.exports = class ZeppelinStart {
  constructor() {}

  interaction(localCtx) {
    console.log('interaction ZeppelinStart');
    const rootGO = localCtx.getRootGameObject();
    const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];
    const zeppelinController =
      rootGO.fetchLocalScripts()['zeppelin_controller'];

    if (!zeppelinController) throw new Error('no zeppelin controller script');

    const avatarUnsetted = avatarController.setAvatarControllerMode(false, localCtx);
    const zeppelinSetted = zeppelinController.setZeppelinControllerMode(true, localCtx);

    if (avatarUnsetted || zeppelinSetted) {
      const manager = localCtx.getGameView().getInputManager();
      const cb = function () {
        zeppelinController.setZeppelinControllerMode(false, localCtx);
        avatarController.setAvatarControllerMode(true, localCtx);
        avatarController.setAvatarVisible(true);
        manager.removeInputListener(cb);
      };
      avatarController.setAvatarVisible(false);
      manager.addKeyInput('e', 'keydown', cb);
    }
  }
};
