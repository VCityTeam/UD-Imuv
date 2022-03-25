/**@format */

module.exports = class ZeppelinStart {
  constructor() {}

  interaction(localCtx) {
    const rootGO = localCtx.getRootGameObject();
    const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];
    const zeppelinController =
      rootGO.fetchLocalScripts()['zeppelin_controller'];
    const camera = rootGO.fetchLocalScripts()['camera'];

    if (!camera) throw new Error('no camera script');
    if (!avatarController) throw new Error('no avatar controller script');
    if (!zeppelinController) throw new Error('no zeppelin controller script');

    //when leaving zeppelin avatar is still at the interaction check if he was already in zeppelin mode

    const avatarUnsetted = avatarController.setAvatarControllerMode(
      false,
      localCtx
    );
    const zeppelinSetted = zeppelinController.setZeppelinControllerMode(
      true,
      localCtx
    );

    if (avatarUnsetted || zeppelinSetted) {
      const manager = localCtx.getGameView().getInputManager();
      const cb = function () {
        zeppelinController.setZeppelinControllerMode(false, localCtx);
        avatarController.setAvatarControllerMode(true, localCtx);
        camera.setAvatarVisible(true);
        manager.removeInputListener(cb);
      };
      camera.setAvatarVisible(false);
      manager.addKeyInput('e', 'keydown', cb);
    }
  }
};
