/**@format */

module.exports = class ZeppelinStart {
  constructor() {}

  interaction(localCtx) {
    console.log('interaction ZeppelinStart');
    const rootGO = localCtx.getRootGameObject();
    const controller = rootGO.fetchLocalScripts()['controller'];

    const avatarUnsetted = controller.setAvatarControllerMode(false, localCtx);
    const zeppelinSetted = controller.setZeppelinControllerMode(true, localCtx);

    if (avatarUnsetted || zeppelinSetted) {
      const manager = localCtx.getGameView().getInputManager();
      const cb = function () {
        controller.setZeppelinControllerMode(false, localCtx);
        controller.setAvatarControllerMode(true, localCtx);
        controller.setAvatarVisible(true);
        manager.removeInputListener(cb);
      };
      controller.setAvatarVisible(false);
      manager.addKeyInput('e', 'keydown', cb);
    }
  }
};
